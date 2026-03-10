/* eslint-disable @typescript-eslint/no-explicit-any */
// app/assets/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { fetchAsset, fetchDoc, createDoc, updateDoc } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const TEMPLATES: Record<string, string> = {
  asset: `## Description
Décris l'asset ici.

## Utilisation
Dans quels contextes cet asset est-il utilisé ?

## Textures associées
- Texture 1
- Texture 2

## Contraintes techniques
- Poly count max :
- Taille de texture :

## Notes
`,
  light: `## Intention artistique
Quel sentiment cette lumière doit-elle créer ?

## Paramètres clés
- Intensité :
- Couleur :
- Température :

## Interactions
Cette lumière réagit-elle à des événements ?

## Contraintes
`,
}

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [assetId, setAssetId] = useState('')
  const [asset, setAsset] = useState<any>(null)
  const [doc, setDoc] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(({ id }) => setAssetId(id))
  }, [params])

  useEffect(() => {
    if (!assetId) return

    async function load() {
      const [a, d] = await Promise.all([
        fetchAsset(assetId),
        fetchDoc('asset', assetId)
      ])
      setAsset(a)
      if (d) {
        setDoc(d)
        setTitle(d.title)
        setContent(d.content)
      } else {
        setTitle(a.name)
        setContent(TEMPLATES['asset'] || '')
      }
    }
    load()
  }, [assetId])

  async function handleSave() {
    setSaving(true)
    try {
      if (doc) {
        await updateDoc(doc.id, content)
      } else {
        await createDoc({
          title,
          content,
          template_type: 'asset',
          entity_type: 'asset',
          entity_id: assetId,
        })
      }
      router.push(`/assets/${assetId}`)
    } finally {
      setSaving(false)
    }
  }

  if (!asset) return <div className="p-8 text-muted-foreground">Chargement...</div>

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/assets" className="hover:underline">Assets</Link>
        <span>/</span>
        <Link href={`/assets/${assetId}`} className="hover:underline">{asset.name}</Link>
        <span>/</span>
        <span>Édition</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          <p className="text-muted-foreground mt-1">{asset.path}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/assets/${assetId}`}>
            <Button variant="outline">Annuler</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Titre de la documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre..."
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
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setContent(TEMPLATES[t] || '')}
                >
                  Template {t}
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