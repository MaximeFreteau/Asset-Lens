'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
// app/tasks/page.tsx
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/TaskCard'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

const STATUSES = [
  { key: 'todo',        label: 'À faire',    color: 'bg-slate-100 text-slate-700'     },
  { key: 'in_progress', label: 'En cours',   color: 'bg-blue-100 text-blue-700'       },
  { key: 'review',      label: 'En review',  color: 'bg-yellow-100 text-yellow-700'   },
  { key: 'validated',   label: 'Validé',     color: 'bg-green-100 text-green-700'     },
  { key: 'integrated',  label: 'Intégré',    color: 'bg-purple-100 text-purple-700'   },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])

  const loadTasks = async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`)
    const data = await res.json()
    setTasks(data)
  }

  useEffect(() => { loadTasks() }, [])

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = tasks.filter((t: any) => t.status === s.key)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Production</h1>
          <p className="text-muted-foreground mt-1">{tasks.length} tasks au total</p>
        </div>
        <Link href="/tasks/new">
          <Button>+ Nouvelle task</Button>
        </Link>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto">
        {STATUSES.map((status) => (
          <div key={status.key} className="min-w-[200px]">
            <div className={`rounded-md px-3 py-1.5 text-sm font-medium mb-3 ${status.color}`}>
              {status.label} ({tasksByStatus[status.key]?.length || 0})
            </div>

            <div className="space-y-3">
              {tasksByStatus[status.key]?.map((task: any) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRefresh={loadTasks}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}