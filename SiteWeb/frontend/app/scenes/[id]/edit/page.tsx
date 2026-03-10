// app/actors/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { fetchDoc, createDoc, updateDoc } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const TEMPLATES: Record<string, string> = {
  actor: `## Rôle dans la scène
Quel est le rôle de cet acteur ?

## Interactions
Avec quels autres acteurs interagit-il ?

## Contraintes de placement
Y a-t-il des règles de placement à respecter ?

## Notes
`,
  light: `## Intention artistique
Quel sentiment cette lumière crée-t-elle ?

## Paramètres clés
- Intensité :
- Couleur :
- Température :

## Interactions
Cette lumière réagit-elle à des événements ?

## Contraintes
`,
  blueprint: `## Fonctionnement
Que fait ce Blueprint ?

## Variables exposées
| Variable | Type | Description |
|----------|------|-------------|
|          |      |             |

## Dépendances
Quels autres acteurs ou assets sont nécessaires ?

## Notes
`,
}

export default function EditActorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [doc, setDoc] = useState<any>(null)
  const [actorType, setActorType] = useState<string>('actor')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const d = await fetchDoc('actor', params.id)
      if (d) {
        setDoc(d)
        setTitle(d.title)
        setContent(d.content)
      } else {
        setTitle('Documentation acteur')
        setContent(TEMPLATES['actor'] || '')
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave() {
    setSaving(true)
    try {
      if (doc) {
        await updateDoc(doc.id, content)
      } else {
        await createDoc({
          title,
          content,
          template_type: 'actor',
          entity_type: 'actor',
          entity_id: params.id,
        })
      }
      router.back()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Chargement...</div>

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/scenes" className="hover:underline">Scènes</Link>
        <span>/</span>
        <span>Acteur</span>
        <span>/</span>
        <span>Édition</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          {doc ? 'Modifier la documentation' : 'Créer la documentation'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Titre</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la documentation..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Contenu</CardTitle>
            <div className="flex gap-2">
              {Object.keys(TEMPLATES).map((t) => (
                <Badge
                  key={t}
                  variant={actorType === t ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setActorType(t)
                    setContent(TEMPLATES[t] || '')
                  }}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={500}
                preview="live"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}