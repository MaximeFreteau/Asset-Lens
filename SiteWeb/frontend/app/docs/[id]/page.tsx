'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default function DocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [docId, setDocId]   = useState('')
  const [doc, setDoc]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setDocId(id))
  }, [params])

  useEffect(() => {
    if (!docId) return
    fetch(`${BASE_URL}/api/project-docs/${docId}`)
      .then(r => r.json())
      .then(data => { setDoc(data); setLoading(false) })
  }, [docId])

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${doc.title}" ?`)) return
    await fetch(`${BASE_URL}/api/project-docs/${docId}`, { method: 'DELETE' })
    router.push('/docs')
  }

  if (loading) return <div className="p-8 text-muted-foreground">Chargement...</div>
  if (!doc)    return <div className="p-8 text-muted-foreground">Document introuvable.</div>

  return (
    <main className="p-8 max-w-4xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/docs" className="hover:underline">Documentation</Link>
        <span>/</span>
        <span className="truncate">{doc.title}</span>
      </div>

      {/* Cover */}
      {doc.cover_url && (
        <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden mb-8">
          <img src={doc.cover_url} alt={doc.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{doc.title}</h1>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {doc.category && (
              <Badge variant="secondary">{doc.category}</Badge>
            )}
            {doc.file_type && (
              <Badge variant="outline">{doc.file_type.toUpperCase()}</Badge>
            )}
            {doc.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {doc.author_name && <span>Par {doc.author_name}</span>}
            <span>Mis à jour le {new Date(doc.updated_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          {doc.file_url && (
            <Button variant="outline" onClick={() => window.open(doc.file_url, '_blank')}>
              ⬇️ Télécharger
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push(`/docs/${docId}/edit`)}>
            ✏️ Modifier
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Contenu */}
      {doc.content ? (
        <Card>
          <CardContent className="p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {doc.content}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-muted-foreground text-sm">Aucun contenu.</p>
            <Button variant="outline" size="sm" onClick={() => router.push(`/docs/${docId}/edit`)}>
              + Ajouter du contenu
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Footer actions */}
      <div className="flex justify-end mt-8">
        <Button
          variant="ghost"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          🗑 Supprimer ce document
        </Button>
      </div>

    </main>
  )
}