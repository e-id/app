import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

import * as gui from 'gui'

export class Image {
  tmp: string

  createFromPath (imagePath: string): gui.Image {
    this.tmp = path.join(os.tmpdir(), Buffer.from(imagePath).toString('base64'))
    fs.writeFileSync(this.tmp, fs.readFileSync(imagePath))
    const image = gui.Image.createFromPath(this.tmp)
    return image
  }
}
