import { BarChart3, Bell, Briefcase, CircleUserRound, Code2, LayoutDashboard, Settings } from 'lucide-react'

export const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/metrics', label: 'Métricas', icon: BarChart3 },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/account', label: 'Account', mobileLabel: 'Conta', icon: Settings },
  { to: '/developer', label: 'Developer', icon: Code2 },
  { to: '/about', label: 'Sobre', icon: CircleUserRound },
]
