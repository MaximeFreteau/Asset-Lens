// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@/components/app-sidebar'
import NotificationBell from '@/components/NotificationBell'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AssetLens',
  description: 'Wiki de production Unreal Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SidebarProvider>
          <AppSidebar />

          <div className="flex flex-col flex-1 min-h-screen overflow-hidden">

            {/* ── Header ── */}
            <header className="flex items-center justify-between h-12 px-4
              border-b bg-background/80 backdrop-blur-md shrink-0">

              <SidebarTrigger />

              {/* Droite : notifs + user */}
              <div className="flex items-center gap-3">
                <NotificationBell userId="ce27523f-deba-4dc5-8db2-e0cffd1604b5" />

                <Separator orientation="vertical" className="h-4" />

                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs">MF</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Maxime</span>
                </div>
              </div>
            </header>

            {/* ── Contenu ── */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>

          </div>

        </SidebarProvider>
      </body>
    </html>
  )
}