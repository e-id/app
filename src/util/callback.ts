import { exec, execSync } from 'child_process'

export class Callback {
  private readonly caller: string
  private readonly uri: string

  public constructor (caller: string, uri: string) {
    this.caller = caller
    this.uri = uri
  }

  public result (data: object): void {
    const callback = 'https:' + this.uri.substring(this.uri.indexOf(':') + 1)
    const url = new URL(callback)
    let urlData = encodeURIComponent(JSON.stringify(data))
    let caller = this.caller
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
        caller = 'start /b "" '
      } else {
        caller = `"${caller}" `
      }
      if (caller.includes('chrome.exe') || caller.includes('msedge.exe')) {
        caller = `${caller} --${appMode ? 'app=' : 'new-window '}`
      }
      const certKeys = Object.keys(data).filter((key: string) => key.includes('cert_'))
      const dataKeys = Object.keys(data).filter((key: string) => key.includes('data'))
      const fileKeys = Object.keys(data).filter((key: string) => key.includes('file'))
      while ((cmd = `${caller}"${callback}${urlData}"`).length > 8192) {
        const key = certKeys.length > 0 ? certKeys.shift() : dataKeys.length > 0 ? dataKeys.shift() : fileKeys.length > 0 ? fileKeys.shift() : undefined
        if (undefined !== key) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete data[key]
        }
        urlData = encodeURIComponent(JSON.stringify(data))
      }
      execSync(cmd, { windowsHide: hidden })
    }
  }
}
