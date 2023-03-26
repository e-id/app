import * as pkcs11js from 'pkcs11js'

export class CardReader {
  library: string = ''
  libraryDescription: string = ''
  pkcs11: pkcs11js.PKCS11 | null = null
  lastError: string = ''

  init (library: string): void {
    if (this.library !== '' && this.lastError === '') {
      this.finalize()
    }

    this.library = library
    try {
      this.pkcs11 = new pkcs11js.PKCS11()
      this.pkcs11.load(library)
      this.pkcs11.C_Initialize()
      const moduleInfo = this.pkcs11.C_GetInfo()
      this.libraryDescription = `${moduleInfo.libraryDescription} version ${moduleInfo.libraryVersion.major}.${moduleInfo.libraryVersion.minor}`
      this.lastError = ''
    } catch (e) {
      this.lastError = e.message
    }
  }

  getSlots (): any[] {
    const slots: any[] = []
    if (this.library === '') {
      return slots
    }
    const slotList = this.pkcs11?.C_GetSlotList(true)
    if (undefined !== slotList) {
      slotList.forEach((slot: Buffer) => {
        const slotInfo = this.pkcs11?.C_GetSlotInfo(slot)
        if (undefined !== slotInfo) {
          slots.push({ ...slotInfo, buffer: slot })
        }
      })
    }
    return slots
  }

  readCard (slot: any): object {
    const data = {}
    const session = this.pkcs11?.C_OpenSession(slot, pkcs11js.CKF_RW_SESSION | pkcs11js.CKF_SERIAL_SESSION)
    if (undefined !== session) {
      this.pkcs11?.C_FindObjectsInit(session, [{ type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_DATA }])
      let hObject = this.pkcs11?.C_FindObjects(session)
      while (undefined !== hObject && hObject !== null) {
        const attrs = this.pkcs11?.C_GetAttributeValue(session, hObject, [
          { type: pkcs11js.CKA_LABEL },
          { type: pkcs11js.CKA_VALUE }
        ])
        if (undefined !== attrs) {
          const label = attrs[0].value?.toString()
          if (undefined !== label) {
            data[label] = attrs[1].value?.toString()
          }
        }
        hObject = this.pkcs11?.C_FindObjects(session)
      }
      this.pkcs11?.C_FindObjectsFinal(session)
    }
    return data
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
