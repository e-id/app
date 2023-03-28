import * as os from 'os'
import * as fs from 'fs'
import * as gui from 'gui'
import * as path from 'path'
import activeWindow from 'active-win'

import { Helper } from './util/helper'
import { Preferences } from './util/preferences'
import { CardLibrary } from './service/card-library'
import { CardReader } from './service/card-reader'
import { Alert } from './gui/alert'
import { Image } from './gui/image'
import { exec, execSync } from 'child_process'

export class App {
  cardReader = new CardReader()
  uri = ''
  currentSlot: string | null = null

  start (): void {
    const preferences = new Preferences('io.github.e-id')
    const cardLibrary = new CardLibrary()
    const helper = new Helper(preferences, cardLibrary, this.cardReader)
    const trayIcon = new Image()

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

    const iconPath = path.join(__dirname, '../assets/tray' + (process.platform === 'darwin' ? '-w' : '') + '.png')
    const tray = gui.Tray.createWithImage(trayIcon.createFromPath(iconPath)) // TODO - alternative UI for incompatible libappindicator linux distro

    const uri = process.argv.pop()

    if (undefined !== uri && (uri.startsWith('e-id://') || uri.startsWith('open-eid://')) && currentLibrary !== null) {
      this.uri = uri
      const slot = this.currentSlot !== null ? helper.getSlotByDescription(this.currentSlot) : null
      if (slot === null) {
        const wait = new Alert('Please connect reader and insert card')
        wait.show()
        const interval = setInterval(() => {
          const slot = this.cardReader.getSlots().shift()
          if (slot !== undefined && slot !== null) {
            clearInterval(interval)
            wait.window.setVisible(false)
            this.currentSlot = slot.slotDescription.trim()
            if (this.currentSlot !== null) {
              preferences.setString('Slot', this.currentSlot)
              console.log(`Using Slot ${this.currentSlot}`)
            }
            this.read(slot.buffer)
            process.exit(0)
          }
        }, 1000)
        wait.window.onClose = () => {
          clearInterval(interval)
        }
      } else {
        this.read(slot.buffer)
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

        loading.window.setVisible(false)

        for (let i = 0; i < trayLibMenu.itemCount(); i++) {
          const menuItem = trayLibMenu.itemAt(i)
          this.cardReader.init(menuItem.getLabel())
          menuItem.setLabel(this.cardReader.library + ' | ' + this.cardReader.libraryDescription)
        }

        currentLibrary = helper.getLibrary()
        if (this.cardReader.library !== '') {
          if (this.cardReader.lastError === '') {
            const alert = new Alert('Open e-ID is up and ready !\n\nUsing library ' + this.cardReader.library, { frame: false })
            alert.show()
            setTimeout(() => {
              alert.window.setVisible(false)
              gui.MessageLoop.quit()
              gui.MessageLoop.run()
            }, 3000)
          } else {
            const error = new Alert('An error occured:\n\n' + this.cardReader.lastError, { width: 600, height: 200 })
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
    this.cardReader.finalize()
    process.exit(0)
  }

  read (buffer: Buffer): void {
    if (this.uri === '' || this.currentSlot === null) {
      return
    }
    const callback = 'https:' + this.uri.substring(this.uri.indexOf(':') + 1)
    const confirm = gui.MessageBox.create()
    confirm.setText(`${callback} wants to read the content of the card in ${this.currentSlot}\r\n\r\nDo you agree?`)
    confirm.addButton('No', 0)
    confirm.addButton('Yes', 1)
    if (confirm.run() === 1) {
      const allData = this.cardReader.readCard(buffer)
      const data = {}
      Object.keys(allData).forEach((key: string) => {
        if ((key.match(/file/gi) == null) && (key.match(/data/gi) == null)) {
          data[key] = allData[key]
        }
      })
      const urlData = encodeURIComponent(JSON.stringify(data))
      let caller = ''
      if (process.platform === 'darwin') {
        caller = String(process.env.OPEN_EID_APP ?? '')
      }
      if (process.platform === 'win32') {
        caller = activeWindow.sync()?.owner.path ?? ''
      }
      fs.writeFileSync(path.join(os.homedir(), 'e-id.log'), caller + '\r\n' + this.uri + '\r\n' + callback + '\r\n' + JSON.stringify(data))
      if (process.platform === 'darwin') {
        if (caller !== '') {
          caller = `-a "${caller}"`
        }
        exec(`open ${caller} "${callback}${urlData}"`)
      }
      if (process.platform === 'win32') {
        if (
          caller.includes('\\Code.exe') ||
          caller.includes('\\WindowsTerminal.exe') ||
          caller.includes('\\cmd.exe') ||
          caller === ''
        ) {
          caller = 'start ""'
        } else {
          caller = `"${caller}"`
        }
        execSync(`${caller} "${callback}${urlData}"`, { windowsHide: true })
      }
    }
  }
}
