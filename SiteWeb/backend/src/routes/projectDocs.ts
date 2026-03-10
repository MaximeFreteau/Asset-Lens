import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET tous les docs avec recherche full-text et tags
router.get('/', async (req, res) => {
    const { search, tag, category } = req.query
    const params: any[] = []
    let where = 'WHERE 1=1'

    if (search) {
        params.push(search)
        where += ` AND search_vector @@ plainto_tsquery('french', $${params.length})`
    }

    if (tag) {
        params.push(tag)
        where += ` AND $${params.length} = ANY(tags)`
    }

    if (category) {
        params.push(category)
        where += ` AND category = $${params.length}`
    }

    const orderBy = search
        ? `ts_rank(search_vector, plainto_tsquery('french', $1)) DESC, updated_at DESC`
        : `updated_at DESC`

    const result = await pool.query(`
        SELECT pd.*, u.name as author_name
        ${search ? `, ts_rank(search_vector, plainto_tsquery('french', $1)) as rank` : ''}
        FROM project_docs pd
        LEFT JOIN users u ON u.id = pd.author_id
        ${where}
        ORDER BY ${orderBy}
    `, params)

    res.json(result.rows)
})

// GET un doc par id
router.get('/:id', async (req, res) => {
    const result = await pool.query(`
        SELECT pd.*, u.name as author_name
        FROM project_docs pd
        LEFT JOIN users u ON u.id = pd.author_id
        WHERE pd.id = $1
    `, [req.params.id])

    if (!result.rows[0]) return res.status(404).json({ error: 'Doc not found' })
    res.json(result.rows[0])
})

// GET tous les tags existants
router.get('/meta/tags', async (req, res) => {
    const result = await pool.query(`
        SELECT DISTINCT unnest(tags) as tag FROM project_docs ORDER BY tag
    `)
    res.json(result.rows.map((r: any) => r.tag))
})

// POST créer un doc
router.post('/', async (req, res) => {
    const { title, content, category, tags, file_url, file_type, cover_url, author_id } = req.body

    const result = await pool.query(`
        INSERT INTO project_docs (title, content, category, tags, file_url, file_type, cover_url, author_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [title, content, category, tags || [], file_url, file_type, cover_url, author_id])

    res.json(result.rows[0])
})

// PUT mettre à jour
router.put('/:id', async (req, res) => {
    const { title, content, category, tags, file_url, file_type, cover_url } = req.body

    const result = await pool.query(`
        UPDATE project_docs SET
            title = $1, content = $2, category = $3, tags = $4,
            file_url = $5, file_type = $6, cover_url = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
    `, [title, content, category, tags || [], file_url, file_type, cover_url, req.params.id])

    res.json(result.rows[0])
})

// DELETE
router.delete('/:id', async (req, res) => {
    await pool.query('DELETE FROM project_docs WHERE id = $1', [req.params.id])
    res.json({ success: true })
})

export default router