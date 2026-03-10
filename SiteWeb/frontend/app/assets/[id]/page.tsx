// app/assets/[id]/page.tsx
import { fetchAsset, fetchDoc } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MarkdownContent from '@/components/MarkdownContent'
import Link from 'next/link'

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = await fetchAsset(id)
  const doc = await fetchDoc('asset', id)

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/assets" className="hover:underline">Assets</Link>
        <span>/</span>
        <span>{asset.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          <p className="text-muted-foreground mt-1">{asset.path}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{asset.asset_type}</Badge>
          {!doc
            ? <Badge variant="destructive">Non documenté</Badge>
            : <Badge variant="outline" className="text-green-600 border-green-600">Documenté</Badge>
          }
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
              {asset.thumbnail_url
                ? <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
                : <span className="text-muted-foreground text-sm">No preview</span>
              }
            </div>
            <CardContent className="p-4 space-y-2">
              {asset.metadata && Object.entries(asset.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documentation</CardTitle>
              <Link href={`/assets/${id}/edit`}>
                <Button variant="outline" size="sm">
                  {doc ? 'Modifier' : 'Créer la doc'}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {doc
                ? <MarkdownContent source={doc.content} />
                : <p className="text-muted-foreground text-sm">
                    Aucune documentation pour cet asset. Cliquez sur Créer la doc pour commencer.
                  </p>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}