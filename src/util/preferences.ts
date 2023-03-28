import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as reg from 'native-reg'

import { execSync } from 'child_process'

export class Preferences {
  nameSpace: string
  lastError: string

  constructor (nameSpace: string) {
    this.nameSpace = nameSpace
    this.lastError = ''
  }

  getString (key: string): string | null {
    this.lastError = ''
    if (process.platform === 'darwin') {
      try {
        return execSync(`defaults read ${this.nameSpace} ${key}`).toString().replace(/\n|\r/g, '')
      } catch (e) {
        this.lastError = e.message
        return null
      }
    }

    if (process.platform === 'linux') {
      try {
        const storeFile = path.join(os.homedir(), '.' + this.nameSpace + '.json')
        const preferences = JSON.parse(fs.readFileSync(storeFile).toString())
        return preferences[key]
      } catch (e) {
        this.lastError = e.message
        return null
      }
    }

    if (process.platform === 'win32') {
      let hkey = reg.openKey(reg.HKCU, 'SOFTWARE\\Open e-ID', reg.Access.ALL_ACCESS)
      if (hkey === null) {
        hkey = reg.createKey(reg.HKCU, 'SOFTWARE\\Open e-ID', reg.Access.ALL_ACCESS)
      }
      const value = reg.queryValue(hkey, key)
      reg.closeKey(hkey)
      return String(value)
    }

    return null
  }

  setString (key: string, value: string): void {
    this.lastError = ''
    if (process.platform === 'darwin') {
      try {
        execSync(`defaults write ${this.nameSpace} ${key} -string "${value}"`)
      } catch (e) {
        this.lastError = e.message
      }
    }

    if (process.platform === 'linux') {
      try {
        const storeFile = path.join(os.homedir(), '.' + this.nameSpace + '.json')
        const preferences = JSON.parse(fs.readFileSync(storeFile).toString())
        preferences[key] = value
        fs.writeFileSync(storeFile, JSON.stringify(preferences))
      } catch (e) {
        this.lastError = e.message
      }
    }

    if (process.platform === 'win32') {
      let hkey = reg.openKey(reg.HKCU, 'SOFTWARE\\Open e-ID', reg.Access.ALL_ACCESS)
      if (hkey === null) {
        hkey = reg.createKey(reg.HKCU, 'SOFTWARE\\Open e-ID', reg.Access.ALL_ACCESS)
      }
      reg.setValueSZ(hkey, key, value)
      reg.closeKey(hkey)
    }
  }
}
