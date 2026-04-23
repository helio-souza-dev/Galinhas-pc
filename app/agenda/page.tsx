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
import { MapPin, RefreshCw, Package, Truck, CheckCircle2, Phone, Route } from 'lucide-react'
import { toast } from 'sonner'

function extrairData(dataStr: string): string {
  return dataStr.split('T')[0]
}

function formatarTelefone(tel: string): string {
  return tel.replace(/\D/g, '')
}

function gerarMensagemWhatsApp(venda: Venda): string {
  const itens = venda.itens.map(i => `• ${i.quantidade}x ${i.produtoNome}`).join('\n')
  const restante = venda.total - venda.valorPago
  const msg = `Olá ${venda.clienteNome}! 👋\n\nPassando para lembrar do seu pedido:\n${itens}\n\nValor: ${formatCurrency(venda.total)}\nPendente: ${formatCurrency(restante)}\n\nQualquer dúvida é só falar! 🥚`
  return encodeURIComponent(msg)
}

function gerarRotaGoogleMaps(enderecos: { endereco: string; cidade: string; bairro: string }[]): string {
  if (enderecos.length === 0) return ''
  if (enderecos.length === 1) {
    return getGoogleMapsLink(enderecos[0].endereco, enderecos[0].cidade, enderecos[0].bairro)
  }
  const waypoints = enderecos.map(e => encodeURIComponent(`${e.endereco}, ${e.bairro}, ${e.cidade}`))
  const destino = waypoints.pop()
  const base = `https://www.google.com/maps/dir/${waypoints.join('/')}/${destino}`
  return base
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

  // Resumo do dia
  const totalDoDia = entregasDoDia.reduce((acc, v) => acc + v.total, 0)
  const entregues = entregasDoDia.filter(v => v.statusEntrega === 'entregue').length
  const pendentes = entregasDoDia.filter(v => v.statusEntrega !== 'entregue').length
  const totalPendentePagamento = entregasDoDia
    .filter(v => v.status !== 'pago')
    .reduce((acc, v) => acc + (v.total - v.valorPago), 0)

  // Rota do dia: todos os clientes com entrega pendente no dia
  const enderecosDoDia = entregasDoDia
    .filter(v => v.statusEntrega !== 'entregue')
    .map(v => {
      const cliente = getCliente(v.clienteId)
      return cliente ? { endereco: cliente.endereco, cidade: cliente.cidade, bairro: cliente.bairro } : null
    })
    .filter(Boolean) as { endereco: string; cidade: string; bairro: string }[]

  const urlRota = gerarRotaGoogleMaps(enderecosDoDia)

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

        {/* Esquerda: Calendário + Resumo */}
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
                  hasEntrega: { fontWeight: 'bold', textDecoration: 'underline', color: 'hsl(var(--primary))' }
                }}
              />
            </CardContent>
          </Card>

          {/* Resumo do dia */}
          {entregasDoDia.length > 0 && (
            <Card className="bg-muted/40">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Resumo do dia</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Entregas</p>
                    <p className="font-bold text-foreground">{entregasDoDia.length}</p>
                  </div>
                  <div className="bg-background rounded-lg p-2 text-center">
                    <p className="text-muted-foreground">Valor total</p>
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

                {totalPendentePagamento > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-2 text-center text-xs">
                    <p className="text-muted-foreground">A receber hoje</p>
                    <p className="font-bold text-destructive">{formatCurrency(totalPendentePagamento)}</p>
                  </div>
                )}

                {/* Botão Rota do Dia */}
                {urlRota && (
                  <a href={urlRota} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full gap-2 text-sm">
                      <Route className="h-4 w-4 text-blue-500" />
                      Ver rota do dia ({enderecosDoDia.length} parada{enderecosDoDia.length !== 1 ? 's' : ''})
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Direita: Entregas do dia */}
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
                const restante = entrega.total - entrega.valorPago

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
                      <CardTitle className="text-base flex justify-between items-center gap-2 flex-wrap">
                        <span>{entrega.clienteNome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(entrega.total)}
                          </span>

                          {/* Botão Ligar */}
                          {cliente?.telefone && (
                            <a href={`tel:${formatarTelefone(cliente.telefone)}`}>
                              <Button variant="outline" size="icon" className="h-8 w-8" title="Ligar">
                                <Phone className="h-4 w-4 text-green-600" />
                              </Button>
                            </a>
                          )}

                          {/* Botão WhatsApp (cobrança) */}
                          {cliente?.telefone && entrega.status !== 'pago' && (
                            <a
                              href={`https://wa.me/55${formatarTelefone(cliente.telefone)}?text=${gerarMensagemWhatsApp(entrega)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon" className="h-8 w-8" title="WhatsApp — cobrar">
                                {/* WhatsApp SVG */}
                                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-green-500" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </Button>
                            </a>
                          )}

                          {/* Botão Maps */}
                          {cliente && (
                            <a
                              href={getGoogleMapsLink(cliente.endereco, cliente.cidade, cliente.bairro)}
                              target="_blank" rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="icon" className="h-8 w-8" title="Abrir no Maps">
                                <MapPin className="h-4 w-4 text-red-500" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="py-2 pt-0 space-y-2">
                      {/* Endereço */}
                      {cliente && (
                        <p className="text-xs text-muted-foreground">
                          📍 {cliente.endereco}, {cliente.bairro} — {cliente.cidade}
                          {cliente.telefone && <span className="ml-2">• 📞 {cliente.telefone}</span>}
                        </p>
                      )}

                      {/* Itens */}
                      <p className="text-sm text-muted-foreground">
                        <strong>Itens:</strong> {entrega.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(', ')}
                      </p>

                      {/* Observações */}
                      {entrega.observacoes && (
                        <p className="text-xs bg-muted rounded-md px-2 py-1">
                          💬 {entrega.observacoes}
                        </p>
                      )}

                      {/* A receber */}
                      {entrega.status !== 'pago' && restante > 0 && (
                        <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-md px-2 py-1">
                          💰 A receber: {formatCurrency(restante)}
                        </p>
                      )}

                      {/* Badges de status */}
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

                      {/* Botões de avanço de status */}
                      {entrega.statusEntrega !== 'entregue' && (
                        <div className="flex gap-2 pt-1 flex-wrap">
                          {entrega.statusEntrega !== 'preparando' && entrega.statusEntrega !== 'em_rota' && (
                            <Button size="sm" variant="outline"
                              className="text-xs h-7 border-orange-400 text-orange-600 hover:bg-orange-50"
                              disabled={isAtualizando}
                              onClick={() => moverStatus(entrega.id, 'preparando')}
                            >
                              <Package className="h-3 w-3 mr-1" /> Separar
                            </Button>
                          )}
                          {entrega.statusEntrega !== 'em_rota' && (
                            <Button size="sm" variant="outline"
                              className="text-xs h-7 border-purple-400 text-purple-600 hover:bg-purple-50"
                              disabled={isAtualizando}
                              onClick={() => moverStatus(entrega.id, 'em_rota')}
                            >
                              <Truck className="h-3 w-3 mr-1" /> Despachar
                            </Button>
                          )}
                          <Button size="sm" variant="outline"
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