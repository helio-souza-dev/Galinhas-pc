'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getVendas,
  getClientes,
  getMovimentacoes,
  formatCurrency,
  formatDate,
} from '@/lib/storage'
import { Venda, Cliente, MovimentacaoEstoque } from '@/lib/types'
import {
  TrendingUp,
  Users,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function RelatoriosPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'ano'>('mes')

  const loadData = useCallback(async () => {
    try {
      const [vendasData, clientesData, movimentacoesData] = await Promise.all([
        getVendas(),
        getClientes(),
        getMovimentacoes(),
      ])
      setVendas(vendasData)
      setClientes(clientesData)
      setMovimentacoes(movimentacoesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSync = async () => {
    setSyncing(true)
    await loadData()
  }

  const filtrarPorPeriodo = (dataString: string) => {
    const data = new Date(dataString)
    const hoje = new Date()
    
    if (periodo === 'semana') {
      const umaSemanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
      return data >= umaSemanaAtras
    } else if (periodo === 'mes') {
      const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate())
      return data >= umMesAtras
    } else {
      const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate())
      return data >= umAnoAtras
    }
  }

  const vendasFiltradas = vendas.filter((v) => filtrarPorPeriodo(v.createdAt))
  const movimentacoesFiltradas = movimentacoes.filter((m) =>
    filtrarPorPeriodo(m.createdAt)
  )

  // Calculos
  const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.total, 0)
  const totalRecebido = vendasFiltradas.reduce((acc, v) => acc + v.valorPago, 0)
  const totalPendente = totalVendas - totalRecebido
  const ticketMedio = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0

  // Vendas por dia (ultimos 7 dias)
  const vendasPorDia = () => {
    const dias: Record<string, number> = {}
    const hoje = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(hoje.getDate() - i)
      const key = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
      dias[key] = 0
    }

    vendas.forEach((v) => {
      const dataVenda = new Date(v.createdAt)
      const diffDays = Math.floor(
        (hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays <= 6) {
        const key = dataVenda.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
        })
        if (dias[key] !== undefined) {
          dias[key] += v.total
        }
      }
    })

    return Object.entries(dias).map(([dia, valor]) => ({ dia, valor }))
  }

  // Formas de pagamento
  const formasPagamento = () => {
    const formas: Record<string, number> = {
      pix: 0,
      dinheiro: 0,
      cartao: 0,
      fiado: 0,
    }

    vendasFiltradas.forEach((v) => {
      formas[v.formaPagamento] += v.total
    })

    return Object.entries(formas)
      .filter(([, valor]) => valor > 0)
      .map(([forma, valor]) => ({
        name: forma.charAt(0).toUpperCase() + forma.slice(1),
        value: valor,
      }))
  }

  // Clientes mais frequentes
  const clientesFrequentes = () => {
    const contagem: Record<string, { nome: string; total: number; quantidade: number }> =
      {}

    vendasFiltradas.forEach((v) => {
      if (!contagem[v.clienteId]) {
        contagem[v.clienteId] = { nome: v.clienteNome, total: 0, quantidade: 0 }
      }
      contagem[v.clienteId].total += v.total
      contagem[v.clienteId].quantidade += 1
    })

    return Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }

  const COLORS = ['#3d7a3d', '#c9a227', '#5a9bd4', '#e85d5d']

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
            <h1 className="text-2xl font-bold text-foreground">Relatorios</h1>
            <p className="text-sm text-muted-foreground">
              Analise o desempenho do seu negocio
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar dados"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filtro de Periodo */}
        <Tabs
          value={periodo}
          onValueChange={(v) => setPeriodo(v as typeof periodo)}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="semana">Ultima Semana</TabsTrigger>
            <TabsTrigger value="mes">Ultimo Mes</TabsTrigger>
            <TabsTrigger value="ano">Ultimo Ano</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Cards de Resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total em Vendas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalVendas)}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendasFiltradas.length} venda(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Recebido
              </CardTitle>
              <ArrowUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalRecebido)}
              </div>
              <p className="text-xs text-muted-foreground">
                {((totalRecebido / totalVendas) * 100 || 0).toFixed(0)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendente
              </CardTitle>
              <ArrowDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalPendente)}
              </div>
              <p className="text-xs text-muted-foreground">a receber</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Medio
              </CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(ticketMedio)}
              </div>
              <p className="text-xs text-muted-foreground">por venda</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Grafico de Vendas por Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Vendas dos Ultimos 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasPorDia()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="valor" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grafico de Formas de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Formas de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {formasPagamento().length === 0 ? (
                  <p className="text-muted-foreground">Sem dados no periodo</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formasPagamento()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {formasPagamento().map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Total']}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clientes Mais Frequentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Top 5 Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientesFrequentes().length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Sem vendas no periodo
                </p>
              ) : (
                <div className="space-y-3">
                  {clientesFrequentes().map((cliente, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{cliente.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {cliente.quantidade} compra(s)
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(cliente.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Movimentacao de Estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Ultimas Movimentacoes de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movimentacoesFiltradas.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Sem movimentacoes no periodo
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {movimentacoesFiltradas
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .slice(0, 10)
                    .map((mov) => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {mov.tipo === 'entrada' ? (
                            <ArrowUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium text-foreground">
                              {mov.produtoNome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {mov.motivo} - {formatDate(mov.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold ${
                            mov.tipo === 'entrada'
                              ? 'text-primary'
                              : 'text-destructive'
                          }`}
                        >
                          {mov.tipo === 'entrada' ? '+' : '-'}
                          {mov.quantidade}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  )
}
