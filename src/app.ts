import * as gui from 'gui'
import * as path from 'path'

import { CardReader } from './card-reader'
import { Alert } from './gui/alert'

const loading = new Alert('Loading...', { frame: false })
loading.show()

const cardReader = new CardReader()
cardReader.init()

loading.win.close()

if (cardReader.library !== '') {
  const alert = new Alert('Using library ' + cardReader.library, { frame: false })
  alert.show()
  setTimeout(() => {
    alert.win.setVisible(false)
  }, 3000)
} else {
  const alert = new Alert('No library found.\nPlease install middleware and try again.')
  alert.win.onClose = () => { gui.MessageLoop.quit() }
  alert.show()
}

const icon = gui.Image.createFromPath(path.join('.', 'assets', 'tray-w.png'))
const tray = gui.Tray.createWithImage(icon)
const trayQuit = gui.MenuItem.create('label')
trayQuit.setLabel('Quit')
trayQuit.onClick = () => { gui.MessageLoop.quit() }
const trayMenuItems = [
  trayQuit
]
const trayMenu = gui.Menu.create(trayMenuItems)
tray.setMenu(trayMenu)

gui.MessageLoop.run()
process.exit(0)
