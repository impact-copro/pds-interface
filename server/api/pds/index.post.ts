import { getRowsFromSheet } from "../../../shared/utils/gSheet"
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Create Supabase client for later fetch
  const supabase = serverSupabaseServiceRole(event)

  // Set Google Sheet access for later fetch
  const credentials = config.googleCredentials as string
  const sheetId = "1mu34D33RpZ8cX2Q2BJh8GdfBeGrBydBT1w7VHUHfon4"

  // Initialization of the variables expected to receive data from API call
  let indexData, qminData, clientsData, supabaseClients

  // Initialization of the variables that will contain the data to be sent to Supabase
  let newIndexRows, newQminRows, newClients, newClientsPds: string[] = []

  // Fetch Google Sheet & Supabase to get all the data we need
  try {
    [indexData, qminData, clientsData, supabaseClients] = await Promise.all([
      getRowsFromSheet(sheetId, "INDEX!A2:K", credentials),
      getRowsFromSheet(sheetId, "QMIN!A2:E", credentials),
      getRowsFromSheet(sheetId, "DONNEES CLIENT!A2:R", credentials),
      supabase
        .from('clients')
        .select('pds')
        .then(result => ({
          ...result,
          data: result.data?.map(client => client.pds) || []
        }))
    ])
    console.log('Successfully fetched the whole data')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log('Failed to fetch the whole data:', errorMessage)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch the whole data: ${errorMessage}`
    })
  }

  // Date formatting functions
  const startOfDaysAgo = (days: number): Date => {
    const now = new Date()
    now.setDate(now.getDate() - days)
  
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()
    const day = now.getUTCDate()
  
    return new Date(Date.UTC(year, month, day, 0, 0, 0))
  }

  const formatDateWithTime = (value: string, tz?: string): Date => {
    const [datePart, timePart] = value.split(' ')
    const [day, month, year] = datePart.split('/')
    if (tz) {
      return new Date(`${year}-${month}-${day}T${timePart}${tz}`)
    }
    return new Date(`${year}-${month}-${day}T${timePart}`)
  }

  const formatDateWithoutTime = (value: string): string => {
    const [day, month, year] = value.split('/')
    return new Date(`${year}-${month}-${day}`).toISOString().split('T')[0]
  }

  // Number formatting functions
  const toFloatOrNull = (val: string) => {
    const num = parseFloat(val?.replace(',', '.'))
    return Number.isFinite(num) ? num : null
  }
  
  const toIntOrNull = (val: string) => {
    const num = parseInt(val, 10)
    return Number.isFinite(num) ? num : null
  }

  // Set newClients && newClientsPds
  if (clientsData && supabaseClients) {
    newClients = clientsData.filter(client => {
      return !supabaseClients.data.includes(client[0])
    })

    if (newClients) {
      newClients = newClients.map(client => {
        return {
          pds: client[0],
          contrat_num_fct: toIntOrNull(client[1]),
          pds_site_type_fct: client[2],
          pds_ai_principal_flag_fct: (client[3] === "TRUE") ? true : false,
          pds_site_adresse_fct: client[4],
          pds_site_adresse_cplt_fct: client[5],
          pds_site_cp_fct: toIntOrNull(client[6]),
          pds_site_ville_fct: client[7],
          contractant_nom_fct: client[8],
          contractant_adresse_fct: client[9],
          contractant_cp_fct: toIntOrNull(client[10]),
          contractant_ville_fct: client[11],
          contractant_pays_fct: client[12],
          destinataire_nom_fct: client[13],
          contrat_eso_flag_crm: (client[14] === "TRUE") ? true : false,
          compteur_diametre_patrimoine: toIntOrNull(client[15]),
          compteur_acces_patrimoine: client[16],
          compteur_emplacement_patrimoine: client[17]
        }
      })

      newClientsPds = newClients.map(client => client.pds)

    }
  }

  // Set newIndexRows && newQminRows to be sent to Supabase
  if (indexData && supabaseClients) {
    // Find index data for existing clients
    newIndexRows = indexData.filter(index => {
      const indexDate = formatDateWithTime(index[1])
      return supabaseClients.data.includes(index[0]) && indexDate.getTime() >= startOfDaysAgo(40).getTime()
    })

    // If new clients, add their index data to newIndexRows
    if (newClients && newClientsPds.length > 0) {
      const newClientIndex = indexData.filter(index => newClientsPds.includes(index[0]))
      newIndexRows.push(...newClientIndex)
    }

    // Format newIndexRows for Supabase
    newIndexRows = newIndexRows.map(index => {
      return {
        index: toFloatOrNull(index[2]),
        date_index: formatDateWithTime(index[1], "+02:00").toISOString(),
        source: index[3],
        quality: toIntOrNull(index[4]),
        rank: toIntOrNull(index[6]),
        last_modified: formatDateWithTime(index[5], "+02:00").toISOString(),
        day: formatDateWithoutTime(index[7]),
        daily_differential: toFloatOrNull(index[10]),
        pds: index[0]
      }
    })
  }

  if (qminData && supabaseClients) {
    // Find qmin data for existing clients
    newQminRows = qminData.filter(qmin => {
      const qminDate = formatDateWithTime(qmin[1])
      return supabaseClients.data.includes(qmin[0]) && qminDate.getTime() >= startOfDaysAgo(42).getTime() && qminDate.getTime() < startOfDaysAgo(2).getTime()
    })

    // If new clients, add their qmin data to newQminRows
    if (newClients && newClientsPds.length > 0) {
      const newClientQmin = qminData.filter(index => newClientsPds.includes(index[0]))
      newQminRows.push(...newClientQmin)
    }

    // Format newQminRows for Supabase
    newQminRows = newQminRows.map(qmin => {
      return {
        reference_date: formatDateWithTime(qmin[1], "+02:00").toISOString(),
        qmin: toIntOrNull(qmin[2]),
        last_modified: formatDateWithTime(qmin[3], "+02:00").toISOString(),
        rank: toIntOrNull(qmin[4]),
        pds: qmin[0]
      }
    })
  }

  // Send data to Supabase
  try {
    await Promise.all([
      supabase.functions.invoke('clients-bulk-create', {
        body: newClients,
      }),
      supabase.functions.invoke('indexs-bulk-create', {
        body: newIndexRows,
      }),
      supabase.functions.invoke('qmins-bulk-create', {
        body: newQminRows,
      }),
    ])
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send data to Supabase: ${errorMessage}`
    })
  }
 
})