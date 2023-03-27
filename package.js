const fs = require('fs')
const os = require('os')

const { exec } = require('pkg')
const { execSync } = require('node:child_process')

exec(['--compress', 'Brotli', '.']).then(() => {
  if (os.platform() === 'darwin') {
    execSync('osacompile -o dist/e-id.app src/mac/launcher.applescript')
    execSync('plutil -replace LSUIElement -bool true dist/e-id.app/Contents/Info.plist')
    execSync('plutil -replace CFBundleIdentifier -string io.github.e-id dist/e-id.app/Contents/Info.plist')
    execSync('plutil -replace CFBundleURLTypes -array dist/e-id.app/Contents/Info.plist')
    execSync('plutil -insert CFBundleURLTypes -json \'{ "CFBundleURLName" : "e-ID", "CFBundleURLSchemes" : [ "e-id", "open-eid" ] }\' -append dist/e-id.app/Contents/Info.plist')
    fs.writeFileSync('dist/e-id.app/Contents/Resources/applet.icns', fs.readFileSync('assets/icon.icns'))
    if (fs.existsSync('dist/e-id.app/Contents/MacOS/e-id')) {
      fs.unlinkSync('dist/e-id.app/Contents/MacOS/e-id')
    }
    fs.copyFileSync('dist/e-id', 'dist/e-id.app/Contents/MacOS/e-id')
  }
})
