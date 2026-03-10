'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default function DocsPage() {
  const router = useRouter()
  const [docs, setDocs]       = useState<any[]>([])
  const [tags, setTags]       = useState<string[]>([])
  const [search, setSearch]   = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDocs = async (q = search, tag = activeTag) => {
    const params = new URLSearchParams()
    if (q)   params.append('search', q)
    if (tag) params.append('tag', tag)
    const res = await fetch(`${BASE_URL}/api/project-docs?${params}`)
    const data = await res.json()
    setDocs(data)
    setLoading(false)
  }

  const loadTags = async () => {
    const res = await fetch(`${BASE_URL}/api/project-docs/meta/tags`)
    setTags(await res.json())
  }

  useEffect(() => {
    loadDocs()
    loadTags()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadDocs(search, activeTag), 300)
    return () => clearTimeout(t)
  }, [search, activeTag])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return
    await fetch(`${BASE_URL}/api/project-docs/${id}`, { method: 'DELETE' })
    loadDocs()
    loadTags()
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-1">{docs.length} documents</p>
        </div>
        <Button onClick={() => router.push('/docs/new')}>+ Nouveau document</Button>
      </div>

      {/* Recherche */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Rechercher dans les documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <Badge
            variant={!activeTag ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveTag('')}
          >
            Tous
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="text-muted-foreground">Chargement...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Aucun document trouvé</p>
          <Button variant="outline" onClick={() => router.push('/docs/new')}>
            + Créer le premier document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc: any) => (
            <ContextMenu key={doc.id}>
              <ContextMenuTrigger>
                <Card
                  className="hover:border-primary transition cursor-pointer h-full"
                  onClick={() => router.push(`/docs/${doc.id}`)}
                >
                  {/* Cover */}
                  {doc.cover_url && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={doc.cover_url}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {doc.title}
                      </CardTitle>
                      {doc.file_type && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {doc.file_type.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {doc.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {doc.content.replace(/#+\s/g, '').replace(/\*\*/g, '')}
                      </p>
                    )}

                    {/* Tags */}
                    {doc.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {doc.author_name && <span>{doc.author_name}</span>}
                      <span>{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>

              <ContextMenuContent>
                <ContextMenuItem onClick={() => router.push(`/docs/${doc.id}`)}>
                  👁 Voir
                </ContextMenuItem>
                <ContextMenuItem onClick={() => router.push(`/docs/${doc.id}/edit`)}>
                  ✏️ Modifier
                </ContextMenuItem>
                {doc.file_url && (
                  <ContextMenuItem onClick={() => window.open(doc.file_url, '_blank')}>
                    ⬇️ Télécharger
                  </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => handleDelete(doc.id, doc.title)}
                  className="text-destructive focus:text-destructive"
                >
                  🗑 Supprimer
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
    </main>
  )
}