// components/TaskStatusUpdater.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateTaskStatus } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUSES = [
  { key: 'todo', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'review', label: 'En review' },
  { key: 'validated', label: 'Validé' },
  { key: 'integrated', label: 'Intégré' },
]

export default function TaskStatusUpdater({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(status: string) {
    setLoading(true)
    await updateTaskStatus(taskId, status)
    router.refresh()
    setLoading(false)
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}