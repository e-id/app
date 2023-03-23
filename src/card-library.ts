import { globSync } from 'glob'
import * as os from 'os'
import * as path from 'path'

export class CardLibrary {
  findAll (): string[] {
    const libraryPath = ((): string => {
      switch (os.platform()) {
        case 'darwin':
          return '/Library'
        case 'linux':
          return '/usr/local/lib'
        case 'win32':
          return '/'
        default:
          return '/'
      }
    })()

    const libraryExt = ((): string => {
      switch (os.platform()) {
        case 'darwin':
          return '.dylib'
        case 'linux':
          return '.lib'
        case 'win32':
          return '.dll'
        default:
          return '.*'
      }
    })()

    return globSync(path.join(libraryPath, '**', '*pkcs11*' + libraryExt))
  }
}
