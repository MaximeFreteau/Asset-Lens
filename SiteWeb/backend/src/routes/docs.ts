// backend/src/routes/docs.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET doc d'une entité
router.get('/entity/:type/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT d.*, u.name as author_name
     FROM docs d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.entity_type = $1 AND d.entity_id = $2`,
    [req.params.type, req.params.id]
  )
  res.json(result.rows[0] || null)
})

// POST créer une doc
router.post('/', async (req, res) => {
  const { title, content, template_type, entity_type, entity_id, author_id } = req.body
  const result = await pool.query(
    `INSERT INTO docs (title, content, template_type, entity_type, entity_id, author_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, content, template_type, entity_type, entity_id, author_id]
  )
  res.json(result.rows[0])
})

// PUT mettre à jour une doc + sauvegarder l'historique
router.put('/:id', async (req, res) => {
  const { content, author_id } = req.body

  // Sauvegarde l'ancienne version dans l'historique
  const old = await pool.query('SELECT content FROM docs WHERE id = $1', [req.params.id])
  if (old.rows[0]) {
    await pool.query(
      'INSERT INTO doc_history (doc_id, content, author_id) VALUES ($1, $2, $3)',
      [req.params.id, old.rows[0].content, author_id]
    )
  }

  const result = await pool.query(
    `UPDATE docs SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [content, req.params.id]
  )
  res.json(result.rows[0])
})

export default router