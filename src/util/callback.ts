import activeWindow from 'active-win'

import { exec, execSync } from 'child_process'

export class Callback {
  private readonly uri: string

  public constructor (uri: string) {
    this.uri = uri
  }

  public result (data: object): void {
    const callback = 'https:' + this.uri.substring(this.uri.indexOf(':') + 1)
    const url = new URL(callback)
    const urlData = encodeURIComponent(JSON.stringify(data))
    let caller = ''
    if (process.platform === 'darwin') {
      caller = String(process.env.OPEN_EID_APP ?? '')
    }
    if (process.platform === 'win32') {
      caller = activeWindow.sync()?.owner.path ?? ''
    }
    let cmd = ''
    const appMode = url.searchParams.has('e-id-app') ? url.searchParams.get('e-id-app') === '1' : false
    const hidden = url.searchParams.has('e-id-hidden') ? url.searchParams.get('e-id-hidden') === '1' && !appMode : false
    if (process.platform === 'darwin') {
      if (caller !== '') {
        cmd = `open --new -a ${caller} "${callback}${urlData}"`
      } else {
        cmd = `open --url "${callback}${urlData}"`
      }
      if (caller.includes('/Safari.app/')) {
        cmd = `open -a "${caller}" "${callback}${urlData}"`
      }
      if (caller.includes('/Google Chrome.app/') || caller.includes('/Microsoft Edge.app/')) {
        cmd = `open --new "${caller}" --args --${appMode ? 'app=' : 'new-window '}"${callback}${urlData}"`
      }
      exec(cmd)
    }
    if (process.platform === 'win32') {
      if (
        caller.includes('\\Code.exe') ||
        caller.includes('\\WindowsTerminal.exe') ||
        caller.includes('\\cmd.exe') ||
        caller === ''
      ) {
        caller = 'start /b ""'
      } else {
        caller = `"${caller}"`
      }
      if (caller.includes('chrome.exe') || caller.includes('msedge.exe')) {
        caller = `${caller} --${appMode ? 'app=' : 'new-window '}`
      }
      cmd = `${caller}"${callback}${urlData}"`
      execSync(cmd, { windowsHide: hidden })
    }
  }
}
