// app/scenes/page.tsx
import { fetchScenes } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function ScenesPage() {
  const scenes = await fetchScenes()

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Scènes</h1>
          <p className="text-muted-foreground mt-1">{scenes.length} scènes trouvées</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {scenes.map((scene: any) => (
          <Link key={scene.id} href={`/scenes/${scene.id}`}>
            <Card className="hover:border-primary transition cursor-pointer h-full">
              {/* Screenshot */}
              <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                {scene.screenshot_url
                  ? <img src={scene.screenshot_url} alt={scene.name} className="w-full h-full object-cover" />
                  : <span className="text-muted-foreground text-xs">No screenshot</span>
                }
              </div>

              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-medium truncate">{scene.name}</CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {scene.actor_count} acteurs
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{scene.path}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {scenes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Aucune scène trouvée. Utilisez le plugin Unreal pour synchroniser vos scènes.
        </div>
      )}
    </main>
  )
}