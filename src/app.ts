import * as gui from 'gui'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

import { Helper } from './util/helper'
import { Preferences } from './util/preferences'
import { CardLibrary } from './service/card-library'
import { CardReader } from './service/card-reader'
import { Alert } from './gui/alert'
import { Image } from './gui/image'

const preferences = new Preferences('io.github.e-id')
const cardReader = new CardReader()
const cardLibrary = new CardLibrary()
const helper = new Helper(preferences, cardLibrary, cardReader)
const trayIcon = new Image()

let currentLibrary = helper.getLibrary()
if (currentLibrary !== null) {
  preferences.setString('Library', currentLibrary)
  console.log(`Using library ${currentLibrary}`)
}

let currentSlot = helper.getSlot()
if (currentSlot !== null) {
  preferences.setString('Slot', currentSlot)
  console.log(`Using slot ${currentSlot}`)
}

const iconPath = path.join(__dirname, '../assets/tray' + (os.platform() === 'darwin' ? '-w' : '') + '.png')
const tray = gui.Tray.createWithImage(trayIcon.createFromPath(iconPath))

const uri = process.argv.pop()
if (undefined !== uri && uri.startsWith('e-id:') && currentLibrary !== null) {
  const slot = currentSlot !== null ? helper.getSlotByDescription(currentSlot) : null
  if (slot === null) {
    const wait = new Alert('Please connect reader and insert card')
    wait.show()
    const interval = setInterval(() => {
      const slot = cardReader.getSlots().shift()
      if (slot !== undefined && slot !== null) {
        clearInterval(interval)
        wait.window.setVisible(false)
        currentSlot = slot.slotDescription.trim()
        if (currentSlot !== null) {
          preferences.setString('Slot', currentSlot)
          console.log(`Using Slot ${currentSlot}`)
        }
        console.log(cardReader.readCard(slot.buffer))
        process.exit(0)
      }
    }, 1000)
    wait.window.onClose = () => {
      clearInterval(interval)
    }
  } else {
    console.log(cardReader.readCard(slot.buffer))
    process.exit(0)
  }
} else {
  const loading = new Alert('Loading...', { frame: false })
  loading.show()

  setTimeout(() => {
    const trayMenuItems: gui.MenuItem[] = []

    const trayLibItems: gui.MenuItem[] = []
    const trayLibrary = gui.MenuItem.create('submenu')
    trayLibrary.setLabel('Library')
    cardLibrary.findAll().forEach((library: string, index: number) => {
      const menuItem = gui.MenuItem.create('radio')
      menuItem.setLabel(library)
      const checked = currentLibrary !== null ? library === currentLibrary : index === 0
      menuItem.setChecked(checked)
      menuItem.onClick = (self: gui.MenuItem) => {
        const library = self.getLabel().split(' | ').shift()
        if (undefined !== library) {
          cardReader.init(library)
          if (cardReader.lastError === '') {
            preferences.setString('Library', library)
            currentLibrary = library
            console.log(`Using library ${currentLibrary}`)
          }
        }
      }
      trayLibItems.push(menuItem)
    })
    const trayLibMenu = gui.Menu.create(trayLibItems)
    trayLibrary.setSubmenu(trayLibMenu)
    trayMenuItems.push(trayLibrary)

    const traySlotItems: gui.MenuItem[] = []
    const traySlot = gui.MenuItem.create('submenu')
    traySlot.setLabel('Reader')
    cardReader.getSlots().forEach((slot: any, index: number) => {
      const menuItem = gui.MenuItem.create('radio')
      menuItem.setLabel(slot.slotDescription.trim())
      const checked = currentSlot !== null ? menuItem.getLabel() === currentSlot : index === 0
      menuItem.setChecked(checked)
      menuItem.onClick = (self: gui.MenuItem) => {
        preferences.setString('Slot', self.getLabel())
        currentSlot = self.getLabel()
        console.log(`Using slot ${currentSlot}`)
      }
      traySlotItems.push(menuItem)
    })
    const traySlotMenu = gui.Menu.create(traySlotItems)
    traySlot.setSubmenu(traySlotMenu)
    trayMenuItems.push(traySlot)

    trayMenuItems.push(gui.MenuItem.create('separator'))

    const trayQuit = gui.MenuItem.create('label')
    trayQuit.setLabel('Quit')
    trayQuit.onClick = () => { gui.MessageLoop.quit() }
    trayMenuItems.push(trayQuit)

    tray.setMenu(gui.Menu.create(trayMenuItems))

    loading.window.setVisible(false)

    for (let i = 0; i < trayLibMenu.itemCount(); i++) {
      const menuItem = trayLibMenu.itemAt(i)
      cardReader.init(menuItem.getLabel())
      menuItem.setLabel(cardReader.library + ' | ' + cardReader.libraryDescription)
    }

    if (cardReader.library !== '') {
      if (cardReader.lastError === '') {
        const alert = new Alert('Open e-ID is up and ready !\n\nUsing library ' + cardReader.library, { frame: false })
        alert.show()
        setTimeout(() => {
          alert.window.setVisible(false)
        }, 3000)
      } else {
        const error = new Alert('An error occured:\n\n' + cardReader.lastError, { width: 600, height: 200 })
        error.window.onClose = () => { gui.MessageLoop.quit() }
        error.show()
      }
    } else {
      const error = new Alert('No library found.\nPlease install middleware and try again.')
      error.window.onClose = () => { gui.MessageLoop.quit() }
      error.show()
    }
  }, 1000)
}

gui.MessageLoop.run()
fs.unlinkSync(trayIcon.tmp)
cardReader.finalize()
process.exit(0)
