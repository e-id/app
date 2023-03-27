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

  getLibrary (): string | null {
    let library = this.preferences.getString('Library')
    if (library !== null) {
      this.cardReader.init(library)
      if (this.cardReader.lastError !== '') {
        library = null
      }
    }
    if (library === null) {
      library = this.cardLibrary.findAll().shift()
      this.cardReader.init(library)
      if (this.cardReader.lastError !== '') {
        library = null
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
