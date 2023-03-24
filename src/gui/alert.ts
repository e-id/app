import * as gui from 'gui'

export class Alert {
  message: string
  options: { frame?: boolean, width?: number, height?: number } = {}
  window: gui.Window

  constructor (message: string, options: { frame?: boolean, width?: number, height?: number } = {}) {
    this.options = { ...options }
    delete options.width
    delete options.height
    this.window = gui.Window.create(options)
    this.message = message
  }

  show (): void {
    const contentView = gui.Container.create()
    contentView.setStyle({ flexDirection: 'row' })
    this.window.setContentView(contentView)

    const label = gui.Label.create(this.message)
    label.setStyle({ flex: 1 })
    contentView.addChildView(label)

    this.window.onClose = () => { gui.MessageLoop.quit() }
    this.window.setContentSize({ width: this.options.width ?? 400, height: this.options.height ?? 100 })
    this.window.setAlwaysOnTop(true)
    this.window.setResizable(false)
    this.window.setMaximizable(false)
    this.window.setMinimizable(false)
    this.window.center()
    this.window.activate()
  }
}
