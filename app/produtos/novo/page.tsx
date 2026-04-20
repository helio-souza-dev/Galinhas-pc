'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { addProduto } from '@/lib/storage'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovoProdutoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    tipo: 'ovos' as 'ovos' | 'galinha',
    unidade: 'duzia' as 'duzia' | 'cartela' | 'unidade',
    preco: '',
    estoque: '',
  })

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

    if (!form.nome || !form.preco || !form.estoque) {
      toast.error('Preencha todos os campos')
      setLoading(false)
      return
    }

    const preco = parseFloat(form.preco.replace(',', '.'))
    const estoque = parseInt(form.estoque)

    if (isNaN(preco) || preco <= 0) {
      toast.error('Preco invalido')
      setLoading(false)
      return
    }

    if (isNaN(estoque) || estoque < 0) {
      toast.error('Estoque invalido')
      setLoading(false)
      return
    }

    addProduto({
      nome: form.nome,
      tipo: form.tipo,
      unidade: form.unidade,
      quantidade: getQuantidadePorUnidade(form.unidade),
      preco,
      estoque,
    })

    toast.success('Produto cadastrado com sucesso!')
    router.push('/produtos')
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
          <h1 className="text-2xl font-bold text-foreground">Novo Produto</h1>
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

              <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="space-y-2">
                  <Label htmlFor="estoque">Estoque Inicial *</Label>
                  <Input
                    id="estoque"
                    type="number"
                    min="0"
                    value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

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
