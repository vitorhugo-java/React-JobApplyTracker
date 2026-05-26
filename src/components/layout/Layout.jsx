import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import ThemeToggle from '../ui/ThemeToggle'
import SyncStatusIndicator from '../ui/SyncStatusIndicator'
import LevelBadge from '../ui/LevelBadge'
import GamificationToastHost from '../ui/GamificationToastHost'
import useAuthStore from '../../store/authStore'
import useGamificationStore from '../../store/gamificationStore'
import { logout as logoutApi } from '../../api/auth'

const SIDEBAR_COLLAPSE_STORAGE_KEY = 'jobtracker-sidebar-collapsed'

const Layout = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logoutStore = useAuthStore((s) => s.logout)
  const profile = useGamificationStore((s) => s.profile)
  const location = useLocation()

  const isGuestAboutPage =
    !accessToken && location.pathname === '/about'

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width:768px)').matches
      : true
  )

  const [isCompactDesktop, setIsCompactDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(
          '(min-width:768px) and (max-width:1023px)'
        ).matches
      : false
  )

  const [isDesktopSidebarCollapsed,
    setIsDesktopSidebarCollapsed] = useState(() => {
      if (typeof window === 'undefined') return false

      return localStorage.getItem(
        SIDEBAR_COLLAPSE_STORAGE_KEY
      ) === 'true'
    })

  const isSidebarCollapsed =
    isDesktop &&
    (isCompactDesktop || isDesktopSidebarCollapsed)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const desktopMedia =
      window.matchMedia('(min-width:768px)')

    const compactMedia =
      window.matchMedia(
        '(min-width:768px) and (max-width:1023px)'
      )

    const desktopHandler = (e) =>
      setIsDesktop(e.matches)

    const compactHandler = (e) =>
      setIsCompactDesktop(e.matches)

    desktopMedia.addEventListener(
      'change',
      desktopHandler
    )

    compactMedia.addEventListener(
      'change',
      compactHandler
    )

    return () => {
      desktopMedia.removeEventListener(
        'change',
        desktopHandler
      )

      compactMedia.removeEventListener(
        'change',
        compactHandler
      )
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_COLLAPSE_STORAGE_KEY,
      String(isDesktopSidebarCollapsed)
    )
  }, [isDesktopSidebarCollapsed])

  const handleLogout = async () => {
    await logoutApi().catch(() => null)

    logoutStore()

    navigate('/login', {
      replace: true,
    })
  }

  if (isGuestAboutPage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <GamificationToastHost />

      {isDesktop && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          showDesktopCollapseToggle={!isCompactDesktop}
          onToggleCollapse={() =>
            setIsDesktopSidebarCollapsed(
              current => !current
            )
          }
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b px-4 sm:px-6 py-3 flex items-center justify-between">

          <div />

          <div className="flex items-center gap-3">
            <LevelBadge
              profile={profile}
              compact
            />

            <SyncStatusIndicator />

            <ThemeToggle />

            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />

              <span>
                {user?.name ||
                  user?.email ||
                  'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5"/>
            </button>

          </div>

        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

      </div>

      {!isDesktop && <MobileNav />}

    </div>
  )
}

export default Layout