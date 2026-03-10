// src/routes/actors.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

router.get('/', async (req, res) => {
  const { scene_id } = req.query
  let query = `
    SELECT ac.*, d.content as doc_content
    FROM actors ac
    LEFT JOIN docs d ON d.entity_id = ac.id AND d.entity_type = 'actor'
    WHERE 1=1
  `
  const params: any[] = []
  if (scene_id) { params.push(scene_id); query += ` AND ac.scene_id = $${params.length}` }
  query += ' ORDER BY ac.actor_type, ac.name'

  const result = await pool.query(query, params)
  res.json(result.rows)
})

router.get('/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT sa.*, 
      d.id as doc_id, d.content as doc_content, d.title as doc_title
    FROM scene_actors sa
    LEFT JOIN docs d ON d.entity_id = sa.id 
      AND d.entity_type = 'actor'
    WHERE sa.id = $1
  `, [req.params.id])

  if (!result.rows[0]) return res.status(404).json({ error: 'Actor not found' })
  res.json(result.rows[0])
})

router.put('/:id/doc', async (req, res) => {
  const { content } = req.body
  const result = await pool.query(
    `UPDATE docs SET content = $1, updated_at = NOW()
     WHERE entity_id = $2 AND entity_type = 'actor'
     RETURNING *`,
    [content, req.params.id]
  )
  res.json(result.rows[0])
})

export default router