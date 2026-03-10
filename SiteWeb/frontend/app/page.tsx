// frontend/app/page.tsx — Dashboard home
import Link from 'next/link'
import { fetchAssets, fetchScenes } from '@/lib/api'

export default async function Home() {
  const [assets, scenes] = await Promise.all([fetchAssets(), fetchScenes()])

  const undocumented = assets.filter((a: any) => !a.doc_id).length

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-2">AssetLens</h1>
      <p className="text-gray-500 mb-8">Wiki de production intégré</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Assets" value={assets.length} href="/assets" />
        <StatCard label="Scènes" value={scenes.length} href="/scenes" />
        <StatCard label="Non documentés" value={undocumented} href="/assets?filter=undocumented" warn />
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Assets récents</h2>
        <div className="grid grid-cols-4 gap-4">
          {assets.slice(0, 8).map((asset: any) => (
            <Link key={asset.id} href={`/assets/${asset.id}`}
              className="border rounded-lg p-4 hover:border-blue-500 transition">
              <p className="font-medium truncate">{asset.name}</p>
              <p className="text-xs text-gray-400">{asset.asset_type}</p>
              {!asset.doc_id && (
                <span className="text-xs text-orange-400 mt-1 block">Non documenté</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Scènes</h2>
        <div className="grid grid-cols-3 gap-4">
          {scenes.map((scene: any) => (
            <Link key={scene.id} href={`/scenes/${scene.id}`}
              className="border rounded-lg p-4 hover:border-blue-500 transition">
              <p className="font-medium">{scene.name}</p>
              <p className="text-xs text-gray-400">{scene.actor_count} acteurs</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, href, warn }: any) {
  return (
    <Link href={href} className={`rounded-lg p-6 border ${warn ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} hover:shadow-md transition`}>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-gray-500 mt-1">{label}</p>
    </Link>
  )
}