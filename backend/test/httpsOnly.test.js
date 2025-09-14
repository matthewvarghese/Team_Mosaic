import app from '../src/index.js'
import assert from 'node:assert'
import test from 'node:test'
import http from 'node:http'

test('US13 blocks non HTTPS requests', async () => {
  const server = http.createServer(app)
  
  await new Promise(resolve => {
    server.listen(0, resolve)
  })
  
  const { port } = server.address()

  try {
    const res = await fetch(`http://localhost:${port}/health`)
    assert.strictEqual(res.status, 400)
    assert.deepStrictEqual(await res.json(), { error: 'HTTPS is required' })
  } finally {
    server.close()
  }
})