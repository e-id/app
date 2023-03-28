const fs = require('fs')
const path = require('path')

const { exec } = require('pkg')
const { execSync } = require('node:child_process')

const target = (() => {
  switch (process.platform) {
    case 'darwin':
      return 'macos'
    case 'win32':
      return 'win'
    default:
      return process.platform
  }
})()

exec(['--compress', process.platform === 'win32' ? 'None' : 'Brotli', '--targets', target, '.']).then(() => {
  if (process.platform === 'darwin') {
    console.log(execSync('osacompile -o "dist/Open e-ID.app" src/mac/launcher.applescript').toString())
    console.log(execSync('plutil -replace LSUIElement -bool true "dist/Open e-ID.app/Contents/Info.plist"').toString())
    console.log(execSync('plutil -replace CFBundleIdentifier -string io.github.e-id "dist/Open e-ID.app/Contents/Info.plist"').toString())
    console.log(execSync('plutil -replace CFBundleURLTypes -array "dist/Open e-ID.app/Contents/Info.plist"').toString())
    console.log(execSync('plutil -insert CFBundleURLTypes -json \'{ "CFBundleURLName" : "e-ID", "CFBundleURLSchemes" : [ "e-id", "open-eid" ] }\' -append "dist/Open e-ID.app/Contents/Info.plist"').toString())
    fs.writeFileSync('dist/Open e-ID.app/Contents/Resources/applet.icns', fs.readFileSync('assets/icon.icns'))
    if (fs.existsSync('dist/Open e-ID.app/Contents/MacOS/e-id')) {
      fs.unlinkSync('dist/Open e-ID.app/Contents/MacOS/e-id')
    }
    fs.copyFileSync('dist/e-id', 'dist/Open e-ID.app/Contents/MacOS/e-id')
    if (fs.existsSync('dist/Open e-ID.app.zip')) {
      fs.unlinkSync('dist/Open e-ID.app.zip')
    }
    console.log(execSync('zip -vr "Open e-ID.app.zip" "Open e-ID.app/" -x "*.DS_Store"', { cwd: path.join(__dirname, '/dist') }).toString())
  }
  if (process.platform === 'win32') {
    const { load } = require('pe-library/cjs')
    load().then((PELibrary) => {
      const data = fs.readFileSync('dist/e-id.exe')
      const exe = PELibrary.NtExecutable.from(data)
      const res = PELibrary.NtExecutableResource.from(exe)
      const { load } = require('resedit/cjs')
      load().then((ResEdit) => {
        const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries)
        const vi = viList[0]
        vi.setFileVersion(0, 0, 1, 0, 1033)
        vi.setStringValues(
          { lang: 1033, codepage: 1200 },
          {
            FileDescription: 'Open e-ID',
            ProductName: 'Open e-ID'
          }
        )
        vi.outputToResourceEntries(res.entries)
        res.outputResource(exe)
        const newBinary = exe.generate()
        fs.writeFileSync('dist/Open e-ID (console).exe', Buffer.from(newBinary))
        console.log(execSync(process.argv0 + ' editbin.js "dist/Open e-ID (console).exe" "dist/Open e-ID.exe" "to_windows"').toString())
      })
    })
  }
})
