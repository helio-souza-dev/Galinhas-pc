'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getVendas,
  getClientes,
  formatCurrency,
  formatDateTime,
  addPagamento,
  getGoogleMapsLink,
} from '@/lib/storage'
import { Venda, Cliente } from '@/lib/types'
import { Plus, Search, MapPin, Eye, DollarSign, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'pendente' | 'pago'>('todas')
  const [pagamentoDialog, setPagamentoDialog] = useState<{
    open: boolean
    venda: Venda | null
  }>({ open: false, venda: null })
  const [valorPagamento, setValorPagamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao'>(
    'pix'
  )

  const loadData = useCallback(async () => {
    try {
      const [vendasData, clientesData] = await Promise.all([
        getVendas(),
        getClientes(),
      ])
      setVendas(vendasData)
      setClientes(clientesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
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

  const getClienteEndereco = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId)
    if (!cliente) return null
    return {
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      bairro: cliente.bairro,
    }
  }

  const vendasOrdenadas = [...vendas].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const vendasFiltradas = vendasOrdenadas.filter((v) => {
    const matchSearch =
      v.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase())

    if (filtro === 'todas') return matchSearch
    if (filtro === 'pendente')
      return matchSearch && (v.status === 'pendente' || v.status === 'parcial')
    if (filtro === 'pago') return matchSearch && v.status === 'pago'
    return matchSearch
  })

  const handlePagamento = async () => {
    if (!pagamentoDialog.venda || !valorPagamento) return

    const valor = parseFloat(valorPagamento.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor invalido')
      return
    }

    const restante = pagamentoDialog.venda.total - pagamentoDialog.venda.valorPago
    if (valor > restante) {
      toast.error(`Valor maximo: ${formatCurrency(restante)}`)
      return
    }

    try {
      await addPagamento({
        vendaId: pagamentoDialog.venda.id,
        valor,
        formaPagamento,
      })

      await loadData()
      setPagamentoDialog({ open: false, venda: null })
      setValorPagamento('')
      toast.success('Pagamento registrado com sucesso!')
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast.error('Erro ao registrar pagamento')
    }
  }

  const totalPendente = vendas
    .filter((v) => v.status !== 'pago')
    .reduce((acc, v) => acc + (v.total - v.valorPago), 0)

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
            <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
            <p className="text-sm text-muted-foreground">
              {vendas.length} venda(s) - {formatCurrency(totalPendente)} pendente
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSync}
              disabled={syncing}
              title="Sincronizar dados"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/vendas/nova">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Venda
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs
          value={filtro}
          onValueChange={(v) => setFiltro(v as typeof filtro)}
          className="mb-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="pago">Pagas</TabsTrigger>
          </TabsList>
        </Tabs>

        {vendasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {search || filtro !== 'todas'
                  ? 'Nenhuma venda encontrada'
                  : 'Nenhuma venda registrada'}
              </p>
              {!search && filtro === 'todas' && (
                <Link href="/vendas/nova">
                  <Button>Registrar Primeira Venda</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {vendasFiltradas.map((venda) => {
              const clienteEndereco = getClienteEndereco(venda.clienteId)
              const restante = venda.total - venda.valorPago

              return (
                <Card key={venda.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {venda.clienteNome}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              venda.status === 'pago'
                                ? 'bg-primary/20 text-primary'
                                : venda.status === 'parcial'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-destructive/20 text-destructive'
                            }`}
                          >
                            {venda.status === 'pago'
                              ? 'Pago'
                              : venda.status === 'parcial'
                              ? 'Parcial'
                              : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(venda.createdAt)} - #{venda.id.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {venda.itens.length} item(s) - {venda.formaPagamento}
                        </p>
                        {venda.tipoVenda === 'entrega' && venda.dataEntrega && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📦 Entrega:{' '}
                            {new Date(venda.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {venda.statusEntrega && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                                venda.statusEntrega === 'entregue'
                                  ? 'bg-primary/20 text-primary'
                                  : venda.statusEntrega === 'em_rota'
                                  ? 'bg-purple-500/20 text-purple-600'
                                  : venda.statusEntrega === 'preparando'
                                  ? 'bg-orange-500/20 text-orange-600'
                                  : 'bg-blue-500/20 text-blue-600'
                              }`}>
                                {venda.statusEntrega === 'entregue' ? 'Entregue'
                                  : venda.statusEntrega === 'em_rota' ? 'Em rota'
                                  : venda.statusEntrega === 'preparando' ? 'Separando'
                                  : 'Aguardando'}
                              </span>
                            )}
                          </p>
                        )}
                        {venda.tipoVenda === 'retirada' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ✅ Retirada na hora
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            {formatCurrency(venda.total)}
                          </p>
                          {venda.status !== 'pago' && (
                            <p className="text-xs text-destructive">
                              Falta: {formatCurrency(restante)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {clienteEndereco && (
                            <a
                              href={getGoogleMapsLink(
                                clienteEndereco.endereco,
                                clienteEndereco.cidade,
                                clienteEndereco.bairro
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon">
                                <MapPin className="h-4 w-4" />
                              </Button>
                            </a>
                          )}

                          <Link href={`/vendas/${venda.id}`}>
                            <Button variant="outline" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {venda.status !== 'pago' && (
                            <Dialog
                              open={
                                pagamentoDialog.open &&
                                pagamentoDialog.venda?.id === venda.id
                              }
                              onOpenChange={(open) => {
                                if (open) {
                                  setPagamentoDialog({ open: true, venda })
                                  setValorPagamento(restante.toString())
                                } else {
                                  setPagamentoDialog({ open: false, venda: null })
                                  setValorPagamento('')
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="default" size="icon">
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Registrar Pagamento</DialogTitle>
                                  <DialogDescription>
                                    Venda de {venda.clienteNome} -{' '}
                                    {formatCurrency(restante)} restante
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="valor">Valor (R$)</Label>
                                    <Input
                                      id="valor"
                                      value={valorPagamento}
                                      onChange={(e) =>
                                        setValorPagamento(e.target.value)
                                      }
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Select
                                      value={formaPagamento}
                                      onValueChange={(
                                        v: 'dinheiro' | 'pix' | 'cartao'
                                      ) => setFormaPagamento(v)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="dinheiro">
                                          Dinheiro
                                        </SelectItem>
                                        <SelectItem value="cartao">Cartao</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handlePagamento}>
                                    Confirmar Pagamento
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppSidebar>
  )
}