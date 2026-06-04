import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useGamificationStore } from '@/store/gamificationStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { breadcrumbFor } from './navigation'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const { root, leaf } = breadcrumbFor(pathname)

  const loadGamification = useGamificationStore((s) => s.load)
  const loaded = useGamificationStore((s) => s.loaded)

  useEffect(() => {
    if (!loaded) loadGamification()
  }, [loaded, loadGamification])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar root={root} leaf={leaf} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
