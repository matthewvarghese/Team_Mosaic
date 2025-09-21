import app from '../src/index.js'
import assert from 'node:assert'
import test from 'node:test'
import http from 'http'

test('US1: auth/login returns JWT ', async () => {
  const server = http.createServer(app)
  await new Promise(r => server.listen(0, r))
  const { port } = server.address()

  const res = await fetch(`http://localhost:${port}/auth/login`, {
    method: 'POST',
    headers: {
      'x-forwarded-proto': 'https',
      'content-type': 'application/json'
    },
    body: JSON.stringify({ providerCode: 'dummy', email: 'you@team-mosaic.dev' })
  })
  const body = await res.json()
  assert.strictEqual(res.status, 200)
  assert.ok(body.token, 'token should be present')
  server.close()
})

test('US1: auth/login missing code 400', async () => {
  const server = http.createServer(app)
  await new Promise(r => server.listen(0, r))
  const { port } = server.address()

  const res = await fetch(`http://localhost:${port}/auth/login`, {
    method: 'POST',
    headers: {
      'x-forwarded-proto': 'https',
      'content-type': 'application/json'
    },
    body: JSON.stringify({ email: 'you@team-mosaic.dev' })
  })
  const body = await res.json()
  assert.strictEqual(res.status, 400)
  assert.strictEqual(body.error, 'providerCode is required')
  server.close()
})

test('US-1:empty request body 400', async () => {
  const server = http.createServer(app)
  await new Promise(r => server.listen(0, r))
  const { port } = server.address()

  const res = await fetch(`http://localhost:${port}/auth/login`, {
    method: 'POST',
    headers: {
      'x-forwarded-proto': 'https',
      'content-type': 'application/json'
    },
    body: JSON.stringify({})
  })
  const body = await res.json()
  assert.strictEqual(res.status, 400)
  assert.ok(body.error)
  server.close()
})