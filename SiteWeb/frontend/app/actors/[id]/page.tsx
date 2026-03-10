'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default function ActorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [actorId, setActorId] = useState('')
  const [actor, setActor]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => setActorId(id))
  }, [params])

  useEffect(() => {
    if (!actorId) return

    fetch(`${BASE_URL}/api/actors/${actorId}`)
      .then(r => r.json())
      .then(data => {
        setActor(data)
        setLoading(false)
      })
  }, [actorId])

  if (loading) return (
    <div className="p-8 text-muted-foreground">Chargement...</div>
  )

  if (!actor) return (
    <div className="p-8 text-muted-foreground">Acteur introuvable.</div>
  )

  return (
    <main className="p-8 max-w-3xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/scenes" className="hover:underline">Scènes</Link>
        <span>/</span>
        <span className="hover:underline cursor-pointer" onClick={() => router.back()}>
          Scène
        </span>
        <span>/</span>
        <span>{actor.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{actor.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {actor.actor_type && (
              <Badge variant="secondary">{actor.actor_type}</Badge>
            )}
            {actor.light_type && (
              <Badge variant="outline">{actor.light_type}</Badge>
            )}
            {actor.doc_id
              ? <Badge variant="outline" className="text-green-600 border-green-600">Documenté</Badge>
              : <Badge variant="destructive">Non documenté</Badge>
            }
          </div>
        </div>
        <Link href={`/actors/${actorId}/edit`}>
          <Button variant="outline">
            {actor.doc_id ? '✏️ Modifier doc' : '+ Créer doc'}
          </Button>
        </Link>
      </div>

      {/* Infos lumière */}
      {actor.light_type && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Propriétés lumière</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full border-2 shrink-0"
                style={{ backgroundColor: actor.color || '#ffffff' }}
              />
              <span className="text-sm text-muted-foreground">{actor.color || '#ffffff'}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {actor.intensity} lux
            </span>
            <span className="text-sm text-muted-foreground">
              {actor.light_type}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Doc */}
      {actor.doc_content ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {actor.doc_title || 'Documentation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
              {actor.doc_content}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-muted-foreground text-sm">
              Aucune documentation pour cet acteur.
            </p>
            <Link href={`/actors/${actorId}/edit`}>
              <Button variant="outline" size="sm">+ Créer la doc</Button>
            </Link>
          </CardContent>
        </Card>
      )}

    </main>
  )
}