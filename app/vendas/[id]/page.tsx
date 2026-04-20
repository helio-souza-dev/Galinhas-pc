'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getVendas,
  getClientes,
  getPagamentos,
  addPagamento,
  formatCurrency,
  formatDateTime,
  getGoogleMapsLink,
} from '@/lib/storage'
import { Venda, Cliente, Pagamento } from '@/lib/types'
import { ArrowLeft, MapPin, Phone, DollarSign } from 'lucide-react'
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

export default function VendaDetalhesPage() {
  const params = useParams()
  const [venda, setVenda] = useState<Venda | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [valorPagamento, setValorPagamento] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao'>(
    'pix'
  )

  const loadData = () => {
    const vendas = getVendas()
    const found = vendas.find((v) => v.id === params.id)
    if (found) {
      setVenda(found)
      const clientes = getClientes()
      const clienteFound = clientes.find((c) => c.id === found.clienteId)
      setCliente(clienteFound || null)

      const allPagamentos = getPagamentos()
      const vendaPagamentos = allPagamentos.filter((p) => p.vendaId === found.id)
      setPagamentos(vendaPagamentos)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [params.id])

  const handlePagamento = () => {
    if (!venda || !valorPagamento) return

    const valor = parseFloat(valorPagamento.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor invalido')
      return
    }

    const restante = venda.total - venda.valorPago
    if (valor > restante) {
      toast.error(`Valor maximo: ${formatCurrency(restante)}`)
      return
    }

    addPagamento({
      vendaId: venda.id,
      valor,
      formaPagamento,
    })

    loadData()
    setDialogOpen(false)
    setValorPagamento('')
    toast.success('Pagamento registrado!')
  }

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppSidebar>
    )
  }

  if (!venda) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Venda nao encontrada</p>
        </div>
      </AppSidebar>
    )
  }

  const restante = venda.total - venda.valorPago

  return (
    <AppSidebar>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Link
            href="/vendas"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para vendas
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Venda #{venda.id.slice(-6)}
            </h1>
            <span
              className={`text-sm px-3 py-1 rounded-full ${
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
          <p className="text-sm text-muted-foreground">
            {formatDateTime(venda.createdAt)}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {venda.clienteNome}
              </h3>

              {cliente && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{cliente.endereco}</p>
                  <p className="text-muted-foreground">
                    {cliente.bairro}, {cliente.cidade}
                  </p>

                  <div className="flex gap-2 pt-2">
                    {cliente.telefone && (
                      <a href={`tel:${cliente.telefone}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Phone className="h-3 w-3" />
                          Ligar
                        </Button>
                      </a>
                    )}
                    <a
                      href={getGoogleMapsLink(
                        cliente.endereco,
                        cliente.cidade,
                        cliente.bairro
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        Ver no Mapa
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo de Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(venda.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-foreground">{formatCurrency(venda.frete)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(venda.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago</span>
                <span className="text-primary">{formatCurrency(venda.valorPago)}</span>
              </div>
              {restante > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restante</span>
                  <span className="text-destructive font-semibold">
                    {formatCurrency(restante)}
                  </span>
                </div>
              )}

              {venda.status !== 'pago' && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-2 gap-2">
                      <DollarSign className="h-4 w-4" />
                      Registrar Pagamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Pagamento</DialogTitle>
                      <DialogDescription>
                        {formatCurrency(restante)} restante
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$)</Label>
                        <Input
                          id="valor"
                          value={valorPagamento}
                          onChange={(e) => setValorPagamento(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select
                          value={formaPagamento}
                          onValueChange={(v: 'dinheiro' | 'pix' | 'cartao') =>
                            setFormaPagamento(v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="cartao">Cartao</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handlePagamento}>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Itens ({venda.itens.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venda.itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.produtoNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.precoUnitario)} x {item.quantidade}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historico de Pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pagamento registrado
                </p>
              ) : (
                <div className="space-y-3">
                  {pagamentos.map((pag) => (
                    <div
                      key={pag.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {pag.formaPagamento}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(pag.createdAt)}
                        </p>
                      </div>
                      <p className="font-semibold text-primary">
                        {formatCurrency(pag.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {venda.observacoes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Observacoes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{venda.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppSidebar>
  )
}
