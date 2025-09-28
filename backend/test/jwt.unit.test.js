import test from 'node:test'
import assert from 'node:assert/strict'
import { signJwt, verifyJwt } from '../src/auth/jwt.js'

test('verifyJwt: returns null for invalid token', () => {
  const bad = 'not.a.jwt'
  const claims = verifyJwt(bad)
  assert.equal(claims, null)
})

test('signJwt/verifyJwt: roundtrip valid', () => {
  const t = signJwt({ sub: 'round@trip.dev', scope: ['user'] })
  const claims = verifyJwt(t)
  assert.equal(claims.sub, 'round@trip.dev')
})
