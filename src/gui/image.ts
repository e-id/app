import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

import * as gui from 'gui'

export class Image {
  createFromPath (imagePath: string): gui.Image {
    const tmp = path.join(os.tmpdir(), Buffer.from(imagePath).toString('base64'))
    fs.writeFileSync(tmp, fs.readFileSync(imagePath))
    const image = gui.Image.createFromPath(tmp)
    // fs.unlinkSync(tmp)
    return image
  }
}
