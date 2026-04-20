'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getClienteById, updateCliente } from '@/lib/storage'
import { Cliente } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    endereco: '',
    cidade: '',
    bairro: '',
    referencia: '',
    observacoes: '',
  })

  useEffect(() => {
    const loadCliente = async () => {
      try {
        const found = await getClienteById(params.id as string)
        if (found) {
          setCliente(found)
          setForm({
            nome: found.nome,
            telefone: found.telefone,
            endereco: found.endereco,
            cidade: found.cidade,
            bairro: found.bairro,
            referencia: found.referencia || '',
            observacoes: found.observacoes || '',
          })
        }
      } catch (error) {
        console.error('Erro ao carregar cliente:', error)
        toast.error('Erro ao carregar cliente')
      } finally {
        setLoadingData(false)
      }
    }
    loadCliente()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!form.nome || !form.endereco || !form.cidade || !form.bairro) {
      toast.error('Preencha os campos obrigatorios')
      setLoading(false)
      return
    }

    try {
      await updateCliente(params.id as string, form)
      toast.success('Cliente atualizado com sucesso!')
      router.push('/clientes')
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast.error('Erro ao atualizar cliente')
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppSidebar>
    )
  }

  if (!cliente) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Cliente nao encontrado</p>
        </div>
      </AppSidebar>
    )
  }

  return (
    <AppSidebar>
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para clientes
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereco *</Label>
                <Input
                  id="endereco"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, numero"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={form.bairro}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    placeholder="Bairro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    placeholder="Cidade"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencia">Ponto de Referencia</Label>
                <Input
                  id="referencia"
                  value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                  placeholder="Ex: Proximo ao mercado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observacoes</Label>
                <Textarea
                  id="observacoes"
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Observacoes sobre o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/clientes" className="flex-1">
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
