// src/routes/tasks.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET toutes les tasks
router.get('/', async (req, res) => {
    const { assigned_to, status } = req.query

    let query = `
        SELECT t.*,
            COALESCE(t.task_name, a.name) as asset_name,
            COALESCE(t.task_category, a.asset_type) as asset_type,
            a.name as linked_asset_name,
            u.name as assigned_name, u.role as assigned_role
        FROM asset_tasks t
        LEFT JOIN assets a ON t.asset_id = a.id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE 1=1
    `
    const params: any[] = []

    if (assigned_to) {
        params.push(assigned_to)
        query += ` AND t.assigned_to = $${params.length}`
    }

    if (status) {
        const statuses = Array.isArray(status) ? status : [status]
        const placeholders = statuses.map((_, i) => `$${params.length + i + 1}`).join(', ')
        params.push(...statuses)
        query += ` AND t.status IN (${placeholders})`
    }

    if (req.query.exclude_status) {
        const excluded = Array.isArray(req.query.exclude_status)
            ? req.query.exclude_status : [req.query.exclude_status]
        const placeholders = excluded.map((_, i) => `$${params.length + i + 1}`).join(', ')
        params.push(...excluded)
        query += ` AND t.status NOT IN (${placeholders})`
    }

    if (req.query['status[]']) {
        const statuses = Array.isArray(req.query['status[]'])
            ? req.query['status[]'] : [req.query['status[]']]
        const placeholders = statuses.map((_, i) => `$${params.length + i + 1}`).join(', ')
        params.push(...statuses)
        query += ` AND t.status IN (${placeholders})`
    }

    query += ` ORDER BY t.created_at DESC`

    const result = await pool.query(query, params)
    res.json(result.rows)
})

// GET une task par id
router.get('/:id', async (req, res) => {
    const task = await pool.query(`
        SELECT t.*,
            COALESCE(t.task_name, a.name) as asset_name,
            COALESCE(t.task_category, a.asset_type) as asset_type,
            u.name as assigned_name, u.role as assigned_role,
            a.name as linked_asset_name, a.path as asset_path
        FROM asset_tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN assets a ON a.id = t.asset_id
        WHERE t.id = $1
    `, [req.params.id])

    if (!task.rows[0]) return res.status(404).json({ error: 'Task not found' })

    const references = await pool.query(
        'SELECT * FROM task_references WHERE task_id = $1 ORDER BY created_at DESC',
        [req.params.id]
    )

    const comments = await pool.query(`
        SELECT c.*, u.name as author_name, u.role as author_role
        FROM task_comments c
        LEFT JOIN users u ON u.id = c.author_id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
    `, [req.params.id])

    res.json({
        ...task.rows[0],
        references: references.rows,
        comments: comments.rows
    })
})

// POST créer une task
router.post('/', async (req, res) => {
    const {
        asset_id, task_name, task_category,
        assigned_to, status, priority, deadline,
        brief, target_polycount, target_texture_size,
        destination_path, material_path, import_config
    } = req.body

    const result = await pool.query(`
        INSERT INTO asset_tasks (
            asset_id, task_name, task_category,
            assigned_to, status, priority, deadline,
            brief, target_polycount, target_texture_size,
            destination_path, material_path, import_config
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *
    `, [
        asset_id || null, task_name, task_category,
        assigned_to, status || 'todo', priority || 'normal',
        deadline, brief, target_polycount, target_texture_size,
        destination_path, material_path, import_config
    ])

    // Notifie l'artiste assigné
    if (result.rows[0].assigned_to) {
        const name = task_name || 'Nouvelle task'
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
            VALUES ($1, 'task_assigned', 'Nouvelle task assignée', $2, 'task', $3)
        `, [result.rows[0].assigned_to, `"${name}" vous a été assignée.`, result.rows[0].id])
    }

    res.json(result.rows[0])
})

// PUT mettre à jour une task
router.put('/:id', async (req, res) => {
    const {
        asset_id, task_name, task_category,
        assigned_to, status, priority, deadline,
        brief, target_polycount, target_texture_size,
        destination_path, material_path, import_config
    } = req.body

    // Récupère l'ancien assigned_to pour détecter un changement
    const old = await pool.query(
        'SELECT assigned_to FROM asset_tasks WHERE id = $1',
        [req.params.id]
    )

    const result = await pool.query(`
        UPDATE asset_tasks SET
            asset_id = $1, task_name = $2, task_category = $3,
            assigned_to = $4, status = $5, priority = $6, deadline = $7,
            brief = $8, target_polycount = $9, target_texture_size = $10,
            destination_path = $11, material_path = $12, import_config = $13,
            updated_at = NOW()
        WHERE id = $14
        RETURNING *
    `, [
        asset_id || null, task_name, task_category,
        assigned_to, status, priority, deadline,
        brief, target_polycount, target_texture_size,
        destination_path, material_path, import_config,
        req.params.id
    ])

    // Notifie si l'assignation a changé
    const oldAssigned = old.rows[0]?.assigned_to
    if (assigned_to && assigned_to !== oldAssigned) {
        const name = task_name || 'Une task'
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
            VALUES ($1, 'task_assigned', 'Task assignée', $2, 'task', $3)
        `, [assigned_to, `"${name}" vous a été assignée.`, req.params.id])
    }

    res.json(result.rows[0])
})

// PATCH juste le statut
router.patch('/:id/status', async (req, res) => {
    const { status } = req.body

    const result = await pool.query(
        'UPDATE asset_tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
    )

    const task = result.rows[0]

    if (task && task.assigned_to) {
        let type = ''
        let title = ''
        let message = ''
        const name = task.task_name || 'Votre asset'

        if (status === 'review') {
            type = 'task_review'
            title = 'Asset en attente de validation'
            message = `"${name}" est prêt à être validé.`
        } else if (status === 'validated') {
            type = 'task_validated'
            title = 'Task validée ✓'
            message = `"${name}" a été validé.`
        } else if (status === 'todo') {
            type = 'task_rejected'
            title = 'Asset à refaire ↩'
            message = `"${name}" a été renvoyé pour corrections.`
        }

        if (type) {
            await pool.query(`
                INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
                VALUES ($1, $2, $3, $4, 'task', $5)
            `, [task.assigned_to, type, title, message, task.id])
        }
    }

    res.json(task)
})

// POST ajouter une référence
router.post('/:id/references', async (req, res) => {
    const { url, image_url, note } = req.body
    const result = await pool.query(
        'INSERT INTO task_references (task_id, url, image_url, note) VALUES ($1,$2,$3,$4) RETURNING *',
        [req.params.id, url, image_url, note]
    )
    res.json(result.rows[0])
})

// DELETE supprimer une task
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM asset_tasks WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

// DELETE supprimer une référence (doit être après)
router.delete('/references/:id', async (req, res) => {
  await pool.query('DELETE FROM task_references WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

// POST ajouter un commentaire
router.post('/:id/comments', async (req, res) => {
    const { content, author_id } = req.body
    const result = await pool.query(
        'INSERT INTO task_comments (task_id, content, author_id) VALUES ($1,$2,$3) RETURNING *',
        [req.params.id, content, author_id]
    )
    res.json(result.rows[0])
})

export default router