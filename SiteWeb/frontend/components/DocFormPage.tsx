'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

const CATEGORIES = [
  'GDD',
  'Bible graphique',
  'Guidelines techniques',
  'Concept Art',
  'Audio',
  'Narrative',
  'Pipeline',
  'Référence',
  'Autre',
]

const DEFAULT_TEMPLATE = `## Résumé

## Contenu principal

## Références

## Notes
`

export default function DocFormPage({
  params,
  mode,
}: {
  params: Promise<{ id?: string }>
  mode: 'new' | 'edit'
}) {
  const router = useRouter()
  const [docId, setDocId]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    title:     '',
    content:   DEFAULT_TEMPLATE,
    category:  '',
    tags:      [] as string[],
    file_url:  '',
    file_type: '',
    cover_url: '',
    author_id: 'ce27523f-deba-4dc5-8db2-e0cffd1604b5', // TODO: auth
  })

  useEffect(() => {
    params.then(({ id }) => {
      if (id) setDocId(id)
    })
  }, [params])

  useEffect(() => {
    if (mode !== 'edit' || !docId) return

    fetch(`${BASE_URL}/api/project-docs/${docId}`)
      .then(r => r.json())
      .then(doc => {
        setForm({
          title:     doc.title     || '',
          content:   doc.content   || DEFAULT_TEMPLATE,
          category:  doc.category  || '',
          tags:      doc.tags      || [],
          file_url:  doc.file_url  || '',
          file_type: doc.file_type || '',
          cover_url: doc.cover_url || '',
          author_id: doc.author_id || 'ce27523f-deba-4dc5-8db2-e0cffd1604b5',
        })
      })
  }, [docId, mode])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res  = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()

    setForm(prev => ({
    ...prev,
    file_url:  data.url,
    file_type: data.type,
    // Pré-remplit le contenu avec le texte extrait si vide
    content: prev.content === DEFAULT_TEMPLATE && data.extracted_text
        ? data.extracted_text
        : prev.content,
    }))
    setUploading(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res  = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()

    setForm(prev => ({ ...prev, cover_url: data.url }))
    setUploading(false)
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    setForm({ ...form, tags: [...form.tags, t] })
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
  }

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)

    const url    = mode === 'edit'
      ? `${BASE_URL}/api/project-docs/${docId}`
      : `${BASE_URL}/api/project-docs`
    const method = mode === 'edit' ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const doc = await res.json()
    setSaving(false)
    router.push(`/docs/${doc.id}`)
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {mode === 'new' ? 'Nouveau document' : 'Modifier le document'}
        </h1>
        <Button variant="ghost" onClick={() => router.back()}>← Retour</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Éditeur principal */}
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">

              <div className="space-y-1.5">
                <Label>Titre <span className="text-red-500">*</span></Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Nom du document..."
                  className="text-lg font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Contenu (Markdown)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={24}
                  className="font-mono text-sm resize-none"
                  placeholder="Contenu en Markdown..."
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar métadonnées */}
        <div className="space-y-4">

          {/* Catégorie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ajouter un tag..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" size="sm" onClick={addTag}>+</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {form.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground gap-1"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fichier lié */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Fichier lié</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Importer un fichier</Label>
                <Input
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="text-sm cursor-pointer"
                />
                {uploading && (
                  <p className="text-xs text-muted-foreground">Upload en cours...</p>
                )}
                {form.file_url && !uploading && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{form.file_type?.toUpperCase()}</Badge>
                    <span className="text-xs text-green-600">Fichier uploadé ✓</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cover */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Image de couverture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleCoverUpload}
                disabled={uploading}
                className="text-sm cursor-pointer"
              />
              {form.cover_url && (
                <div className="aspect-video bg-muted rounded overflow-hidden">
                  <img
                    src={form.cover_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || uploading || !form.title}
            >
              {saving ? 'Sauvegarde...' : mode === 'new' ? 'Créer le document' : 'Sauvegarder'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
          </div>

        </div>
      </div>
    </main>
  )
}