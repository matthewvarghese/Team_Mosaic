import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'dev_secret' 

export function signJwt(payload) {
  return jwt.sign(payload, secret, { expiresIn: '30m' })
}

export function verifyJwt(token) {
  try { 
    return jwt.verify(token, secret) 
  } catch {
    return null 
  }
}