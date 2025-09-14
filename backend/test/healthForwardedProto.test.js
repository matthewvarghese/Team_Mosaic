import app from '../src/index.js'
import assert from 'node:assert'
import test from 'node:test'
import http from 'node:http'

test('US13 https test', async () => {
  const server = http.createServer(app)
  
  await new Promise(resolve => {
    server.listen(0, resolve)
  })
  
  const { port } = server.address()

  try {
    const res = await fetch(`http://localhost:${port}/health`, {
      headers: { 'x-forwarded-proto': 'https' }
    })
    assert.strictEqual(res.status, 200)
    assert.deepStrictEqual(await res.json(), { status: 'ok' })
  } finally {
    server.close()
  }
})