export function httpsOnly(req, res, next) {
    const isSecure = req.secure || (req.get('x-forwarded-proto') === 'https')
    if (!isSecure) {
      return res.status(400).json({ error: 'HTTPS is required' })
    }
    next()
  }