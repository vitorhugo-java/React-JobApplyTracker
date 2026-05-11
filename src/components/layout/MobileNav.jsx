import React from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from './navigationItems'

const MobileNav = () => {
  const mobileColumns = Math.min(3, navigationItems.length || 1)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid gap-1 px-1" style={{ gridTemplateColumns: `repeat(${mobileColumns}, minmax(0, 1fr))` }}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center px-1 py-2 text-xs leading-tight font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {React.createElement(item.icon, { className: 'w-5 h-5 mb-1' })}
            {item.mobileLabel || item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
