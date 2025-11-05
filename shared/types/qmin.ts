export interface Qmin {
  reference_date: string,
  qmin: number,
  clients: {
    pds: Array<string>
  }
}