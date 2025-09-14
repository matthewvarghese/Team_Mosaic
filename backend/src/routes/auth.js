import { Router } from 'express'
import { signJwt, verifyJwt } from '../utils/jwt.js'

const router = Router()

//w2 change AUth
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

router.get('/me', (req, res) => {
  const auth = req.get('authorization') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null
  
  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }
  
  const claims = verifyJwt(token)
  if (!claims) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  res.json({ me: claims })
})

export default router