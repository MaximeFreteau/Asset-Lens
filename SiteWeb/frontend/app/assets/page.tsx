/* eslint-disable @typescript-eslint/no-explicit-any */
// app/assets/page.tsx
import { fetchAssets } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AssetCard } from '@/components/AssetCard'
import Link from 'next/link'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; filter?: string }>
}) {
  const { search, type, filter } = await searchParams

  const assets = await fetchAssets({ search, type })

  const filtered = filter === 'undocumented'
    ? assets.filter((a: any) => !a.doc_id)
    : assets

  const types = [...new Set(assets.map((a: any) => a.asset_type))] as string[]

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} assets trouvés</p>
        </div>
        <Link href="/assets/new">
          <Button>+ Nouvel asset</Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6">
        <form className="flex-1">
          <Input
            name="search"
            placeholder="Rechercher un asset..."
            defaultValue={search}
          />
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/assets">
            <Badge variant={!type ? 'default' : 'outline'} className="cursor-pointer">
              Tous
            </Badge>
          </Link>
          {types.map((t) => (
            <Link key={t} href={`/assets?type=${t}`}>
              <Badge
                variant={type === t ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {t}
              </Badge>
            </Link>
          ))}
          <Link href="/assets?filter=undocumented">
            <Badge
              variant={filter === 'undocumented' ? 'destructive' : 'outline'}
              className="cursor-pointer"
            >
              Non documentés
            </Badge>
          </Link>
        </div>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((asset: any) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Aucun asset trouvé
        </div>
      )}
    </main>
  )
}