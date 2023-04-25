import { App } from './app'

const chunks = []

process.stdin.on('readable', () => {
  let chunk = null
  while ((chunk = process.stdin.read()) !== null) {
    chunks.push(chunk)
  }
  try {
    const stringData = Buffer.concat(chunks)
    const payloadSize = stringData.readUInt32LE(0)
    const contentWithoutSize = (stringData as Uint8Array).slice(4, (payloadSize + 4))
    const json = JSON.parse(contentWithoutSize.toString())
    if (Object.keys(json).includes('url')) {
      clearTimeout(nativeTimeout)
      const app = new App()
      app.start(json.url)
    } else {
      chunks.length = 0
    }
  } catch (e) {
    chunks.length = 0
  }
})

const nativeTimeout = setTimeout(() => {
  if (chunks.length === 0) {
    const app = new App()
    app.start()
  }
}, 1000)
