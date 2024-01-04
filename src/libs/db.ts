import Dexie, { Table } from 'dexie'

export interface ABIType {
  id?: number
  name: string
  json: string
}

export class MySubClassedDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  abiTypes!: Table<ABIType>

  constructor() {
    super('ContractReader')
    this.version(1).stores({
      abiTypes: '++id', // Primary key and indexed props
    })
  }

  async getABITypes() {
    return this.abiTypes.toArray()
  }
}

export const db = new MySubClassedDexie()
