/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

const CATEGORIES = [
  'StaticMesh', 'Blueprint', 'Light', 'Zone', 'Texture',
  'Material', 'Sound', 'Animation', 'VFX', 'Level', 'Other',
]

const STATUSES = [
  { value: 'todo',        label: 'À faire'   },
  { value: 'in_progress', label: 'En cours'  },
  { value: 'review',      label: 'En review' },
  { value: 'validated',   label: 'Validé'    },
  { value: 'integrated',  label: 'Intégré'   },
]

const PRIORITIES = [
  { value: 'low',      label: 'Basse'    },
  { value: 'normal',   label: 'Normale'  },
  { value: 'high',     label: 'Haute'    },
  { value: 'critical', label: 'Critique' },
]

export default function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [taskId, setTaskId] = useState('')
  const [users, setUsers]   = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const [form, setForm] = useState({
    task_name:           '',
    task_category:       '',
    asset_id:            '',
    assigned_to:         '',
    status:              'todo',
    priority:            'normal',
    deadline:            '',
    brief:               '',
    target_polycount:    '',
    target_texture_size: '',
    destination_path:    '',
    material_path:       '',
  })

  useEffect(() => {
    params.then(({ id }) => setTaskId(id))
  }, [params])

  useEffect(() => {
    if (!taskId) return

    const load = async () => {
      const [taskRes, usersRes, assetsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/tasks/${taskId}`),
        fetch(`${BASE_URL}/api/users`),
        fetch(`${BASE_URL}/api/assets`),
      ])

      const task   = await taskRes.json()
      const users  = await usersRes.json()
      const assets = await assetsRes.json()

      setUsers(users)
      setAssets(assets)
      setForm({
        task_name:           task.task_name           || '',
        task_category:       task.task_category       || '',
        asset_id:            task.asset_id            || 'none',
        assigned_to:         task.assigned_to         || '',
        status:              task.status              || 'todo',
        priority:            task.priority            || 'normal',
        deadline:            task.deadline
          ? task.deadline.split('T')[0] : '',
        brief:               task.brief               || '',
        target_polycount:    task.target_polycount    || '',
        target_texture_size: task.target_texture_size || '',
        destination_path:    task.destination_path    || '',
        material_path:       task.material_path       || '',
      })
      setLoading(false)
    }

    load()
  }, [taskId])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        asset_id:         form.asset_id || null,
        target_polycount: form.target_polycount
          ? parseInt(form.target_polycount) : null,
        deadline: form.deadline || null,
      }),
    })
    setSaving(false)
    router.push(`/tasks/${taskId}`)
  }

  if (loading) return (
    <div className="p-8 text-muted-foreground">Chargement...</div>
  )

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier la task</h1>
        <Button variant="ghost" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Nom */}
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input
              value={form.task_name}
              onChange={(e) => setForm({ ...form, task_name: e.target.value })}
              placeholder="ex: BP_EnemySpawner, LightSetup_Cave, SM_Rock..."
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select
              value={form.task_category}
              onValueChange={(v) => setForm({ ...form, task_category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset lié (optionnel) */}
          <div className="space-y-1.5">
            <Label>
              Asset lié{' '}
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Select
              value={form.asset_id}
              onValueChange={(v) => setForm({ ...form, asset_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun asset lié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {assets.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                    <span className="text-muted-foreground ml-2 text-xs">
                      {a.asset_type}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigné à */}
          <div className="space-y-1.5">
            <Label>Assigné à</Label>
            <Select
              value={form.assigned_to}
              onValueChange={(v) => setForm({ ...form, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.role && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        — {u.role}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priorité */}
          <div className="space-y-1.5">
            <Label>Priorité</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          {/* Brief */}
          <div className="space-y-1.5">
            <Label>Brief</Label>
            <Textarea
              value={form.brief}
              onChange={(e) => setForm({ ...form, brief: e.target.value })}
              placeholder="Description, contraintes techniques, références..."
              rows={4}
            />
          </div>

          {/* Polycount */}
          <div className="space-y-1.5">
            <Label>Polycount cible</Label>
            <Input
              type="number"
              value={form.target_polycount}
              onChange={(e) =>
                setForm({ ...form, target_polycount: e.target.value })
              }
              placeholder="ex: 5000"
            />
          </div>

          {/* Taille texture */}
          <div className="space-y-1.5">
            <Label>Taille de texture cible</Label>
            <Input
              value={form.target_texture_size}
              onChange={(e) =>
                setForm({ ...form, target_texture_size: e.target.value })
              }
              placeholder="ex: 2048x2048"
            />
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <Label>Dossier de destination</Label>
            <Input
              value={form.destination_path}
              onChange={(e) =>
                setForm({ ...form, destination_path: e.target.value })
              }
              placeholder="/Game/Assets/..."
            />
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <Label>Material path</Label>
            <Input
              value={form.material_path}
              onChange={(e) =>
                setForm({ ...form, material_path: e.target.value })
              }
              placeholder="/Game/Materials/..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </main>
  )
}