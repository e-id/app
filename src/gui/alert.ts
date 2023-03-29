import * as gui from 'gui'

export class Alert extends gui.Window {
  public static create (options: any): Alert {
    const message = options.message ?? ''
    delete options.message

    const alertOptions = { width: options.width, height: options.height }
    delete options.width
    delete options.height

    const window = super.create(options as gui.WindowOptions)
    const alert = window as Alert

    const contentView = gui.Container.create()
    contentView.setStyle({ flexDirection: 'row' })
    alert.setContentView(contentView)

    const label = gui.Label.create(message)
    label.setStyle({ flex: 1 })
    contentView.addChildView(label)

    alert.setContentSize({ width: alertOptions.width ?? 400, height: alertOptions.height ?? 100 })
    alert.setAlwaysOnTop(true)
    alert.setResizable(false)
    alert.setMaximizable(false)
    alert.setMinimizable(false)
    alert.center()
    alert.activate()

    return alert
  }
}
