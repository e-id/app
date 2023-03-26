import { PKCS11 } from 'pkcs11js'

export class CardReader {
  library: string = ''
  libraryDescription: string = ''
  pkcs11: PKCS11 | null = null
  lastError: string = ''

  init (library: string): void {
    if (this.library !== '' && this.lastError === '') {
      this.finalize()
    }

    this.library = library
    try {
      this.pkcs11 = new PKCS11()
      this.pkcs11.load(library)
      this.pkcs11.C_Initialize()
      const moduleInfo = this.pkcs11.C_GetInfo()
      this.libraryDescription = `${moduleInfo.libraryDescription} version ${moduleInfo.libraryVersion.major}.${moduleInfo.libraryVersion.minor}`
      this.lastError = ''
    } catch (e) {
      this.lastError = e.message
    }
  }

  getReaders (): any[] {
    const readers: any[] = []
    if (this.library === '') {
      return readers
    }
    const slots = this.pkcs11?.C_GetSlotList(true)
    if (undefined !== slots) {
      slots.forEach((slot: Buffer) => {
        const slotInfo = this.pkcs11?.C_GetSlotInfo(slot)
        if (undefined !== slotInfo) {
          readers.push(slotInfo)
        }
      })
    }
    return readers
  }

  finalize (): void {
    if (this.pkcs11 !== null) {
      try {
        this.pkcs11.C_Finalize()
      } catch (e) {
        this.lastError = e.message
      }
    }
  }
}
