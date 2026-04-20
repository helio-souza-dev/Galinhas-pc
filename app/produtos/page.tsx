'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getProdutos,
  deleteProduto,
  updateProduto,
  addMovimentacao,
  formatCurrency,
} from '@/lib/storage'
import { Produto } from '@/lib/types'
import { Plus, Search, Trash2, Pencil, Package, ArrowUp, ArrowDown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [estoqueDialog, setEstoqueDialog] = useState<{
    open: boolean
    produto: Produto | null
    tipo: 'entrada' | 'saida'
  }>({ open: false, produto: null, tipo: 'entrada' })
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    setProdutos(getProdutos())
    setLoading(false)
  }, [])

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string) => {
    deleteProduto(id)
    setProdutos(getProdutos())
    toast.success('Produto removido com sucesso')
  }

  const handleEstoque = () => {
    if (!estoqueDialog.produto || !quantidade) return

    const qtd = parseInt(quantidade)
    if (isNaN(qtd) || qtd <= 0) {
      toast.error('Quantidade invalida')
      return
    }

    const produto = estoqueDialog.produto
    const novoEstoque =
      estoqueDialog.tipo === 'entrada'
        ? produto.estoque + qtd
        : produto.estoque - qtd

    if (novoEstoque < 0) {
      toast.error('Estoque insuficiente')
      return
    }

    updateProduto(produto.id, { estoque: novoEstoque })
    addMovimentacao({
      produtoId: produto.id,
      produtoNome: produto.nome,
      tipo: estoqueDialog.tipo,
      quantidade: qtd,
      motivo: motivo || (estoqueDialog.tipo === 'entrada' ? 'Entrada manual' : 'Saida manual'),
    })

    setProdutos(getProdutos())
    setEstoqueDialog({ open: false, produto: null, tipo: 'entrada' })
    setQuantidade('')
    setMotivo('')
    toast.success(
      estoqueDialog.tipo === 'entrada'
        ? 'Entrada registrada com sucesso'
        : 'Saida registrada com sucesso'
    )
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

  return (
    <AppSidebar>
      <div className="p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              {produtos.length} produto(s) cadastrado(s)
            </p>
          </div>
          <Link href="/produtos/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </Link>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {produtosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </p>
              {!search && (
                <Link href="/produtos/novo">
                  <Button>Cadastrar Primeiro Produto</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {produtosFiltrados.map((produto) => (
              <Card key={produto.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{produto.nome}</CardTitle>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        produto.tipo === 'ovos'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      {produto.tipo === 'ovos' ? 'Ovos' : 'Galinha'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Preco</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(produto.preco)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        por {produto.unidade}
                        {produto.unidade !== 'unidade' && ` (${produto.quantidade} un)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estoque</p>
                      <p
                        className={`text-2xl font-bold ${
                          produto.estoque <= 5
                            ? 'text-destructive'
                            : produto.estoque <= 10
                            ? 'text-accent-foreground'
                            : 'text-primary'
                        }`}
                      >
                        {produto.estoque}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Dialog
                      open={
                        estoqueDialog.open &&
                        estoqueDialog.produto?.id === produto.id &&
                        estoqueDialog.tipo === 'entrada'
                      }
                      onOpenChange={(open) => {
                        if (open) {
                          setEstoqueDialog({ open: true, produto, tipo: 'entrada' })
                        } else {
                          setEstoqueDialog({ open: false, produto: null, tipo: 'entrada' })
                          setQuantidade('')
                          setMotivo('')
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <ArrowUp className="h-3 w-3 text-primary" />
                          Entrada
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Entrada de Estoque</DialogTitle>
                          <DialogDescription>
                            Adicionar {produto.nome} ao estoque
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantidade">Quantidade</Label>
                            <Input
                              id="quantidade"
                              type="number"
                              min="1"
                              value={quantidade}
                              onChange={(e) => setQuantidade(e.target.value)}
                              placeholder="Quantidade"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motivo">Motivo (opcional)</Label>
                            <Input
                              id="motivo"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              placeholder="Ex: Producao da semana"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleEstoque}>Confirmar Entrada</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={
                        estoqueDialog.open &&
                        estoqueDialog.produto?.id === produto.id &&
                        estoqueDialog.tipo === 'saida'
                      }
                      onOpenChange={(open) => {
                        if (open) {
                          setEstoqueDialog({ open: true, produto, tipo: 'saida' })
                        } else {
                          setEstoqueDialog({ open: false, produto: null, tipo: 'saida' })
                          setQuantidade('')
                          setMotivo('')
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <ArrowDown className="h-3 w-3 text-destructive" />
                          Saida
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Saida de Estoque</DialogTitle>
                          <DialogDescription>
                            Remover {produto.nome} do estoque
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="quantidade-saida">Quantidade</Label>
                            <Input
                              id="quantidade-saida"
                              type="number"
                              min="1"
                              max={produto.estoque}
                              value={quantidade}
                              onChange={(e) => setQuantidade(e.target.value)}
                              placeholder="Quantidade"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="motivo-saida">Motivo (opcional)</Label>
                            <Input
                              id="motivo-saida"
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              placeholder="Ex: Perda, quebra"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="destructive" onClick={handleEstoque}>
                            Confirmar Saida
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Link href={`/produtos/${produto.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Pencil className="h-3 w-3" />
                        Editar
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover produto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {produto.nome}? Esta acao
                            nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(produto.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppSidebar>
  )
}
