import * as gui from 'gui'
import * as path from 'path'

import { CardLibrary } from './card-library'
import { CardReader } from './card-reader'
import { Alert } from './gui/alert'

const loading = new Alert('Loading...', { frame: false })
loading.show()

const icon = gui.Image.createFromPath(path.join('.', 'assets', 'tray-w.png'))
const tray = gui.Tray.createWithImage(icon)

const trayMenuItems: gui.MenuItem[] = []

const trayLibItems: gui.MenuItem[] = []
const trayLibrary = gui.MenuItem.create('submenu')
trayLibrary.setLabel('Library')
new CardLibrary().findAll().forEach((library: string, index: number) => {
  const menuItem = gui.MenuItem.create('checkbox')
  menuItem.setLabel(library)
  menuItem.setChecked(index === 0)
  trayLibItems.push(menuItem)
})
trayLibrary.setSubmenu(gui.Menu.create(trayLibItems))
trayMenuItems.push(trayLibrary)

trayMenuItems.push(gui.MenuItem.create('separator'))

const trayQuit = gui.MenuItem.create('label')
trayQuit.setLabel('Quit')
trayQuit.onClick = () => { gui.MessageLoop.quit() }
trayMenuItems.push(trayQuit)

tray.setMenu(gui.Menu.create(trayMenuItems))

const cardReader = new CardReader()
cardReader.init()

loading.win.close()

if (cardReader.library !== '') {
  if (cardReader.lastError === '') {
    const alert = new Alert('Using library ' + cardReader.library, { frame: false })
    alert.show()
    setTimeout(() => {
      alert.win.setVisible(false)
    }, 3000)
  } else {
    const alert = new Alert('An error occured:\n\n' + cardReader.lastError, { width: 600, height: 200 })
    alert.win.onClose = () => { gui.MessageLoop.quit() }
    alert.show()
  }
} else {
  const alert = new Alert('No library found.\nPlease install middleware and try again.')
  alert.win.onClose = () => { gui.MessageLoop.quit() }
  alert.show()
}

gui.MessageLoop.run()
process.exit(0)
