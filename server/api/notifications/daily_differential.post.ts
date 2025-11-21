import { Resend } from 'resend'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getPdsData } from "#shared/utils/getPdsData"
import type { Building } from '../../../shared/types/building'

const config = useRuntimeConfig()
const resend = new Resend(config.resendApiKey)

type Recipient = {
  email: string
}

export default defineEventHandler(async (event) => {
  const apiKey = getHeader(event, 'pdsApiKey')
  const expectedApiKey = config.appApiKey

  if (!apiKey || apiKey !== expectedApiKey) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized: Invalid API key' }
  }

  const client = await serverSupabaseServiceRole(event)
  const getRecipients = await client
    .from('profiles')
    .select('email')
    .eq('daily_differential_warning_notification', true)
    .returns<Recipient[]>()

  const recipientsList = getRecipients.data?.map((recipient) => recipient.email)

  const pdsData = await getPdsData(client, async (pdsList: string[]) => {
    return await $fetch<Building[]>('/api/buildings', {
      method: 'POST',
      body: { pds: pdsList }
    })
  })

  const qminWarningList = pdsData.filter((item) => {
    if (
      item.consumption.last_qmin &&
      item.consumption.qmin_daily_differential &&
      (item.consumption.last_qmin - item.consumption.qmin_daily_differential > 50)
      && item.building?.missions_status?.[0] !== 'Refus / Abandon / Suspendu'
    ) { return item }
  })

  const indexWarningList = pdsData.filter((item) => {
    if (
      item.consumption.last_index &&
      item.consumption.index_daily_differential &&
      (item.consumption.last_index - item.consumption.index_daily_differential > 50)
    ) { return item }
  })

  const sendNotification = async (recipient: string, html: string) => {
    const { data, error } = await resend.emails.send({
      from: 'Impact Copro <noreply@impact-copro.com>',
      to: recipient,
      subject: 'Interface consommation : Notification de différentiel quotidien',
      html: html,
    });
  
    if (error) {
      return console.error({ error });
    }
  
  }

  let html = `
  <div style="background-color:#f9fafb; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; color:#111827; padding:32px; text-align:center;">
    <div style="max-width:480px; margin:auto; background-color:#ffffff; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.05); padding:32px;">
      <h2 style="font-size:24px; font-weight:600; margin-bottom:16px;">Suivi des différentiels quotidien</h2>
      <p style="font-size:14px; color:#374151; margin-bottom:24px;">
        Voici les différentiels en date du {{ date }} qui requièrent votre attention
      </p>
      <h3 style="font-size:16px; font-weight:600; margin-bottom:16px; text-align:left;">Écoulement permanent</h3>
      <div style="margin-bottom:24px;">
        {{ qminTable }}
      </div>
      <a href="https://pds.impact-copro.com/" target="_blank" style="display:inline-block; background-color:rgb(21, 110, 225); color:#ffffff; text-decoration:none; border:none; padding:6px 20px; border-radius:calc(infinity * 1px); cursor:pointer; font-size:13px; font-weight:500;">
        Accéder à l'interface
      </a>
      <p style="font-size:14px; color:#6b7280; margin-top:16px;">
        Vous avez reçu cet email car vous avez activé les notifications de différentiel hebdomadaire sur votre profil.
        Vous pouvez vous désinscrire de ces notifications depuis <a href="https://pds.impact-copro.com/profile">la page suivante</a>.
      </p>

    </div>
  </div>
  `

  html = html.replace('{{ date }}', new Date().toLocaleDateString('fr-FR'))
  
  const formatDifferential = (value: number | null | undefined): string => {
    if (value == null) return ''
    return Number(value).toFixed(2)
  }

  const getIndexJ1 = (item: typeof qminWarningList[0]): string => {
    if (item.consumption?.index_daily_differential != null && item.consumption?.last_index != null) {
      return formatDifferential(item.consumption.last_index - item.consumption.index_daily_differential)
    }
    return ''
  }

  const getQminJ1 = (item: typeof qminWarningList[0]): string => {
    if (item.consumption?.qmin_daily_differential != null && item.consumption?.last_qmin != null) {
      return Number(formatDifferential(item.consumption.last_qmin - item.consumption.qmin_daily_differential)).toFixed(0)
    }
    return ''
  }

  const getQminJ7 = (item: typeof qminWarningList[0]): string => {
    if (item.consumption?.qmin_weekly_differential != null && item.consumption?.last_qmin != null) {
      return Number(formatDifferential(item.consumption.last_qmin - item.consumption.qmin_weekly_differential)).toFixed(0)
    }
    return ''
  }

  const getDifferentialColor = (value: string): string => {
    if (!value) return '#000000'
    const numValue = Number(value)
    if (numValue > 50) return '#ef4444'
    if (numValue < -50) return '#22c55e'
    return '#000000'
  }

  const getStatusPriority = (status: string | undefined): number => {
    if (!status) return 999
    switch (status) {
      case 'En cours':
        return 1
      case 'À l\'étude':
        return 2
      case 'Suivi M+0':
      case 'Suivi M+6':
      case 'Suivi M+12':
        return 3
      case 'Clos':
      case 'Clos sans IC':
        return 4
      default:
        return 999
    }
  }

  const sortedQminWarningList = qminWarningList
    .sort((a, b) => {
      const statusA = a.building?.missions_status?.[0]
      const statusB = b.building?.missions_status?.[0]
      const priorityA = getStatusPriority(statusA)
      const priorityB = getStatusPriority(statusB)
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      const qminJ1A = getQminJ1(a)
      const qminJ1B = getQminJ1(b)
      const qminJ1ANum = qminJ1A ? Number(qminJ1A) : 0
      const qminJ1BNum = qminJ1B ? Number(qminJ1B) : 0
      
      if (qminJ1ANum !== qminJ1BNum) {
        return qminJ1BNum - qminJ1ANum // Ordre décroissant
      }
      
      const qminJ7A = getQminJ7(a)
      const qminJ7B = getQminJ7(b)
      const qminJ7ANum = qminJ7A ? Number(qminJ7A) : 0
      const qminJ7BNum = qminJ7B ? Number(qminJ7B) : 0
      
      return qminJ7BNum - qminJ7ANum // Ordre décroissant
    })

  const qminHtmlTable = `
    <div style="border-radius:6px; border:1px solid #e5e7eb; overflow:hidden;">
      <table style="width:100%; border-collapse:collapse; margin:0 auto; font-size:12px; table-layout:fixed;">
        <thead>
          <tr style="background-color:#f9fafb;">
            <th style="padding:12px; text-align:left; color:#000000; width:30%; font-weight:500;">Immeuble</th>
            <th style="padding:12px; text-align:left; color:#000000; width:20%; font-weight:500;">Compteur</th>
            <th style="padding:12px; text-align:left; color:#000000; width:12.5%; font-weight:500;">Q.J-1</th>
            <th style="padding:12px; text-align:left; color:#000000; width:12.5%; font-weight:500;">Q.J-7</th>
            <th style="padding:12px; text-align:left; color:#000000; width:12.5%; font-weight:500;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${sortedQminWarningList.map((item, index) => {
            const qminJ1 = getQminJ1(item)
            const qminJ7 = getQminJ7(item)
            const isLastRow = index === sortedQminWarningList.length - 1
            const borderStyle = isLastRow ? '' : 'border-bottom:1px solid #e5e7eb;'
            return `
            <tr style="${borderStyle}">
              <td style="padding:12px; color:#000000; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:0;">${item.building?.name ?? ''}</td>
              <td style="padding:12px; color:#000000; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:0;">${item.consumption?.pds ?? ''}</td>
              <td style="padding:12px; text-align:left; color:${getDifferentialColor(qminJ1)};">
                ${qminJ1 || '-'}
              </td>
              <td style="padding:12px; text-align:left; color:${getDifferentialColor(qminJ7)};">
                ${qminJ7 || '-'}
              </td>
              <td style="padding:12px; text-align:left; color:#000000;">
                ${item.building?.missions_status[0]}
              </td>
            </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
  html = html.replace('{{ qminTable }}', qminHtmlTable)

  recipientsList?.forEach(async (recipient) => {
    await sendNotification(recipient, html)
  })
})