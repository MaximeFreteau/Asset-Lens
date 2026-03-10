/* eslint-disable @typescript-eslint/no-explicit-any */
// app/tasks/[id]/page.tsx
import { fetchTask, fetchUsers } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import TaskStatusUpdater from '@/components/TaskStatusUpdater'
import TaskComments from '@/components/TaskComments'

const PRIORITIES = {
  low: { label: 'Basse', color: 'bg-slate-100 text-slate-700' },
  normal: { label: 'Normale', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-700' },
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const task = await fetchTask(id)

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/tasks" className="hover:underline">Production</Link>
        <span>/</span>
        <span>{task.asset_name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{task.asset_name}</h1>
          <p className="text-muted-foreground mt-1">{task.asset_path}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge className={PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color}>
            {PRIORITIES[task.priority as keyof typeof PRIORITIES]?.label}
          </Badge>
          <Link href={`/tasks/${task.id}/edit`}>
            <Button variant="outline" size="sm">Modifier</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="col-span-2 space-y-6">

          {/* Brief */}
          <Card>
            <CardHeader><CardTitle className="text-base">Brief</CardTitle></CardHeader>
            <CardContent>
              {task.brief
                ? <p className="text-sm whitespace-pre-wrap">{task.brief}</p>
                : <p className="text-sm text-muted-foreground">Aucun brief renseigné.</p>
              }
            </CardContent>
          </Card>

          {/* Specs techniques */}
          <Card>
            <CardHeader><CardTitle className="text-base">Spécifications techniques</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Poly count cible</p>
                  <p className="text-sm font-medium">{task.target_polycount ? `${task.target_polycount.toLocaleString()} tris` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Taille de texture</p>
                  <p className="text-sm font-medium">{task.target_texture_size || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dossier destination</p>
                  <p className="text-sm font-medium font-mono">{task.destination_path || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Material</p>
                  <p className="text-sm font-medium font-mono">{task.material_path || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Références */}
          {task.references?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Références</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {task.references.map((ref: any) => (
                    <div key={ref.id} className="border rounded-md overflow-hidden">
                      {ref.image_url && (
                        <img src={ref.image_url} alt={ref.note} className="w-full aspect-video object-cover" />
                      )}
                      {ref.note && <p className="text-xs p-2 text-muted-foreground">{ref.note}</p>}
                      {ref.url && (
                        <a href={ref.url} target="_blank" className="text-xs p-2 text-blue-500 hover:underline block">
                          Voir le lien →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Commentaires */}
          <TaskComments taskId={task.id} comments={task.comments} />
        </div>

        {/* Sidebar droite */}
        <div className="space-y-4">
          {/* Statut */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Statut</CardTitle></CardHeader>
            <CardContent>
              <TaskStatusUpdater taskId={task.id} currentStatus={task.status} />
            </CardContent>
          </Card>

          {/* Assigné à */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Assigné à</CardTitle></CardHeader>
            <CardContent>
              {task.assigned_name
                ? <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{task.assigned_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{task.assigned_name}</p>
                      <p className="text-xs text-muted-foreground">{task.assigned_role}</p>
                    </div>
                  </div>
                : <p className="text-sm text-muted-foreground">Non assigné</p>
              }
            </CardContent>
          </Card>

          {/* Deadline */}
          {task.deadline && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Deadline</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {new Date(task.deadline).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Lien vers l'asset */}
          {task.asset_id && (
            <Link href={`/assets/${task.asset_id}`}>
              <Button variant="outline" className="w-full">Voir l&apos;asset →</Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}