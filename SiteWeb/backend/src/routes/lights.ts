// src/routes/lights.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

router.get('/', async (req, res) => {
  const { scene_id, tag } = req.query
  let query = `
    SELECT l.*, ac.name as actor_name, d.content as doc_content
    FROM lights l
    JOIN actors ac ON ac.id = l.actor_id
    LEFT JOIN docs d ON d.entity_id = l.id AND d.entity_type = 'light'
    WHERE 1=1
  `
  const params: any[] = []
  if (scene_id) { params.push(scene_id); query += ` AND l.scene_id = $${params.length}` }
  query += ' ORDER BY l.light_type'

  const result = await pool.query(query, params)
  res.json(result.rows)
})

router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT l.*, ac.name as actor_name, d.id as doc_id, d.content as doc_content
     FROM lights l
     JOIN actors ac ON ac.id = l.actor_id
     LEFT JOIN docs d ON d.entity_id = l.id AND d.entity_type = 'light'
     WHERE l.id = $1`,
    [req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Light not found' })
  res.json(result.rows[0])
})

router.put('/:id/doc', async (req, res) => {
  const { content } = req.body
  const result = await pool.query(
    `UPDATE docs SET content = $1, updated_at = NOW()
     WHERE entity_id = $2 AND entity_type = 'light'
     RETURNING *`,
    [content, req.params.id]
  )
  res.json(result.rows[0])
})

export default router