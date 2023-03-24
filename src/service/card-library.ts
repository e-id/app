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
          return ''
        default:
          return '/'
      }
    })()

    const libraryFile = ((): string => {
      switch (os.platform()) {
        case 'darwin':
          return '*pkcs11*.dylib'
        case 'linux':
          return '*pkcs11*.lib'
        case 'win32':
          return '/Program*/!(j2)pkcs11*.dll'
        default:
          return '*pkcs11*.lib'
      }
    })()

    return globSync(libraryFile, {
      cwd: libraryPath,
      matchBase: true
    }).map((library: string) => path.join(libraryPath, library))
  }
}
