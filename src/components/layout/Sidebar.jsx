import React from 'react'
import { NavLink } from 'react-router-dom'
import { Briefcase, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { navigationItems } from './navigationItems'

const Sidebar = ({
  isCollapsed = false,
  isMobileOpen = false,
  showDesktopCollapseToggle = true,
  onClose,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white shadow-xl transition-[width,transform] duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 md:static md:shadow-none ${
        isCollapsed ? 'w-20' : 'w-72 md:w-64'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div
        className={`flex items-center border-b border-gray-200 px-4 py-5 dark:border-gray-700 ${
          isCollapsed ? 'justify-center md:px-3' : 'gap-3 md:px-6'
        }`}
      >
        <div className="w-8 h-8 shrink-0 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        {!isCollapsed && <span className="font-bold text-gray-900 dark:text-white text-lg">JobTracker</span>}
        <div className={`ml-auto flex items-center gap-2 ${isCollapsed ? 'hidden md:flex' : ''}`}>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
          {showDesktopCollapseToggle && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-gray-400 dark:hover:text-white"
              aria-label={isCollapsed ? 'Expand navigation menu' : 'Collapse navigation menu'}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`
            }
          >
            {React.createElement(item.icon, { className: 'w-5 h-5' })}
            {!isCollapsed && item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
