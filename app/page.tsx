'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getClientes,
  getProdutos,
  getVendas,
  seedInitialData,
  formatCurrency,
  formatDate,
} from '@/lib/storage'
import { Cliente, Produto, Venda } from '@/lib/types'
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedInitialData()
    setClientes(getClientes())
    setProdutos(getProdutos())
    setVendas(getVendas())
    setLoading(false)
  }, [])

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const vendasHoje = vendas.filter((v) => {
    const dataVenda = new Date(v.createdAt)
    dataVenda.setHours(0, 0, 0, 0)
    return dataVenda.getTime() === hoje.getTime()
  })

  const totalVendasHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0)

  const vendasPendentes = vendas.filter(
    (v) => v.status === 'pendente' || v.status === 'parcial'
  )
  const totalPendente = vendasPendentes.reduce(
    (acc, v) => acc + (v.total - v.valorPago),
    0
  )

  const produtosBaixoEstoque = produtos.filter((p) => p.estoque <= 5)

  const ultimasVendas = [...vendas]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppSidebar>
    )
  }

  return (
    <AppSidebar>
      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Link href="/vendas/nova">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Venda
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Hoje
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalVendasHoje)}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendasHoje.length} venda(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendasPendentes.length} venda(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {clientes.length}
              </div>
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {produtos.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {produtosBaixoEstoque.length} com estoque baixo
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ultimas Vendas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Ultimas Vendas
              </CardTitle>
              <Link href="/vendas">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ultimasVendas.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhuma venda registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {ultimasVendas.map((venda) => (
                    <div
                      key={venda.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {venda.clienteNome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(venda.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(venda.total)}
                        </p>
                        <span
                          className={`text-xs ${
                            venda.status === 'pago'
                              ? 'text-primary'
                              : venda.status === 'parcial'
                              ? 'text-accent-foreground'
                              : 'text-destructive'
                          }`}
                        >
                          {venda.status === 'pago'
                            ? 'Pago'
                            : venda.status === 'parcial'
                            ? 'Parcial'
                            : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estoque Baixo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent" />
                Estoque Baixo
              </CardTitle>
              <Link href="/produtos">
                <Button variant="ghost" size="sm">
                  Ver produtos
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {produtosBaixoEstoque.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Todos os produtos com estoque OK
                </p>
              ) : (
                <div className="space-y-3">
                  {produtosBaixoEstoque.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(produto.preco)} / {produto.unidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">
                          {produto.estoque}
                        </p>
                        <p className="text-xs text-muted-foreground">em estoque</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Acoes Rapidas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/vendas/nova">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <span>Nova Venda</span>
              </Button>
            </Link>
            <Link href="/clientes/novo">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Users className="h-6 w-6 text-primary" />
                <span>Novo Cliente</span>
              </Button>
            </Link>
            <Link href="/produtos/novo">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <Package className="h-6 w-6 text-primary" />
                <span>Novo Produto</span>
              </Button>
            </Link>
            <Link href="/relatorios">
              <Button variant="outline" className="h-auto w-full flex-col gap-2 py-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span>Relatorios</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
