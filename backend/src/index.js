import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import { httpsOnly } from './middleware/httpsOnly.js'
import authRouter from './routes/auth.js'
import healthRouter from './routes/health.js'

const app = express()
app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

//https
if (process.env.ENFORCE_HTTPS !== 'false') {
  app.enable('trust proxy') 
  app.use(httpsOnly)
}

  
// routes
app.use('/health', healthRouter)
app.use('/auth', authRouter)

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`[TeamMosaic] API listening on ${port}`))
}

export default app