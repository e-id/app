import * as fs from 'fs'
import * as gui from 'gui'
import * as path from 'path'

import { Helper } from './util/helper'
import { Callback } from './util/callback'
import { Preferences } from './util/preferences'
import { CardLibrary } from './service/card-library'
import { CardReader } from './service/card-reader'
import { Alert } from './gui/alert'
import { Image } from './gui/image'

export class App {
  cardReader = new CardReader()
  uri = ''
  currentSlot: string | null = null

  start (): void {
    const preferences = new Preferences('io.github.e-id')
    const cardLibrary = new CardLibrary()
    const helper = new Helper(preferences, cardLibrary, this.cardReader)
    const iconPath = path.join(__dirname, '../assets/tray' + (process.platform === 'darwin' ? '-w' : '') + '.png')
    const trayIcon = Image.createFromPath(iconPath)

    if (process.platform === 'darwin') {
      gui.app.setActivationPolicy('accessory')
    }

    if (process.platform === 'win32') {
      helper.registerProtocols()
    }

    let currentLibrary = helper.getLibrary()
    if (currentLibrary !== null) {
      preferences.setString('Library', currentLibrary)
      console.log(`Using library ${currentLibrary}`)
    }

    this.currentSlot = helper.getSlot()
    if (this.currentSlot !== null) {
      preferences.setString('Slot', this.currentSlot)
      console.log(`Using slot ${this.currentSlot}`)
    }

    const tray = gui.Tray.createWithImage(trayIcon) // TODO - alternative UI for incompatible libappindicator linux distro

    const uri = process.argv.pop()

    if (undefined !== uri && (uri.startsWith('e-id://') || uri.startsWith('open-eid://')) && currentLibrary !== null) {
      this.uri = uri
      const slot = this.currentSlot !== null ? helper.getSlotByDescription(this.currentSlot) : null
      if (slot === null) {
        const wait = Alert.create({ message: 'Please connect reader and insert card' })
        const interval = setInterval(() => {
          const slot = this.cardReader.getSlots().shift()
          if (slot !== undefined && slot !== null) {
            clearInterval(interval)
            wait.setVisible(false)
            this.currentSlot = slot.slotDescription.trim()
            if (this.currentSlot !== null) {
              preferences.setString('Slot', this.currentSlot)
              console.log(`Using Slot ${this.currentSlot}`)
            }
            this.read(slot.buffer)
            process.exit(0)
          }
        }, 1000)
        wait.onClose = () => {
          new Callback(this.uri).result({ cancel: true })
          clearInterval(interval)
        }
      } else {
        this.read(slot.buffer)
        process.exit(0)
      }
    } else {
      const loading = Alert.create({ message: 'Loading...', frame: false })

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
              this.cardReader.init(library)
              if (this.cardReader.lastError === '') {
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
        this.cardReader.getSlots().forEach((slot: any, index: number) => {
          const menuItem = gui.MenuItem.create('radio')
          menuItem.setLabel(slot.slotDescription.trim())
          const checked = this.currentSlot !== null ? menuItem.getLabel() === this.currentSlot : index === 0
          menuItem.setChecked(checked)
          menuItem.onClick = (self: gui.MenuItem) => {
            preferences.setString('Slot', self.getLabel())
            this.currentSlot = self.getLabel()
            console.log(`Using slot ${this.currentSlot}`)
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

        loading.setVisible(false)

        for (let i = 0; i < trayLibMenu.itemCount(); i++) {
          const menuItem = trayLibMenu.itemAt(i)
          this.cardReader.init(menuItem.getLabel())
          menuItem.setLabel(this.cardReader.library + ' | ' + this.cardReader.libraryDescription)
        }

        currentLibrary = helper.getLibrary()
        if (this.cardReader.library !== '') {
          if (this.cardReader.lastError === '') {
            const alert = Alert.create({ message: 'Open e-ID is up and ready !\n\nUsing library ' + this.cardReader.library, frame: false })
            setTimeout(() => {
              alert.setVisible(false)
              // gui.MessageLoop.quit()
              // gui.MessageLoop.run()
            }, 3000)
          } else {
            const error = Alert.create({ message: 'An error occured:\n\n' + this.cardReader.lastError, width: 600, height: 200 })
            error.onClose = () => { gui.MessageLoop.quit() }
          }
        } else {
          const error = Alert.create({ message: 'No library found.\nPlease install middleware and try again.' })
          error.onClose = () => { gui.MessageLoop.quit() }
        }
      }, 1000)
    }

    gui.MessageLoop.run()
    fs.unlinkSync(trayIcon.tmp)
    this.cardReader.finalize()
    process.exit(0)
  }

  read (buffer: Buffer): void {
    if (this.uri === '' || this.currentSlot === null) {
      return
    }
    const confirm = gui.MessageBox.create()
    const callback = 'https:' + this.uri.substring(this.uri.indexOf(':') + 1)
    const url = new URL(callback)
    const always = url.searchParams.has('e-id-always') ? url.searchParams.get('e-id-always') === '1' : false
    confirm.setText(`${callback} wants to read the content of the card in ${this.currentSlot}\r\n\r\nDo you agree?`)
    confirm.addButton('No', 0)
    confirm.addButton('Yes', 1)
    if (confirm.run() === 1) {
      let allData = {}
      try {
        allData = this.cardReader.readCard(buffer)
      } catch (e) {
        if (always) {
          new Callback(this.uri).result({ error: e.message })
        } else {
          const error = Alert.create({ message: 'An error occured:\n\n' + String(e.message), width: 600, height: 200 })
          error.onClose = () => { gui.MessageLoop.quit() }
        }
        return
      }
      const data = {}
      const include = url.searchParams.has('e-id-include') ? url.searchParams.get('e-id-include')?.split(',') ?? [] : []
      const exclude = url.searchParams.has('e-id-exclude') ? url.searchParams.get('e-id-exclude')?.replace('*', Object.keys(allData).join(',')).split(',') ?? [] : []
      Object.keys(allData).forEach((key: string) => {
        if ((key.match(/file/gi) == null && key.match(/data/gi) == null) || include.includes(key)) {
          if (!exclude.includes(key) || include.includes(key)) {
            const encoding = ['atr', 'chip_number', 'photo_hash'].includes(key) ? 'hex' : 'base64'
            // eslint-disable-next-line no-control-regex
            data[key.toLowerCase()] = /[^\u0000-\u00ff]/.test(allData[key]) ? allData[key].toString(encoding) : allData[key].toString().trim()
          }
        }
      })
      new Callback(this.uri).result(data)
    } else {
      if (always) {
        new Callback(this.uri).result({ cancel: true })
      }
    }
  }
}
