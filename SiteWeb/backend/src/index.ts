// backend/src/index.ts

import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import path from 'path'
import uploadRouter from './routes/upload'
import assetsRouter from './routes/assets'
import scenesRouter from './routes/scenes'
import actorsRouter from './routes/actors'
import lightsRouter from './routes/lights'
import docsRouter from './routes/docs'
import tasksRouter from './routes/tasks'
import usersRouter from './routes/users'
import notificationsRouter from './routes/notifications'
import projectDocsRouter from './routes/projectDocs'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use('/api/assets', assetsRouter)
app.use('/api/scenes', scenesRouter)
app.use('/api/actors', actorsRouter)
app.use('/api/lights', lightsRouter)
app.use('/api/docs', docsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/users', usersRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/project-docs', projectDocsRouter)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/upload', uploadRouter)

app.listen(PORT, () => {
  console.log(`AssetLens backend running on port ${PORT}`)
})