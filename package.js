const fs = require('fs')
const os = require('os')

const { exec } = require('pkg')
const { execSync } = require('node:child_process')

exec(['--compress', 'Brotli', '.']).then(() => {
  if (os.platform() === 'darwin') {
    execSync('osacompile -o build/e-id.app src/mac/launcher.applescript')
    execSync('plutil -replace LSUIElement -bool true build/e-id.app/Contents/Info.plist')
    execSync('plutil -replace CFBundleIdentifier -string io.github.e-id build/e-id.app/Contents/Info.plist')
    execSync('plutil -replace CFBundleURLTypes -array build/e-id.app/Contents/Info.plist')
    execSync('plutil -insert CFBundleURLTypes -json \'{ "CFBundleURLName" : "e-ID", "CFBundleURLSchemes" : [ "e-id", "open-eid" ] }\' -append build/e-id.app/Contents/Info.plist')
    fs.writeFileSync('build/e-id.app/Contents/Resources/applet.icns', fs.readFileSync('assets/icon.icns'))
    if (fs.existsSync('build/e-id.app/Contents/MacOS/e-id')) {
      fs.unlinkSync('build/e-id.app/Contents/MacOS/e-id')
    }
    fs.copyFileSync('build/e-id', 'build/e-id.app/Contents/MacOS/e-id')
  }
})
