// backend/src/routes/scenes.ts
import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET toutes les scènes
router.get('/', async (_, res) => {
  const result = await pool.query(
    `SELECT s.*, COUNT(a.id) as actor_count
     FROM scenes s
     LEFT JOIN actors a ON a.scene_id = s.id
     GROUP BY s.id
     ORDER BY s.updated_at DESC`
  )
  res.json(result.rows)
})

// GET une scène avec tous ses acteurs et lumières
router.get('/:id', async (req, res) => {
  const scene = await pool.query('SELECT * FROM scenes WHERE id = $1', [req.params.id])
  if (!scene.rows[0]) return res.status(404).json({ error: 'Scene not found' })

  const actors = await pool.query(
    `SELECT ac.*, d.content as doc_content, l.light_type, l.intensity, l.color, l.metadata as light_meta
     FROM actors ac
     LEFT JOIN docs d ON d.entity_id = ac.id AND d.entity_type = 'actor'
     LEFT JOIN lights l ON l.actor_id = ac.id
     WHERE ac.scene_id = $1
     ORDER BY ac.actor_type, ac.name`,
    [req.params.id]
  )

  res.json({ ...scene.rows[0], actors: actors.rows })
})

// POST sync scène depuis le plugin UE (reçoit tout le contenu de la scène)
router.post('/sync', async (req, res) => {
  const { name, path, actors, metadata } = req.body

  // Upsert la scène
  const sceneResult = await pool.query(
    `INSERT INTO scenes (name, path, metadata)
     VALUES ($1, $2, $3)
     ON CONFLICT (path) DO UPDATE
     SET name = $1, metadata = $3, updated_at = NOW()
     RETURNING *`,
    [name, path, metadata]
  )
  const scene = sceneResult.rows[0]

  // Sync les acteurs
  // Remplace le INSERT des acteurs par :
for (const actor of actors || []) {
    const actorResult = await pool.query(
      `INSERT INTO actors (scene_id, name, actor_type, transform, metadata)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (scene_id, name) DO UPDATE
      SET actor_type = EXCLUDED.actor_type,
          transform = EXCLUDED.transform,
          metadata = EXCLUDED.metadata
      RETURNING *`,
      [scene.id, actor.label || actor.name, actor.actor_type, actor.transform, actor.metadata]
    )

    if (actor.light && actorResult.rows[0]) {
      await pool.query(
        `INSERT INTO lights (actor_id, scene_id, light_type, intensity, color, temperature, radius, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (actor_id) DO UPDATE
         SET light_type = EXCLUDED.light_type,
             intensity = EXCLUDED.intensity,
             color = EXCLUDED.color,
             temperature = EXCLUDED.temperature,
             metadata = EXCLUDED.metadata`,
        [actorResult.rows[0].id, scene.id, actor.light.type, actor.light.intensity,
         actor.light.color, actor.light.temperature, actor.light.radius, actor.light.metadata]
      )
    }
}

  res.json(scene)
})

export default router