'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export function AssetCard({ asset }: { asset: any }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${asset.name}" ?`)) return
    await fetch(`${BASE_URL}/api/assets/${asset.id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          className="hover:border-primary transition cursor-pointer h-full"
          onClick={() => router.push(`/assets/${asset.id}`)}
        >
          {/* Thumbnail */}
          <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
            {asset.thumbnail_url
              ? <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
              : <span className="text-muted-foreground text-xs">No preview</span>
            }
          </div>

          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium truncate">{asset.name}</CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {asset.asset_type || 'Unknown'}
              </Badge>
              {!asset.doc_id
                ? <Badge variant="destructive" className="text-xs">Non documenté</Badge>
                : <Badge variant="outline" className="text-xs text-green-600 border-green-600">Documenté</Badge>
              }
            </div>
            {asset.doc_content && (
              <p className="text-xs text-muted-foreground line-clamp-2">{asset.doc_content}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">{asset.path}</p>
          </CardContent>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => router.push(`/assets/${asset.id}`)}>
          👁 Voir
        </ContextMenuItem>
        <ContextMenuItem onClick={() => router.push(`/assets/${asset.id}/edit`)}>
          ✏️ Modifier
        </ContextMenuItem>
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