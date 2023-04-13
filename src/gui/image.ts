import { uuid } from 'uuidv4'

import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

import * as gui from 'gui'

export class Image extends gui.Image {
  public tmp: string

  public static createFromPath (imagePath: string): Image {
    const tmp = path.join(os.tmpdir(), uuid())
    fs.writeFileSync(tmp, fs.readFileSync(imagePath))
    const image = gui.Image.createFromPath(tmp)
    const tempImage = image as Image
    tempImage.tmp = tmp
    return tempImage
  }
}
