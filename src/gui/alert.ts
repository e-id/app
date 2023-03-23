import * as gui from 'gui'

export class Alert {
  message: string
  options: { frame?: boolean, width?: number, height?: number } = {}
  win: gui.Window

  constructor (message: string, options: { frame?: boolean, width?: number, height?: number } = {}) {
    this.options = { ...options }
    delete options.width
    delete options.height
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
    this.win.setContentSize({ width: this.options.width ?? 400, height: this.options.height ?? 100 })
    this.win.setAlwaysOnTop(true)
    this.win.setResizable(false)
    this.win.setMaximizable(false)
    this.win.setMinimizable(false)
    this.win.center()
    this.win.activate()
  }
}
