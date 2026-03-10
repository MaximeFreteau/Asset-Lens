import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET notifications pour un user
router.get('/', async (req, res) => {
    const { user_id, unread_only } = req.query

    let query = `SELECT * FROM notifications WHERE 1=1`
    const params: any[] = []

    if (user_id) {
        params.push(user_id)
        query += ` AND user_id = $${params.length}`
    }

    if (unread_only === 'true') {
        query += ` AND read = FALSE`
    }

    query += ` ORDER BY created_at DESC LIMIT 50`

    const result = await pool.query(query, params)
    res.json(result.rows)
})

// PATCH marquer comme lue
router.patch('/:id/read', async (req, res) => {
    const result = await pool.query(
        'UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *',
        [req.params.id]
    )
    res.json(result.rows[0])
})

// PATCH marquer toutes comme lues
router.patch('/read-all', async (req, res) => {
    const { user_id } = req.body
    await pool.query(
        'UPDATE notifications SET read = TRUE WHERE user_id = $1',
        [user_id]
    )
    res.json({ success: true })
})

// POST créer une notification (usage interne)
router.post('/', async (req, res) => {
    const { user_id, type, title, message, entity_type, entity_id } = req.body

    const result = await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `, [user_id, type, title, message, entity_type, entity_id])

    res.json(result.rows[0])
})

export default router