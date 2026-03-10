'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

const PRIORITIES: Record<string, { label: string; color: string }> = {
  low:      { label: 'Basse',    color: 'text-slate-400'  },
  normal:   { label: 'Normale',  color: 'text-blue-400'   },
  high:     { label: 'Haute',    color: 'text-orange-400' },
  critical: { label: 'Critique', color: 'text-red-500'    },
}

export function TaskCard({ task, onRefresh }: { task: any; onRefresh: () => void }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Supprimer la task "${task.asset_name}" ?`)) return
    await fetch(`${BASE_URL}/api/tasks/${task.id}`, { method: 'DELETE' })
    onRefresh()
  }

  const handleStatusChange = async (status: string) => {
    await fetch(`${BASE_URL}/api/tasks/${task.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    onRefresh()
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          className="hover:border-primary transition cursor-pointer"
          onClick={() => router.push(`/tasks/${task.id}`)}
        >
          <CardContent className="p-3 space-y-2">
            <p className="font-medium text-sm line-clamp-2">
              {task.asset_name || 'Sans nom'}
            </p>

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {task.asset_type}
              </Badge>
              <span className={`text-xs font-medium ${PRIORITIES[task.priority]?.color}`}>
                {PRIORITIES[task.priority]?.label}
              </span>
            </div>

            {task.assigned_name && (
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-xs">
                    {task.assigned_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.assigned_name}
                </span>
              </div>
            )}

            {task.deadline && (
              <p className="text-xs text-muted-foreground">
                📅 {new Date(task.deadline).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
          👁 Voir
        </ContextMenuItem>
        <ContextMenuItem onClick={() => router.push(`/tasks/${task.id}/edit`)}>
          ✏️ Modifier
        </ContextMenuItem>

        <ContextMenuSeparator />

        {task.status !== 'in_progress' && (
          <ContextMenuItem onClick={() => handleStatusChange('in_progress')}>
            🔵 Marquer En cours
          </ContextMenuItem>
        )}
        {task.status !== 'review' && (
          <ContextMenuItem onClick={() => handleStatusChange('review')}>
            🟡 Envoyer en Review
          </ContextMenuItem>
        )}
        {task.status !== 'validated' && (
          <ContextMenuItem onClick={() => handleStatusChange('validated')}>
            🟢 Valider
          </ContextMenuItem>
        )}
        {task.status !== 'todo' && (
          <ContextMenuItem onClick={() => handleStatusChange('todo')}>
            ⚪ Remettre À faire
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          🗑 Supprimer
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}