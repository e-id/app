import * as gui from 'gui'

export class Alert {
  win: gui.Window
  message: string

  constructor (message: string, options: { frame?: boolean } = {}) {
    this.win = gui.Window.create(options)
    this.message = message
  }

  show (): void {
    const contentView = gui.Container.create()
    contentView.setStyle({ flexDirection: 'row' })
    this.win.setContentView(contentView)

    const label = gui.Label.create(this.message)
    label.setStyle({ flex: 1 })
    contentView.addChildView(label)

    this.win.onClose = () => { gui.MessageLoop.quit() }
    this.win.setContentSize({ width: 400, height: 100 })
    this.win.setAlwaysOnTop(true)
    this.win.setResizable(false)
    this.win.setMaximizable(false)
    this.win.setMinimizable(false)
    this.win.center()
    this.win.activate()
  }
}
