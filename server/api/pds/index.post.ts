import { getRowsFromSheet } from "../../../shared/utils/gSheet"
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Client } from "../../../shared/types/client"


export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Create Supabase client for later fetch
  const supabase = serverSupabaseServiceRole(event)

  // Set Google Sheet access for later fetch
  const credentials = config.googleCredentials as string
  const sheetId = "1mu34D33RpZ8cX2Q2BJh8GdfBeGrBydBT1w7VHUHfon4"

  // Initialization of the variables expected to receive data from API call
  let indexData: string[][] | undefined = []
  let qminData: string[][] | undefined = []
  let clientsData: string[][] | undefined = []
  let supabaseClients: { data: string[] } | undefined = { data: [] }

  // Initialization of the variables that will contain the data to be sent to Supabase
  let newIndexRows: any[] = [], newQminRows: any[] = [], newClients: any[] = [], newClientsPds: string[] = []

  console.log('Server route running')
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
          ...result as unknown as Client[],
          data: result.data?.map((client: Client) => client.pds) || []
        }))
    ])

    console.log('Successfully fetched the whole data')
    console.log('-----------------------------------------')
    console.log('Index length from GSheet :', indexData?.length)
    console.log('Qmin length from GSheet :', qminData?.length)
    console.log('Clients length from GSheet :', clientsData?.length)
    console.log('Clients length from Supabase :', supabaseClients?.data?.length)
    console.log('-----------------------------------------')

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

    console.log('Number of clients to be inserted in Supabase:', newClients?.length)

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
      return supabaseClients.data.includes(index[0]) && indexDate.getTime() >= startOfDaysAgo(1).getTime()
    })

    // If new clients, add their index data to newIndexRows
    if (newClients && newClientsPds.length > 0) {
      const newClientIndex = indexData.filter(index => newClientsPds.includes(index[0]))
      newIndexRows.push(...newClientIndex)
    }

    console.log('Number of indexs to be inserted in Supabase:', newIndexRows?.length)

    // Format newIndexRows for Supabase
    newIndexRows = newIndexRows.map(index => {
      return {
        index: toFloatOrNull(index[2]),
        date_index: formatDateWithTime(index[1]).toISOString(),
        source: index[3],
        quality: toIntOrNull(index[4]),
        rank: toIntOrNull(index[6]),
        last_modified: formatDateWithTime(index[5]).toISOString(),
        day: formatDateWithoutTime(index[7]),
        pds: index[0]
      }
    })
  }

  if (qminData && supabaseClients) {
    // Find qmin data for existing clients
    newQminRows = qminData.filter(qmin => {
      const qminDate = formatDateWithTime(qmin[1])
      return supabaseClients.data.includes(qmin[0]) && qminDate.getTime() >= startOfDaysAgo(3).getTime() && qminDate.getTime() < startOfDaysAgo(2).getTime()
    })

    console.log('Number of qmins to be inserted in Supabase:', newQminRows?.length)
    console.log('-----------------------------------------')

    // If new clients, add their qmin data to newQminRows
    if (newClients && newClientsPds.length > 0) {
      const newClientQmin = qminData.filter(index => newClientsPds.includes(index[0]))
      newQminRows.push(...newClientQmin)
    }

    // Format newQminRows for Supabase
    newQminRows = newQminRows.map(qmin => {
      return {
        reference_date: formatDateWithTime(qmin[1]).toISOString(),
        qmin: toIntOrNull(qmin[2]),
        last_modified: formatDateWithTime(qmin[3]).toISOString(),
        rank: toIntOrNull(qmin[4]),
        pds: qmin[0]
      }
    })
  }

  // Helper function to split array into chunks
  const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  // Helper function to insert data in chunks
  const insertInChunks = async (
    table: string,
    data: any[],
    chunkSize: number,
    onConflict: string
  ) => {
    const chunks = chunkArray(data, chunkSize)
    console.log(`Inserting ${data.length} rows into ${table} in ${chunks.length} chunks of ${chunkSize}`)
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const result = await supabase
        .from(table)
        .insert(chunk as any)
        .select() as any
      
      if (result.error) {
        throw new Error(`Error inserting chunk ${i + 1}/${chunks.length} into ${table}: ${result.error.message}`)
      }
      
      console.log(`Successfully inserted chunk ${i + 1}/${chunks.length} into ${table} (${chunk.length} rows)`)
    }
  }

  try {
    const BATCH_SIZE = 1000

    if (Array.isArray(newClients) && newClients.length > 0) {
      // Deduplicate by pds within the batch to avoid intra-batch duplicates
      const seenPds = new Set<string>()
      newClients = newClients.filter((c: any) => {
        if (seenPds.has(c.pds)) return false
        seenPds.add(c.pds)
        return true
      })
      if (newClients.length <= BATCH_SIZE) {
        const result = await supabase
          .from('clients')
          .upsert(newClients as any, { onConflict: 'pds', ignoreDuplicates: true } as any)
          .select() as any
        
        if (result.error) {
          throw new Error(`Error inserting clients: ${result.error.message}`)
        }
        console.log(`Successfully inserted ${newClients.length} clients`)
      } else {
        await insertInChunks('clients', newClients, BATCH_SIZE, 'pds')
      }
    }

    // Insert indexs in chunks
    if (Array.isArray(newIndexRows) && newIndexRows.length > 0) {
      await insertInChunks('indexs', newIndexRows, BATCH_SIZE, 'pds,date_index')
    }

    // Insert qmins in chunks
    if (Array.isArray(newQminRows) && newQminRows.length > 0) {
      await insertInChunks('qmins', newQminRows, BATCH_SIZE, 'pds,reference_date')
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send data to Supabase: ${errorMessage}`
    })
  }
})