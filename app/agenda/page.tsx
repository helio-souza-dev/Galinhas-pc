'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getVendas, getClientes, formatCurrency, getGoogleMapsLink, atualizarStatusEntrega } from '@/lib/storage'
import { Venda, Cliente } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MapPin, RefreshCw, Package, Truck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

function extrairData(dataStr: string): string {
  return dataStr.split('T')[0]
}

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [vendas, setVendas] = useState<Venda[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [vendasData, clientesData] = await Promise.all([getVendas(), getClientes()])
      setVendas(vendasData)
      setClientes(clientesData)
    } catch (error) {
      console.error('Erro ao carregar:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const getCliente = (clienteId: string) => clientes.find(c => c.id === clienteId)

  const entregasDoDia = vendas.filter((venda) => {
    if (!venda.dataEntrega || !date) return false
    if (venda.tipoVenda === 'retirada') return false
    return extrairData(venda.dataEntrega) === format(date, 'yyyy-MM-dd')
  })

  const diasComEntrega = vendas
    .filter(v => v.dataEntrega && v.tipoVenda !== 'retirada' && v.statusEntrega !== 'entregue')
    .map(v => {
      const [ano, mes, dia] = extrairData(v.dataEntrega!).split('-').map(Number)
      return new Date(ano, mes - 1, dia)
    })

  const moverStatus = async (vendaId: string, novoStatus: 'pendente' | 'preparando' | 'em_rota' | 'entregue') => {
    setAtualizando(vendaId)
    try {
      await atualizarStatusEntrega(vendaId, novoStatus)
      toast.success('Status atualizado!')
      await carregar()
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setAtualizando(null)
    }
  }

  const totalDoDia = entregasDoDia.reduce((acc, v) => acc + v.total, 0)
  const entregues = entregasDoDia.filter(v => v.statusEntrega === 'entregue').length
  const pendentes = entregasDoDia.filter(v => v.statusEntrega !== 'entregue').length

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
      <div className="p-4 md:p-6 grid gap-6 md:grid-cols-[350px_1fr]">

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
            <Button variant="outline" size="icon" onClick={carregar} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardContent className="p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="rounded-md border shadow-sm"
                modifiers={{ hasEntrega: diasComEntrega }}
                modifiersStyles={{
                  hasEntrega: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: 'hsl(var(--primary))',
                  }
                }}
              />
            </CardContent>
          </Card>

          {entregasDoDia.length > 0 && (
            <Card className="bg-muted/40">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">Resumo do dia</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-foreground">{entregasDoDia.length} entrega(s)</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-bold text-primary">{formatCurrency(totalDoDia)}</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Entregues</p>
                    <p className="font-bold text-green-600">{entregues}</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Pendentes</p>
                    <p className="font-bold text-blue-600">{pendentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b pb-2">
            Entregas para {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : '...'}
          </h2>

          {entregasDoDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              <p>Nenhuma entrega programada para este dia.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {entregasDoDia.map(entrega => {
                const cliente = getCliente(entrega.clienteId)
                const isAtualizando = atualizando === entrega.id

                return (
                  <Card
                    key={entrega.id}
                    className={`border-l-4 shadow-sm ${
                      entrega.statusEntrega === 'entregue' ? 'border-l-green-500 opacity-75'
                        : entrega.statusEntrega === 'em_rota' ? 'border-l-purple-500'
                        : entrega.statusEntrega === 'preparando' ? 'border-l-orange-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    <CardHeader className="py-3 pb-1">
                      <CardTitle className="text-base flex justify-between items-center gap-2">
                        <span>{entrega.clienteNome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(entrega.total)}
                          </span>
                          {cliente && (
                            <a
                              href={getGoogleMapsLink(cliente.endereco, cliente.cidade, cliente.bairro)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Abrir no Maps">
                                <MapPin className="h-4 w-4 text-red-500" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="py-2 pt-0 space-y-2">
                      {cliente && (
                        <p className="text-xs text-muted-foreground">
                          📍 {cliente.endereco}, {cliente.bairro} — {cliente.cidade}
                        </p>
                      )}

                      <p className="text-sm text-muted-foreground">
                        <strong>Itens:</strong> {entrega.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(', ')}
                      </p>

                      {entrega.observacoes && (
                        <p className="text-xs bg-muted rounded-md px-2 py-1">
                          💬 {entrega.observacoes}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          entrega.status === 'pago' ? 'bg-green-500/20 text-green-700'
                            : entrega.status === 'parcial' ? 'bg-yellow-500/20 text-yellow-700'
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          💰 {entrega.status === 'pago' ? 'Pago' : entrega.status === 'parcial' ? 'Parcial' : 'Pendente'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          entrega.statusEntrega === 'entregue' ? 'bg-green-500/20 text-green-700'
                            : entrega.statusEntrega === 'em_rota' ? 'bg-purple-500/20 text-purple-700'
                            : entrega.statusEntrega === 'preparando' ? 'bg-orange-500/20 text-orange-700'
                            : 'bg-blue-500/20 text-blue-700'
                        }`}>
                          {entrega.statusEntrega === 'entregue' ? '✅ Entregue'
                            : entrega.statusEntrega === 'em_rota' ? '🚚 Em rota'
                            : entrega.statusEntrega === 'preparando' ? '📦 Separando'
                            : '🕐 Aguardando'}
                        </span>
                      </div>

                      {entrega.statusEntrega !== 'entregue' && (
                        <div className="flex gap-2 pt-1 flex-wrap">
                          {entrega.statusEntrega !== 'preparando' && entrega.statusEntrega !== 'em_rota' && (
                            <Button
                              size="sm" variant="outline"
                              className="text-xs h-7 border-orange-400 text-orange-600 hover:bg-orange-50"
                              disabled={isAtualizando}
                              onClick={() => moverStatus(entrega.id, 'preparando')}
                            >
                              <Package className="h-3 w-3 mr-1" /> Separar
                            </Button>
                          )}
                          {entrega.statusEntrega !== 'em_rota' && (
                            <Button
                              size="sm" variant="outline"
                              className="text-xs h-7 border-purple-400 text-purple-600 hover:bg-purple-50"
                              disabled={isAtualizando}
                              onClick={() => moverStatus(entrega.id, 'em_rota')}
                            >
                              <Truck className="h-3 w-3 mr-1" /> Despachar
                            </Button>
                          )}
                          <Button
                            size="sm" variant="outline"
                            className="text-xs h-7 border-green-400 text-green-600 hover:bg-green-50"
                            disabled={isAtualizando}
                            onClick={() => moverStatus(entrega.id, 'entregue')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {isAtualizando ? 'Salvando...' : 'Confirmar Entrega'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppSidebar>
  )
}