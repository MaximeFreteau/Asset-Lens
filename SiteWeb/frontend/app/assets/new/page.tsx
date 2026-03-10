// app/assets/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createDoc, syncAsset } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const TEMPLATE = `## Description
Décris l'asset ici.

## Utilisation
Dans quels contextes cet asset est-il utilisé ?

## Textures associées
- Texture 1

## Contraintes techniques
- Poly count max :
- Taille de texture :

## Notes
`

export default function NewAssetPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [assetType, setAssetType] = useState('StaticMesh')
  const [content, setContent] = useState(TEMPLATE)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name || !path) return
    setSaving(true)
    try {
      const asset = await syncAsset({ name, path, asset_type: assetType, metadata: {} })
      await createDoc({
        title: name,
        content,
        template_type: 'asset',
        entity_type: 'asset',
        entity_id: asset.id,
      })
      router.push(`/assets/${asset.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/assets" className="hover:underline">Assets</Link>
        <span>/</span>
        <span>Nouvel asset</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Nouvel asset</h1>
        <div className="flex gap-2">
          <Link href="/assets"><Button variant="outline">Annuler</Button></Link>
          <Button onClick={handleSave} disabled={saving || !name || !path}>
            {saving ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SM_Rock" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Chemin Unreal</label>
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/Game/Meshes/SM_Rock" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {['StaticMesh', 'Texture2D', 'Blueprint', 'Material', 'SkeletalMesh', 'Other'].map((t) => (
                  <Badge
                    key={t}
                    variant={assetType === t ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setAssetType(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Documentation</CardTitle></CardHeader>
          <CardContent>
            <div data-color-mode="light">
              <MDEditor value={content} onChange={(val) => setContent(val || '')} height={400} preview="live" />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}