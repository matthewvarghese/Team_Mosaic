import { Router } from 'express'
import { signJwt, verifyJwt } from '../auth/jwt.js'

const router = Router()

//S4 change AUth
router.post('/login', (req, res) => {
  const { providerCode, email } = req.body || {}
  
  if (!providerCode) {
    return res.status(400).json({ error: 'providerCode is required' })
  }
  
  const token = signJwt({ 
    sub: email || 'demo@teammosaic.dev', 
    scope: ['user'] 
  })
  
  res.status(200).json({ token })
})

router.get('/providers', (_req, res) => {
  res.json({ providers: ['google', 'github','dummy'] })
})

router.get('/me', (req, res) => {
  const auth = req.get('authorization') || ''
  const token = auth?.match(/^Bearer (.+)$/i)?.[1] || null
  
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }
  
  const claims = verifyJwt(token)
  if (!claims) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  res.json({ me: claims })
})
router.post('/logout', (_req, res) => {
  res.status(204).end()
})
export default router