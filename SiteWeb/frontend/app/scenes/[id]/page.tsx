/* eslint-disable @typescript-eslint/no-explicit-any */
// app/scenes/[id]/page.tsx
import { fetchScene } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ScenePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scene = await fetchScene(id)

  const lights = scene.actors.filter((a: any) => a.light_type)
  const meshes = scene.actors.filter((a: any) => a.actor_type === 'StaticMeshActor')
  const blueprints = scene.actors.filter((a: any) => a.actor_type === 'Blueprint')
  const others = scene.actors.filter(
    (a: any) => !a.light_type && a.actor_type !== 'StaticMeshActor' && a.actor_type !== 'Blueprint'
  )

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/scenes" className="hover:underline">Scènes</Link>
        <span>/</span>
        <span>{scene.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{scene.name}</h1>
          <p className="text-muted-foreground mt-1">{scene.path}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{scene.actors.length} acteurs</Badge>
          <Badge variant="secondary">{lights.length} lumières</Badge>
        </div>
      </div>

      {/* Screenshot */}
      {scene.screenshot_url && (
        <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden mb-8">
          <img src={scene.screenshot_url} alt={scene.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Static Meshes" value={meshes.length} />
        <StatCard label="Lumières" value={lights.length} />
        <StatCard label="Blueprints" value={blueprints.length} />
        <StatCard
          label="Non documentés"
          value={scene.actors.filter((a: any) => !a.doc_content).length}
          warn
        />
      </div>

      {/* Contenu de la scène */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActorGroup title="Lumières" actors={lights} type="light" />
        <ActorGroup title="Static Meshes" actors={meshes} type="actor" />
        <ActorGroup title="Blueprints" actors={blueprints} type="actor" />
        {others.length > 0 && <ActorGroup title="Autres" actors={others} type="actor" />}
      </div>
    </main>
  )
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <Card className={warn && value > 0 ? 'border-orange-300' : ''}>
      <CardContent className="p-4">
        <p className={`text-3xl font-bold ${warn && value > 0 ? 'text-orange-500' : ''}`}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

function ActorGroup({ title, actors, type }: { title: string; actors: any[]; type: string }) {
  if (actors.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          <Badge variant="secondary">{actors.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-y-auto">
        {actors.map((actor: any) => (
          <div key={actor.id} className="border rounded-md p-3 hover:border-primary transition">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm truncate">{actor.name}</p>
              {actor.doc_content
                ? <Badge variant="outline" className="text-xs text-green-600 border-green-600 shrink-0">Doc</Badge>
                : <Badge variant="destructive" className="text-xs shrink-0">Non doc</Badge>
              }
            </div>

            {type === 'light' && (
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full border shrink-0"
                  style={{ backgroundColor: actor.color || '#ffffff' }}
                />
                <span className="text-xs text-muted-foreground">
                  {actor.light_type} — {actor.intensity} lux
                </span>
              </div>
            )}

            {actor.doc_content && (
              <p className="text-xs text-muted-foreground line-clamp-2">{actor.doc_content}</p>
            )}

            <Link href={actor.doc_content ? `/actors/${actor.id}` : `/actors/${actor.id}/edit`}>
              <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs px-2">
                {actor.doc_content ? 'Voir doc' : 'Ajouter doc'}
              </Button>
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}