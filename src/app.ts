import * as gui from 'gui'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

import { CardLibrary } from './service/card-library'
import { CardReader } from './service/card-reader'
import { Alert } from './gui/alert'
import { Image } from './gui/image'
import { Preferences } from './util/preferences'

const loading = new Alert('Loading...', { frame: false })
loading.show()

const trayIcon = new Image()
const cardReader = new CardReader()

setTimeout(() => {
  const preferences = new Preferences('io.github.e-id')

  const libraries = new CardLibrary().findAll()
  let currentLibrary = preferences.getString('Library')
  if (currentLibrary !== null) {
    cardReader.init(currentLibrary)
    if (cardReader.lastError !== '') {
      currentLibrary = null
    }
  }

  if (currentLibrary === null) {
    const library = libraries.shift()
    if (undefined !== library && library !== null) {
      cardReader.init(library)
      if (cardReader.lastError === '') {
        preferences.setString('Library', library)
        currentLibrary = library
      }
    }
  }

  const slots = cardReader.getSlots()
  let currentSlot = preferences.getString('Slot')

  if (currentLibrary !== null) {
    if (slots.filter(slot => slot.slotDescription.trim() === currentSlot).length !== 1) {
      currentSlot = null
    }
  }

  if (currentSlot === null) {
    const slot = slots.shift()
    if (undefined !== slot && slot !== null) {
      preferences.setString('Slot', slot.slotDescription.trim())
      currentLibrary = slot.slotDescription.trim()
    }
  }

  const iconPath = path.join(__dirname, '../assets/tray' + (os.platform() === 'darwin' ? '-w' : '') + '.png')
  const tray = gui.Tray.createWithImage(trayIcon.createFromPath(iconPath))

  const trayMenuItems: gui.MenuItem[] = []

  const trayLibItems: gui.MenuItem[] = []
  const trayLibrary = gui.MenuItem.create('submenu')
  trayLibrary.setLabel('Library')
  libraries.forEach((library: string, index: number) => {
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
  slots.forEach((slot: any, index: number) => {
    const menuItem = gui.MenuItem.create('radio')
    menuItem.setLabel(slot.slotDescription.trim())
    const checked = currentSlot !== null ? menuItem.getLabel() === currentSlot : index === 0
    menuItem.setChecked(checked)
    menuItem.onClick = (self: gui.MenuItem) => {
      preferences.setString('Slot', self.getLabel())
      currentSlot = self.getLabel()
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
      const slot = slots.filter(slot => slot.slotDescription.trim() === currentSlot).shift()
      if (slot !== null) {
        console.log(cardReader.readCard(slot.buffer))
      }
    } else {
      const alert = new Alert('An error occured:\n\n' + cardReader.lastError, { width: 600, height: 200 })
      alert.window.onClose = () => { gui.MessageLoop.quit() }
      alert.show()
    }
  } else {
    const alert = new Alert('No library found.\nPlease install middleware and try again.')
    alert.window.onClose = () => { gui.MessageLoop.quit() }
    alert.show()
  }
}, 1000)

gui.MessageLoop.run()
fs.unlinkSync(trayIcon.tmp)
cardReader.finalize()
process.exit(0)
