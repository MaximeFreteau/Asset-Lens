// backend/src/routes/assets.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET tous les assets avec leur doc si elle existe
router.get('/', async (req, res) => {
  const { type, search } = req.query
  const params: any[] = []

  let where = 'WHERE 1=1'
  if (type)   { params.push(type);         where += ` AND a.asset_type = $${params.length}` }
  if (search) { params.push(`%${search}%`); where += ` AND a.name ILIKE $${params.length}` }

  const query = `
    SELECT DISTINCT ON (a.id) a.*, 
      d.id as doc_id, 
      d.title as doc_title, 
      LEFT(d.content, 200) as doc_content
    FROM assets a
    LEFT JOIN docs d ON d.entity_id = a.id AND d.entity_type = 'asset'
    ${where}
    ORDER BY a.id, d.created_at DESC
  `

  const result = await pool.query(query, params)
  res.json(result.rows)
})

// GET un asset par id
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT a.*, d.id as doc_id, d.title as doc_title, d.content as doc_content
     FROM assets a
     LEFT JOIN docs d ON d.entity_id = a.id AND d.entity_type = 'asset'
     WHERE a.id = $1`,
    [req.params.id]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' })
  res.json(result.rows[0])
})

// POST créer ou mettre à jour un asset (appelé depuis le plugin UE)
router.post('/sync', async (req, res) => {
  const { name, path, asset_type, metadata } = req.body
  const result = await pool.query(
    `INSERT INTO assets (name, path, asset_type, metadata)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (path) DO UPDATE
     SET name = $1, asset_type = $3, metadata = $4, updated_at = NOW()
     RETURNING *`,
    [name, path, asset_type, metadata]
  )
  res.json(result.rows[0])
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM assets WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

export default router