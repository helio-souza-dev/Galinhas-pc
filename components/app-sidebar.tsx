'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  Egg,
  Bell,
  Calendar
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar }, // <-- ADICIONADO AQUI
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/relatorios', label: 'Relatorios', icon: BarChart3 },
]

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
  <div className="flex items-center gap-2">
    <Egg className="h-6 w-6 text-primary" />
    <span className="font-semibold text-foreground">Granja Gestao</span>
  </div>
  
  <div className="flex gap-1">
    {/* Ícone de Notificação Mobile */}
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
    </Button>

    <Button
      variant="ghost"
      size="icon"
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  </div>
</header>

      {/* Mobile Navigation Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-0'
        )}
      >
        {/* Logo Desktop */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:h-16">
          <div className="flex items-center gap-2">
            <Egg className="h-7 w-7 text-sidebar-primary" />
            <span className="text-lg font-semibold">Granja Gestao</span>
          </div>
          
          {/* Ícone de Notificação Desktop oculto no mobile */}
          <Button variant="ghost" size="icon" className="relative hidden md:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0">
        <div className="min-h-screen bg-background">{children}</div>
      </main>
    </div>
  )
}
