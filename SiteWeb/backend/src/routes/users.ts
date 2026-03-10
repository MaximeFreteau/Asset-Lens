// src/routes/users.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

router.get('/', async (_, res) => {
  const result = await pool.query('SELECT * FROM users ORDER BY name')
  res.json(result.rows)
})

router.post('/', async (req, res) => {
  const { name, role, email } = req.body
  const result = await pool.query(
    'INSERT INTO users (name, role, email) VALUES ($1, $2, $3) RETURNING *',
    [name, role, email || null]
  )
  res.json(result.rows[0])
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

export default router