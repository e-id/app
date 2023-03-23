import { PKCS11 } from 'pkcs11js'
import { CardLibrary } from './card-library'

export class CardReader {
  library: string
  pkcs11: PKCS11

  init (): void {
    const library = new CardLibrary().findAll().shift()
    if (undefined !== library) {
      this.pkcs11 = new PKCS11()
      this.pkcs11.load(library)
      this.pkcs11.C_Initialize()
      this.library = library
    }
  }
}
