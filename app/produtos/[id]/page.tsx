'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { getProdutos, updateProduto } from '@/lib/storage'
import { Produto } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [produto, setProduto] = useState<Produto | null>(null)
  const [form, setForm] = useState({
    nome: '',
    tipo: 'ovos' as 'ovos' | 'galinha',
    unidade: 'duzia' as 'duzia' | 'cartela' | 'unidade',
    preco: '',
  })

  useEffect(() => {
    const produtos = getProdutos()
    const found = produtos.find((p) => p.id === params.id)
    if (found) {
      setProduto(found)
      setForm({
        nome: found.nome,
        tipo: found.tipo,
        unidade: found.unidade,
        preco: found.preco.toString(),
      })
    }
  }, [params.id])

  const getQuantidadePorUnidade = (unidade: string): number => {
    switch (unidade) {
      case 'duzia':
        return 12
      case 'cartela':
        return 30
      default:
        return 1
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!form.nome || !form.preco) {
      toast.error('Preencha todos os campos')
      setLoading(false)
      return
    }

    const preco = parseFloat(form.preco.replace(',', '.'))

    if (isNaN(preco) || preco <= 0) {
      toast.error('Preco invalido')
      setLoading(false)
      return
    }

    updateProduto(params.id as string, {
      nome: form.nome,
      tipo: form.tipo,
      unidade: form.unidade,
      quantidade: getQuantidadePorUnidade(form.unidade),
      preco,
    })

    toast.success('Produto atualizado com sucesso!')
    router.push('/produtos')
  }

  if (!produto) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Produto nao encontrado</p>
        </div>
      </AppSidebar>
    )
  }

  return (
    <AppSidebar>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para produtos
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Editar Produto</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Ovos Caipira - Duzia"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(value: 'ovos' | 'galinha') =>
                      setForm({ ...form, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ovos">Ovos</SelectItem>
                      <SelectItem value="galinha">Galinha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Unidade de Venda *</Label>
                  <Select
                    value={form.unidade}
                    onValueChange={(value: 'duzia' | 'cartela' | 'unidade') =>
                      setForm({ ...form, unidade: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="duzia">Duzia (12 un)</SelectItem>
                      <SelectItem value="cartela">Cartela (30 un)</SelectItem>
                      <SelectItem value="unidade">Unidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco">Preco (R$) *</Label>
                <Input
                  id="preco"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Estoque atual: {produto.estoque} {produto.unidade}(s)
              </p>

              <div className="flex gap-3 pt-4">
                <Link href="/produtos" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppSidebar>
  )
}
