import { newAirtable } from "../../../shared/utils/airtable"
import type { Building } from "../../../shared/types/building"

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  
  try {
    const base = await newAirtable(config.airtableAccessToken as string)
    const records = await base("tblQeMdTYx3mDfWnU").select({
      filterByFormula: "NOT({// N° PDS} = '')",
      fields: ["// N° PDS", "ID interne"]
    }).all()

    const buildings = records.map(record => ({ 
      name: record.get("ID interne"), 
      pds: record.get("// N° PDS") as string 
    }))

    return buildings.map(building => ({
      name: building.name,
      pds: building.pds.split(",")
    })) as Building[]
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch buildings from Airtable: ${errorMessage}`
    })
  }
})