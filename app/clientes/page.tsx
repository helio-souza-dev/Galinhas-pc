'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getClientes, deleteCliente, getGoogleMapsLink } from '@/lib/storage'
import { Cliente } from '@/lib/types'
import { Plus, Search, MapPin, Phone, Trash2, Pencil } from 'lucide-react'
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

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setClientes(getClientes())
    setLoading(false)
  }, [])

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search) ||
      c.bairro.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id: string) => {
    deleteCliente(id)
    setClientes(getClientes())
    toast.success('Cliente removido com sucesso')
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
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {clientes.length} cliente(s) cadastrado(s)
            </p>
          </div>
          <Link href="/clientes/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {clientesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
              {!search && (
                <Link href="/clientes/novo">
                  <Button>Cadastrar Primeiro Cliente</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientesFiltrados.map((cliente) => (
              <Card key={cliente.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-foreground">{cliente.endereco}</p>
                      <p className="text-muted-foreground">
                        {cliente.bairro}, {cliente.cidade}
                      </p>
                    </div>
                  </div>

                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${cliente.telefone}`}
                        className="text-primary hover:underline"
                      >
                        {cliente.telefone}
                      </a>
                    </div>
                  )}

                  {cliente.referencia && (
                    <p className="text-xs text-muted-foreground italic">
                      Ref: {cliente.referencia}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <a
                      href={getGoogleMapsLink(
                        cliente.endereco,
                        cliente.cidade,
                        cliente.bairro
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <MapPin className="h-3 w-3" />
                        Mapa
                      </Button>
                    </a>
                    <Link href={`/clientes/${cliente.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3 w-3" />
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
                          <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {cliente.nome}? Esta acao
                            nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cliente.id)}
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
