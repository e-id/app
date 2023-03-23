import * as gui from 'gui'
import * as path from 'path'

import { CardReader } from './card-reader'
import { Alert } from './gui/alert'

const cardReader = new CardReader()
cardReader.init()

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

const alert = new Alert('Using library ' + cardReader.library)
alert.win.onClose = () => { gui.MessageLoop.quit() }
alert.show()

gui.MessageLoop.run()
process.exit(0)
