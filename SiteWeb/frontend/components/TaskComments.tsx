// components/TaskComments.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addTaskComment } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'

export default function TaskComments({ taskId, comments }: { taskId: string; comments: any[] }) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!content.trim()) return
    setSending(true)
    // Pour l'instant on envoie sans auth, on mettra un user picker plus tard
    await addTaskComment(taskId, { content, author_id: '' })
    setContent('')
    router.refresh()
    setSending(false)
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Commentaires ({comments?.length || 0})</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {comments?.map((c: any) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="text-xs">
                {c.author_name?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{c.author_name || 'Anonyme'}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{c.content}</p>
            </div>
          </div>
        ))}

        <div className="pt-2 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={3}
          />
          <Button size="sm" onClick={handleSubmit} disabled={sending || !content.trim()}>
            {sending ? 'Envoi...' : 'Commenter'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}