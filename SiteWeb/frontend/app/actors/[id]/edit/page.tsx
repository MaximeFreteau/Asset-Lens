'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

const DEFAULT_TEMPLATE = `## Description
Décris cet acteur ici.

## Rôle dans la scène
À quoi sert cet acteur dans le niveau ?

## Notes techniques
- 

## Notes
`

export default function ActorDocEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [actorId, setActorId] = useState('')
  const [actor, setActor]     = useState<any>(null)
  const [docId, setDocId]     = useState<string | null>(null)
  const [title, setTitle]     = useState('')
  const [content, setContent] = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    params.then(({ id }) => setActorId(id))
  }, [params])

  useEffect(() => {
    if (!actorId) return

    const load = async () => {
      // Charge l'acteur
      const actorRes = await fetch(`${BASE_URL}/api/actors/${actorId}`)
      const actorData = await actorRes.json()
      setActor(actorData)
      setTitle(actorData.name || '')

      // Charge la doc si elle existe
      const docRes = await fetch(
        `${BASE_URL}/api/docs/entity/actor/${actorId}`
      )
      if (docRes.ok) {
        const doc = await docRes.json()
        if (doc && doc.id) {
          setDocId(doc.id)
          setTitle(doc.title || actorData.name || '')
          setContent(doc.content || DEFAULT_TEMPLATE)
        }
      }

      setLoading(false)
    }

    load()
  }, [actorId])

  const handleSave = async () => {
    setSaving(true)

    if (docId) {
      // Mise à jour
      await fetch(`${BASE_URL}/api/docs/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
    } else {
      // Création
      const res = await fetch(`${BASE_URL}/api/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          template_type: 'actor',
          entity_type: 'actor',
          entity_id: actorId,
        }),
      })
      const doc = await res.json()
      setDocId(doc.id)
    }

    setSaving(false)
    router.back()
  }

  const handleDelete = async () => {
    if (!docId) return
    if (!confirm('Supprimer cette documentation ?')) return

    await fetch(`${BASE_URL}/api/docs/${docId}`, { method: 'DELETE' })
    router.back()
  }

  if (loading) return (
    <div className="p-8 text-muted-foreground">Chargement...</div>
  )

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {docId ? 'Modifier la doc' : 'Créer la doc'}
          </h1>
          {actor && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{actor.name}</span>
              {actor.actor_type && (
                <Badge variant="secondary" className="text-xs">
                  {actor.actor_type}
                </Badge>
              )}
              {actor.light_type && (
                <Badge variant="outline" className="text-xs">
                  {actor.light_type}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la doc..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Contenu (Markdown)</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="font-mono text-sm"
              placeholder="Documentation en Markdown..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {docId && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  Supprimer la doc
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving || !title}>
                {saving ? 'Sauvegarde...' : docId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </main>
  )
}