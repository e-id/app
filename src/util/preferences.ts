import * as os from 'os'
import { execSync } from 'child_process'

export class Preferences {
  nameSpace: string
  lastError: string

  constructor (nameSpace: string) {
    if (os.platform() === 'darwin') {
      this.nameSpace = nameSpace
      this.lastError = ''
    }
  }

  getString (key: string): string | null {
    this.lastError = ''
    if (os.platform() === 'darwin') {
      try {
        return execSync(`defaults read ${this.nameSpace} ${key}`).toString().replace(/\n|\r/g, '')
      } catch (e) {
        this.lastError = e.message
        return null
      }
    }

    return null
  }

  setString (key: string, value: string): void {
    this.lastError = ''
    if (os.platform() === 'darwin') {
      try {
        execSync(`defaults write ${this.nameSpace} ${key} -string "${value}"`)
      } catch (e) {
        this.lastError = e.message
      }
    }
  }
}
