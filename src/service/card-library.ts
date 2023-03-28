import { globSync } from 'glob'
import * as path from 'path'

export class CardLibrary {
  findAll (): string[] {
    const libraryPath = ((): string => {
      switch (process.platform) {
        case 'darwin':
          return '/Library'
        case 'linux':
          return '/usr/lib'
        case 'win32':
          return ''
        default:
          return '/'
      }
    })()

    const libraryFile = ((): string => {
      switch (process.platform) {
        case 'darwin':
          return '*pkcs11*.dylib'
        case 'linux':
          return '*pkcs11*.so'
        case 'win32':
          return '/Program*/**/!(j2)pkcs11*.dll'
        default:
          return '*pkcs11*.*'
      }
    })()

    return globSync(libraryFile, {
      cwd: libraryPath,
      matchBase: true
    }).map((library: string) => path.join(libraryPath, library))
  }
}
