import React from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from './navigationItems'

const MobileNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
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
