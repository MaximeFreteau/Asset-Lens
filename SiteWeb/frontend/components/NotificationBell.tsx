/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!userId) return

    const poll = async () => {
      const res = await fetch(
        `${BASE_URL}/api/notifications?user_id=${userId}&unread_only=true`)
      if (res.ok) setNotifications(await res.json())
    }

    poll()
    const interval = setInterval(poll, 15000) // toutes les 15s
    return () => clearInterval(interval)
  }, [userId])

  const markAllRead = async () => {
    await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    setNotifications([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-muted rounded-md"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white
            text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-background border
          rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-medium text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                Aucune notification
              </p>
            ) : (
              notifications.map((n: any) => (
              <Link
                key={n.id}
                href={n.entity_type === 'task' ? `/tasks/${n.entity_id}` : '/'}
                onClick={async () => {
                  await fetch(`${BASE_URL}/api/notifications/${n.id}/read`, {
                    method: 'PATCH'
                  })
                  setNotifications(prev => prev.filter(x => x.id !== n.id))
                  setOpen(false)
                }}
                className="block p-3 border-b hover:bg-muted/50 cursor-pointer"
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </p>
              </Link>
            )))}
          </div>
        </div>
      )}
    </div>
  )
}