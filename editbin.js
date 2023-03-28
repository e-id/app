const fs = require('fs')
const bufferpack = require('bufferpack')

if (process.argv.length < 4) {
  console.log("Change Exe Run Mode Application \nNot sufficient parameters. 'exe_src_name.exe' 'exe_dest_name.exe' 'to_console' or 'to_windows'")
  process.exit(-1)
}

function read (f, size, offset) {
  if (typeof size === 'undefined') size = 1
  if (typeof offset === 'undefined') offset = -1
  const buffer = Buffer.alloc(size)
  fs.readSync(f, buffer, 0, size, offset)
  return buffer
}

const source = fs.openSync(process.argv[2], 'r')
const dest = fs.openSync(process.argv[3], 'w+')
fs.writeSync(dest, read(source, fs.statSync(process.argv[2]).size, 0))
const PeHeaderOffset = bufferpack.unpack('<H', read(dest, 2, 0x3c)).pop()
const PeSignature = bufferpack.unpack('<I', read(dest, 4, PeHeaderOffset)).pop()
if (PeSignature !== 0x4550) {
  console.log('Error in Find PE header')
  process.exit(-1)
}

if (process.argv[4] === 'to_console') {
  // console mode
  fs.writeSync(dest, bufferpack.pack('<H', [0x03]), 0, 1, PeHeaderOffset + 0x5C)
} else if (process.argv[4] === 'to_windows') {
  // window mode
  fs.writeSync(dest, bufferpack.pack('<H', [0x02]), 0, 1, PeHeaderOffset + 0x5C)
} else {
  console.log("Wrong Format: '" + process.argv[4] + "'")
}
fs.closeSync(source)
fs.closeSync(dest)

console.log('Completed succesfully.')
