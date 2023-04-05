import * as reg from 'native-reg'

import { CardLibrary } from '../service/card-library'
import { CardReader } from '../service/card-reader'
import { Preferences } from './preferences'

export class Helper {
  private readonly preferences: any
  private readonly cardLibrary: any
  private readonly cardReader: any

  constructor (preferences: Preferences, cardLibrary: CardLibrary, cardReader: CardReader) {
    if (preferences instanceof Preferences) {
      this.preferences = preferences
    }
    if (cardLibrary instanceof CardLibrary) {
      this.cardLibrary = cardLibrary
    }
    if (cardReader instanceof CardReader) {
      this.cardReader = cardReader
    }
  }

  registerProtocols (): void {
    ['e-id', 'open-eid'].forEach((scheme) => { this.registerProtocol(scheme) })
  }

  registerProtocol (scheme: string): void {
    let hkey = reg.openKey(reg.HKCU, `Software\\Classes\\${scheme}`, reg.Access.ALL_ACCESS)
    if (hkey === null) {
      hkey = reg.createKey(reg.HKCU, `Software\\Classes\\${scheme}`, reg.Access.ALL_ACCESS)
    }
    reg.setValueSZ(hkey, '', `URL:${scheme}`)
    reg.setValueSZ(hkey, 'URL Protocol', '')
    reg.closeKey(hkey)
    hkey = reg.openKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell`, reg.Access.ALL_ACCESS)
    if (hkey === null) {
      hkey = reg.createKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell`, reg.Access.ALL_ACCESS)
    }
    reg.closeKey(hkey)
    hkey = reg.openKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell\\open`, reg.Access.ALL_ACCESS)
    if (hkey === null) {
      hkey = reg.createKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell\\open`, reg.Access.ALL_ACCESS)
    }
    reg.closeKey(hkey)
    hkey = reg.openKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell\\open\\command`, reg.Access.ALL_ACCESS)
    if (hkey === null) {
      hkey = reg.createKey(reg.HKCU, `Software\\Classes\\${scheme}\\shell\\open\\command`, reg.Access.ALL_ACCESS)
    }
    reg.setValueSZ(hkey, '', '"' + process.argv.join('" "'.replace(/\\/g, '\\\\')) + '" "%1"')
    reg.closeKey(hkey)
  }

  getLibrary (): string | null {
    let library = this.preferences.getString('Library')
    if (library !== null) {
      this.cardReader.init(library)
      if (this.cardReader.lastError !== '') {
        library = null
      } else {
        this.cardReader.finalize()
      }
    }
    if (library === null) {
      library = this.cardLibrary.findAll().shift()
      this.cardReader.init(library)
      if (this.cardReader.lastError !== '') {
        library = null
      } else {
        this.cardReader.finalize()
      }
    }
    return library
  }

  getSlot (): string | null {
    let slotDescription = this.preferences.getString('Slot')
    if (slotDescription !== null) {
      const slots = this.cardReader.getSlots().filter((slot: any) => slot.slotDescription.trim() === slotDescription)
      if (slots.length !== 1) {
        slotDescription = null
      }
    }
    if (slotDescription === null) {
      const slot = this.cardReader.getSlots().shift()
      if (slot !== null && slot !== undefined) {
        slotDescription = slot.slotDescription.trim()
      }
    }
    return slotDescription
  }

  getSlotByDescription (slotDescription: string): any {
    const slots = this.cardReader.getSlots().filter((slot: any) => slot.slotDescription.trim() === slotDescription)
    if (slots.length === 1) {
      return slots.shift()
    } else {
      return null
    }
  }
}
