import * as gui from 'gui'

import { CardReader } from './card-reader'
import { Alert } from './gui/alert'

const cardReader = new CardReader()
cardReader.init()

const alert = new Alert('Using library ' + cardReader.library)
alert.win.onClose = () => { gui.MessageLoop.quit() }
alert.show()

gui.MessageLoop.run()
process.exit(0)
