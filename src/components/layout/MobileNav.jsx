import React from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from './navigationItems'

const MobileNav = () => {
  const mobileColumns = navigationItems.length || 1

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid px-1" style={{ gridTemplateColumns: `repeat(${mobileColumns}, minmax(0, 1fr))` }}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-12 flex-col items-center justify-center px-0.5 py-1.5 text-[10px] leading-tight font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {React.createElement(item.icon, { className: 'w-4 h-4 mb-0.5 shrink-0' })}
            <span className="truncate w-full text-center" title={item.label}>{item.mobileLabel || item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
