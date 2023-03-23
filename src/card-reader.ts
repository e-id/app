import { PKCS11 } from 'pkcs11js'
import { CardLibrary } from './card-library'

export class CardReader {
  library: string = ''
  pkcs11: PKCS11
  lastError: string = ''

  init (): void {
    const library = new CardLibrary().findAll().shift()
    if (undefined !== library) {
      this.library = library
      try {
        this.pkcs11 = new PKCS11()
        this.pkcs11.load(library)
        this.pkcs11.C_Initialize()
      } catch (e) {
        this.lastError = e.message
      }
    }
  }
}
