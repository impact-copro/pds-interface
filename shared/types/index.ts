export interface Index {
  differentiel_journalier: number,
  date_index: string,
  index: number
  clients: {
    pds: Array<string>
  }
}