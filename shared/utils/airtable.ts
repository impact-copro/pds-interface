import Airtable from "airtable"

export const newAirtable = async (apiKey: string) => {
  return new Airtable({ apiKey }).base("appgJlySYi3reDp8Y")
}