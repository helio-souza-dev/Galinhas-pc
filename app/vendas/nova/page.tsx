'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getClientes,
  getProdutos,
  addVenda,
  formatCurrency,
} from '@/lib/storage'
import { Cliente, Produto, ItemVenda } from '@/lib/types'
import { ArrowLeft, Plus, Minus, Trash2, Save, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovaVendaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [clienteId, setClienteId] = useState('')
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [frete, setFrete] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao' | 'fiado'>('pix')
  const [observacoes, setObservacoes] = useState('')
  
  // Novos estados para a logística
  const [tipoVenda, setTipoVenda] = useState<'retirada' | 'entrega'>('entrega')
  const [dataEntrega, setDataEntrega] = useState('')

  // Pede permissão de notificação quando a tela abre
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [clientesData, produtosData] = await Promise.all([
        getClientes(),
        getProdutos(),
      ])
      setClientes(clientesData)
      setProdutos(produtosData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const adicionarProduto = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return

    const itemExistente = itens.find((i) => i.produtoId === produtoId)
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.estoque) {
        toast.error('Estoque insuficiente')
        return
      }
      setItens(
        itens.map((i) =>
          i.produtoId === produtoId
            ? {
                ...i,
                quantidade: i.quantidade + 1,
                subtotal: (i.quantidade + 1) * i.precoUnitario,
              }
            : i
        )
      )
    } else {
      if (produto.estoque < 1) {
        toast.error('Produto sem estoque')
        return
      }
      setItens([
        ...itens,
        {
          produtoId: produto.id,
          produtoNome: produto.nome,
          quantidade: 1,
          precoUnitario: produto.preco,
          subtotal: produto.preco,
        },
      ])
    }
  }

  const alterarQuantidade = (produtoId: string, delta: number) => {
    const produto = produtos.find((p) => p.id === produtoId)
    const item = itens.find((i) => i.produtoId === produtoId)
    if (!item || !produto) return

    const novaQuantidade = item.quantidade + delta

    if (novaQuantidade < 1) {
      setItens(itens.filter((i) => i.produtoId !== produtoId))
      return
    }

    if (novaQuantidade > produto.estoque) {
      toast.error('Estoque insuficiente')
      return
    }

    setItens(
      itens.map((i) =>
        i.produtoId === produtoId
          ? {
              ...i,
              quantidade: novaQuantidade,
              subtotal: novaQuantidade * i.precoUnitario,
            }
          : i
      )
    )
  }

  const removerItem = (produtoId: string) => {
    setItens(itens.filter((i) => i.produtoId !== produtoId))
  }

  const subtotal = itens.reduce((acc, i) => acc + i.subtotal, 0)
  const freteValor = parseFloat(frete.replace(',', '.')) || 0
  const total = subtotal + freteValor

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!clienteId) {
      toast.error('Selecione um cliente')
      setLoading(false)
      return
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um produto')
      setLoading(false)
      return
    }

    const cliente = clientes.find((c) => c.id === clienteId)
    if (!cliente) {
      toast.error('Cliente não encontrado')
      setLoading(false)
      return
    }

    const status = formaPagamento === 'fiado' ? 'pendente' : 'pago'
    const valorPago = formaPagamento === 'fiado' ? 0 : total

    const statusEntrega = tipoVenda === 'retirada' ? 'entregue' : 'pendente'
    const dataFinal = tipoVenda === 'entrega' ? dataEntrega : new Date().toISOString().split('T')[0]

    try {
      await addVenda({
        clienteId,
        clienteNome: cliente.nome,
        itens,
        subtotal,
        frete: freteValor,
        total,
        formaPagamento,
        status,
        valorPago,
        observacoes,
        tipoVenda,
        dataEntrega: dataFinal,
        statusEntrega,
      })

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido 🥚', {
          body: `Pedido para ${cliente.nome} registrado!`,
          icon: '/icon-192.png'
        })
      }

      toast.success('Venda registrada com sucesso!')
      router.push('/vendas')
    } catch (error) {
      console.error('Erro ao registrar venda:', error)
      toast.error('Erro ao registrar venda')
      setLoading(false)
    }
  }

  const clienteSelecionado = clientes.find((c) => c.id === clienteId)

  if (loadingData) {
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
        <div className="mb-6">
          <Link
            href="/vendas"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para vendas
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Nova Venda</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.bairro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {clientes.length === 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhum cliente cadastrado
                      </p>
                      <Link href="/clientes/novo">
                        <Button variant="outline" size="sm">
                          Cadastrar Cliente
                        </Button>
                      </Link>
                    </div>
                  )}

                  {clienteSelecionado && (
                    <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-foreground">
                        {clienteSelecionado.nome}
                      </p>
                      <p className="text-muted-foreground">
                        {clienteSelecionado.endereco}
                      </p>
                      <p className="text-muted-foreground">
                        {clienteSelecionado.bairro}, {clienteSelecionado.cidade}
                      </p>
                      {clienteSelecionado.telefone && (
                        <p className="text-muted-foreground">
                          Tel: {clienteSelecionado.telefone}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Adicionar Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  {produtos.length === 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Nenhum produto cadastrado
                      </p>
                      <Link href="/produtos/novo">
                        <Button variant="outline" size="sm">
                          Cadastrar Produto
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {produtos.map((produto) => (
                        <Button
                          key={produto.id}
                          type="button"
                          variant="outline"
                          className="h-auto flex-col items-start p-3"
                          onClick={() => adicionarProduto(produto.id)}
                          disabled={produto.estoque === 0}
                        >
                          <span className="font-medium">{produto.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(produto.preco)} - Est: {produto.estoque}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Itens da Venda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {itens.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum item adicionado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {itens.map((item) => (
                        <div
                          key={item.produtoId}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {item.produtoNome}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.precoUnitario)} x {item.quantidade}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground mr-2">
                              {formatCurrency(item.subtotal)}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => alterarQuantidade(item.produtoId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-foreground">
                              {item.quantidade}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => alterarQuantidade(item.produtoId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removerItem(item.produtoId)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pagamento e Logística</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo de Venda</Label>
                      <Select 
                        value={tipoVenda} 
                        onValueChange={(v: 'retirada' | 'entrega') => setTipoVenda(v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrega">Entrega Programada</SelectItem>
                          <SelectItem value="retirada">Já Entregue (Retirada)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {tipoVenda === 'entrega' && (
                      <div className="space-y-2">
                        <Label htmlFor="dataEntrega">Data da Entrega</Label>
                        <Input
                          id="dataEntrega"
                          type="date"
                          value={dataEntrega}
                          onChange={(e) => setDataEntrega(e.target.value)}
                          required={tipoVenda === 'entrega'}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="frete">Frete (R$)</Label>
                      <Input
                        id="frete"
                        value={frete}
                        onChange={(e) => setFrete(e.target.value)}
                        placeholder="0,00"
                        disabled={tipoVenda === 'retirada'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={formaPagamento}
                        onValueChange={(v) =>
                          setFormaPagamento(
                            v as 'dinheiro' | 'pix' | 'cartao' | 'fiado'
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="fiado">Fiado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Troco para 50, cor da casa..."
                      rows={2}
                    />
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frete</span>
                      <span className="text-foreground">
                        {formatCurrency(tipoVenda === 'retirada' ? 0 : freteValor)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">
                        {formatCurrency(subtotal + (tipoVenda === 'retirada' ? 0 : freteValor))}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link href="/vendas" className="flex-1">
                      <Button type="button" variant="outline" className="w-full">
                        Cancelar
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      className="flex-1 gap-2"
                      disabled={loading || itens.length === 0 || !clienteId}
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Salvando...' : 'Finalizar Venda'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppSidebar>
  )
}