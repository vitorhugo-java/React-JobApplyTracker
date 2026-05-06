import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu, User } from 'lucide-react'
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
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logoutStore = useAuthStore((s) => s.logout)
  const profile = useGamificationStore((s) => s.profile)
  const location = useLocation()
  const isGuestAboutPage = !accessToken && location.pathname === '/about'
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  )
  const [isCompactDesktop, setIsCompactDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches : false,
  )
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === 'true'
  })

  const isSidebarCollapsed = isDesktop && (isCompactDesktop || isDesktopSidebarCollapsed)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const desktopMedia = window.matchMedia('(min-width: 768px)')
    const compactDesktopMedia = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')

    const handleDesktopChange = (event) => {
      setIsDesktop(event.matches)
      if (event.matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    const handleCompactDesktopChange = (event) => {
      setIsCompactDesktop(event.matches)
    }

    desktopMedia.addEventListener('change', handleDesktopChange)
    compactDesktopMedia.addEventListener('change', handleCompactDesktopChange)

    return () => {
      desktopMedia.removeEventListener('change', handleDesktopChange)
      compactDesktopMedia.removeEventListener('change', handleCompactDesktopChange)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(isDesktopSidebarCollapsed))
  }, [isDesktopSidebarCollapsed])

  const handleLogout = async () => {
    await logoutApi().catch(() => null)
    logoutStore()
    window.location.href = '/login'
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
      {!isDesktop && isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        showDesktopCollapseToggle={!isCompactDesktop}
        onClose={() => setIsMobileSidebarOpen(false)}
        onToggleCollapse={() => setIsDesktopSidebarCollapsed((current) => !current)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">JT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LevelBadge profile={profile} compact />
            <SyncStatusIndicator />
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{user?.name || user?.email || 'User'}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-0 bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
