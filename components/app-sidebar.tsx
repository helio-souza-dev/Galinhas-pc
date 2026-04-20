'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/relatorios', label: 'Relatorios', icon: BarChart3 },
]

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Componente interno para a caixinha de notificação não precisar ser repetida no código
  const NotificacoesCaixa = () => (
    <PopoverContent className="w-80 mt-2" align="end" sideOffset={8}>
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Notificações</h4>
          <p className="text-sm text-muted-foreground">
            Avisos de novos pedidos e entregas aparecerão aqui.
          </p>
        </div>
        <div className="grid gap-2 border-t pt-4">
          <div className="text-sm text-muted-foreground text-center py-2">
            Nenhuma notificação nova.
          </div>
        </div>
      </div>
    </PopoverContent>
  )

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Egg className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">Granja Gestao</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Ícone de Notificação Mobile COM Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </Button>
            </PopoverTrigger>
            <NotificacoesCaixa />
          </Popover>

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

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-0'
        )}
      >
        {/* Logo Desktop COM o sininho do lado */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 md:h-16">
          <div className="flex items-center gap-2">
            <Egg className="h-7 w-7 text-sidebar-primary" />
            <span className="text-lg font-semibold">Granja Gestao</span>
          </div>
          
          {/* Ícone de Notificação Desktop COM Popover (some no mobile) */}
          <div className="hidden md:block">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                </Button>
              </PopoverTrigger>
              <NotificacoesCaixa />
            </Popover>
          </div>
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