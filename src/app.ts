import * as fs from 'fs'
import * as gui from 'gui'
import * as path from 'path'

import activeWindow from 'active-win'

import { Helper } from './util/helper'
import { Callback } from './util/callback'
import { Preferences } from './util/preferences'
import { CardLibrary } from './service/card-library'
import { CardReader } from './service/card-reader'
import { Alert } from './gui/alert'
import { Image } from './gui/image'

// Check for updates - https://api.github.com/repos/e-id/app/releases?callback=

export class App {
  cardReader = new CardReader()
  caller = ''
  uri = ''
  currentSlot: string | null = null
  quietMode: boolean = false
  exitOnSuccess: boolean = false

  start (): void {
    if (process.platform === 'darwin') {
      this.caller = String(process.env.OPEN_EID_APP ?? '')
    }
    if (process.platform === 'win32') {
      this.caller = activeWindow.sync()?.owner.path ?? ''
    }

    const preferences = new Preferences('io.github.e-id')
    const cardLibrary = new CardLibrary()
    const helper = new Helper(preferences, cardLibrary, this.cardReader)
    const iconPath = path.join(__dirname, '../assets/tray' + (process.platform === 'darwin' ? '-mac' : '') + '.png')
    const trayIcon = Image.createFromPath(iconPath)

    this.quietMode = (preferences.getString('QuietMode') ?? '') === '1'
    if (process.argv.includes('--quiet-mode')) {
      this.quietMode = true
      preferences.setString('QuietMode', this.quietMode ? '1' : '0')
    }

    if (process.argv.includes('--exit-on-success')) {
      this.exitOnSuccess = true
    }

    if (process.platform === 'darwin') {
      trayIcon.setTemplate(true)
      gui.app.setActivationPolicy('accessory')
    }

    if (process.platform === 'win32') {
      helper.registerProtocols()
    }

    let currentLibrary = helper.getLibrary()
    if (process.argv.includes('--library')) {
      const library = process.argv.slice(process.argv.indexOf('--library') + 1).shift()
      if (undefined !== library) {
        this.cardReader.init(library)
        if (this.cardReader.lastError === '') {
          currentLibrary = library
          preferences.setString('Library', library)
        } else {
          currentLibrary = null
          console.log(this.cardReader.lastError)
        }
      }
    }

    if (currentLibrary !== null) {
      preferences.setString('Library', currentLibrary)
      console.log(`Using library ${currentLibrary}`)
      this.cardReader.init(currentLibrary)
      this.currentSlot = helper.getSlot()
      if (this.currentSlot !== null) {
        preferences.setString('Slot', this.currentSlot)
        console.log(`Using slot ${this.currentSlot}`)
      }
    }

    let tray: gui.Tray | gui.Window | null = null
    try {
      tray = gui.Tray.createWithImage(trayIcon)
      tray.getBounds()
    } catch (e) {
      tray = Alert.create({})
    }

    const uri = process.argv.pop()
    if (undefined !== uri && uri === '--quiet-mode') {
      this.quietMode = true
      preferences.setString('QuietMode', this.quietMode ? '1' : '0')
    }

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
          new Callback(this.caller, this.uri).result({ cancel: true })
          clearInterval(interval)
          process.exit(0)
        }
      } else {
        this.read(slot.buffer)
        process.exit(0)
      }
    } else {
      const loading = Alert.create({ message: 'Loading...', frame: false })
      if (this.quietMode) {
        loading.setVisible(false)
      }

      setTimeout(() => {
        const trayMenuItems: gui.MenuItem[] = []

        let trayLibraryChecked = false
        const trayLibItems: gui.MenuItem[] = []
        const trayLibrary = gui.MenuItem.create('submenu')
        trayLibrary.setLabel('Library')
        cardLibrary.findAll().forEach((library: string, index: number) => {
          const menuItem = gui.MenuItem.create('radio')
          menuItem.setLabel(library)
          const checked = currentLibrary !== null ? library === currentLibrary : index === 0
          if (checked) {
            trayLibraryChecked = true
          }
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
        const otherLibrary = gui.MenuItem.create('radio')
        let otherSuffix = ''
        if (!trayLibraryChecked && currentLibrary !== null) {
          otherSuffix = currentLibrary
          this.cardReader.init(currentLibrary)
          if (this.cardReader.lastError === '') {
            otherSuffix += ' | ' + this.cardReader.libraryDescription
            otherLibrary.setChecked(true)
          }
        }
        otherLibrary.setLabel(`Other... ${otherSuffix}`)
        otherLibrary.onClick = (self: gui.MenuItem) => {
          const fileDialog = gui.FileOpenDialog.create()
          if (fileDialog.run()) {
            const library = fileDialog.getResults().shift()
            if (undefined !== library) {
              this.cardReader.init(library)
              if (this.cardReader.lastError === '') {
                preferences.setString('Library', library)
                currentLibrary = library
                self.setChecked(true)
                self.setLabel('Other... ' + library + ' | ' + this.cardReader.libraryDescription)
                console.log(`Using library ${currentLibrary}`)
                for (let i = 0; i < trayLibMenu.itemCount(); i++) {
                  const menuItem = trayLibMenu.itemAt(i)
                  menuItem.setChecked(false)
                }
              }
            }
          }
        }
        trayLibItems.push(otherLibrary)
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
        if (traySlotItems.length === 0) {
          const menuItem = gui.MenuItem.create('label')
          menuItem.setLabel('Please connect reader and insert card')
          menuItem.setEnabled(false)
          traySlotItems.push(menuItem)
        }
        const traySlotMenu = gui.Menu.create(traySlotItems)
        traySlot.setSubmenu(traySlotMenu)
        trayMenuItems.push(traySlot)

        trayMenuItems.push(gui.MenuItem.create('separator'))

        const trayQuietMode = gui.MenuItem.create('checkbox')
        trayQuietMode.setLabel('Silent mode')
        trayQuietMode.setChecked(this.quietMode)
        trayQuietMode.onClick = (self: gui.MenuItem) => {
          this.quietMode = self.isChecked()
          preferences.setString('QuietMode', this.quietMode ? '1' : '0')
        }
        trayMenuItems.push(trayQuietMode)

        const trayQuit = gui.MenuItem.create('label')
        trayQuit.setLabel('Quit')
        trayQuit.onClick = () => { gui.MessageLoop.quit() }
        trayMenuItems.push(trayQuit)

        if (tray instanceof gui.Tray) {
          tray.setMenu(gui.Menu.create(trayMenuItems))
        }

        if (tray instanceof gui.Window) {
          if (process.platform === 'darwin') {
            const menu = gui.Menu.create(trayMenuItems)
            const button = gui.Button.create({ title: 'Menu' })
            button.onClick = () => { menu.popup() }
            const container = tray.getContentView() as gui.Container
            container.addChildView(button)
          } else {
            tray.setMenuBar(gui.MenuBar.create(trayMenuItems))
          }
        }

        loading.setVisible(false)

        for (let i = 0; i < trayLibMenu.itemCount(); i++) {
          const menuItem = trayLibMenu.itemAt(i)
          if (menuItem.getLabel().indexOf('Other... ') !== 0) {
            this.cardReader.init(menuItem.getLabel())
            if (this.cardReader.lastError !== '') {
              menuItem.setEnabled(false)
            }
            menuItem.setLabel(this.cardReader.library + ' | ' + this.cardReader.libraryDescription)
          }
        }

        currentLibrary = helper.getLibrary()
        if (this.cardReader.library !== '') {
          if (this.cardReader.lastError === '') {
            if (this.quietMode) {
              if (this.exitOnSuccess) {
                gui.MessageLoop.quit()
              }
            } else {
              const alert = Alert.create({ message: 'Open e-ID is up and ready !\n\nUsing library ' + this.cardReader.library, frame: false })
              setTimeout(() => {
                alert.setVisible(false)
              }, 3000)
            }
          } else {
            if (this.quietMode) {
              console.error(this.cardReader.lastError)
              gui.MessageLoop.quit()
            } else {
              const error = Alert.create({ message: 'An error occured:\n\n' + this.cardReader.lastError, width: 600, height: 200 })
              error.onClose = () => { gui.MessageLoop.quit() }
            }
          }
        } else {
          if (this.quietMode) {
            console.error('No library found. Please install middleware and try again.')
            gui.MessageLoop.quit()
          } else {
            const error = Alert.create({ message: 'No library found.\nPlease install middleware and try again.' })
            error.onClose = () => { gui.MessageLoop.quit() }
          }
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
    confirm.setText(`${url.host} wants to read the content of the card in ${this.currentSlot}\r\n\r\nDo you agree?`)
    confirm.addButton('No', 0)
    confirm.addButton('Yes', 1)
    if (confirm.run() === 1) {
      let allData: { log_file?: string } = {}
      try {
        allData = this.cardReader.readCard(buffer)
      } catch (e) {
        if (always) {
          new Callback(this.caller, this.uri).result({ error: e.message })
        } else {
          const error = Alert.create({ message: 'An error occured:\n\n' + String(e.message), width: 600, height: 200 })
          error.onClose = () => { gui.MessageLoop.quit() }
        }
        return
      }
      allData.log_file = `Library: ${this.cardReader.library}\n${this.cardReader.libraryDescription}\nSlot: ${this.currentSlot}`
      const data = {}
      const include = url.searchParams.has('e-id-include') ? url.searchParams.get('e-id-include')?.replace('*', Object.keys(allData).join(',')).split(',') ?? [] : []
      const exclude = url.searchParams.has('e-id-exclude') ? url.searchParams.get('e-id-exclude')?.replace('*', Object.keys(allData).join(',')).split(',') ?? [] : []
      Object.keys(allData).forEach((key: string) => {
        if ((key.match(/file/gi) == null && key.match(/data/gi) == null) || include.includes(key)) {
          if (!exclude.includes(key) || include.includes(key)) {
            const encoding = ['atr', 'chip_number', 'photo_hash'].includes(key) || key.startsWith('carddata_') ? 'hex' : 'base64'
            // eslint-disable-next-line no-control-regex
            data[key.toLowerCase()] = /[^\u0019-\u00ff]/.test(allData[key]) ? allData[key].toString(encoding) : allData[key].toString().trim()
          }
        }
      })
      new Callback(this.caller, this.uri).result(data)
    } else {
      if (always) {
        new Callback(this.caller, this.uri).result({ cancel: true })
      }
    }
  }
}
