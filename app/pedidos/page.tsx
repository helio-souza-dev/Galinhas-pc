'use client'

import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getVendas, atualizarStatusEntrega } from '@/lib/storage'
import { Venda } from '@/lib/types'
import { toast } from 'sonner'
import { PackageOpen, ChefHat, Truck, CheckCircle2, Clock } from 'lucide-react'

// Configuração das colunas estilo iFood
const COLUNAS = [
  { id: 'pendente', titulo: 'Novos', icone: Clock, cor: 'border-l-blue-500' },
  { id: 'preparando', titulo: 'Separando (Ovos/Aves)', icone: PackageOpen, cor: 'border-l-orange-500' },
  { id: 'em_rota', titulo: 'Saiu p/ Entrega', icone: Truck, cor: 'border-l-purple-500' },
  { id: 'entregue', titulo: 'Entregues', icone: CheckCircle2, cor: 'border-l-green-500' },
]

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)

  const carregarPedidos = async () => {
    try {
      const data = await getVendas()
      // Filtra para não mostrar pedidos de dias muito antigos (opcional, dependendo do volume)
      setPedidos(data)
    } catch (error) {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  const moverPedido = async (pedidoId: string, novoStatus: any) => {
    try {
      await atualizarStatusEntrega(pedidoId, novoStatus)
      toast.success('Status atualizado!')
      carregarPedidos() // Recarrega a tela
    } catch (error) {
      toast.error('Erro ao mover pedido')
    }
  }

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      </AppSidebar>
    )
  }

  return (
    <AppSidebar>
      <div className="p-4 md:p-6 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Gestor de Entregas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe e organize a saída das mercadorias</p>
        </div>

        {/* Quadro Kanban (Colunas) */}
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {COLUNAS.map((coluna) => {
            const Icone = coluna.icone
            // Pega apenas os pedidos que estão no status da coluna (se não tiver status, assume 'pendente')
            const pedidosDaColuna = pedidos.filter(p => (p.statusEntrega || 'pendente') === coluna.id)

            return (
              <div key={coluna.id} className="flex-1 min-w-[280px] md:min-w-[320px] bg-muted/40 rounded-lg p-3 flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-1 text-foreground font-semibold">
                  <Icone className="h-5 w-5 text-muted-foreground" />
                  <h3>{coluna.titulo}</h3>
                  <span className="ml-auto bg-background px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {pedidosDaColuna.length}
                  </span>
                </div>

                <div className="flex-col flex gap-3 flex-1 overflow-y-auto pr-1">
                  {pedidosDaColuna.map((pedido) => (
                    <Card key={pedido.id} className={`shadow-sm border-l-4 ${coluna.cor}`}>
                      <CardHeader className="p-3 pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <span className="truncate pr-2">{pedido.clienteNome}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 py-0 text-sm text-muted-foreground">
                        <ul className="mb-2 space-y-1">
                          {pedido.itens.map((item, idx) => (
                            <li key={idx} className="flex font-medium text-foreground">
                              <span className="w-6 text-primary">{item.quantidade}x</span>
                              <span className="truncate">{item.produtoNome}</span>
                            </li>
                          ))}
                        </ul>
                        {pedido.observacoes && (
                          <div className="bg-muted p-2 rounded-md text-xs mb-2">
                            <strong>Obs:</strong> {pedido.observacoes}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-3 pt-2 flex flex-col gap-2">
                        {/* Botões de Ação baseados na coluna atual */}
                        {coluna.id === 'pendente' && (
                          <Button size="sm" className="w-full" onClick={() => moverPedido(pedido.id, 'preparando')}>
                            Iniciar Separação
                          </Button>
                        )}
                        {coluna.id === 'preparando' && (
                          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => moverPedido(pedido.id, 'em_rota')}>
                            Despachar para Entrega
                          </Button>
                        )}
                        {coluna.id === 'em_rota' && (
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => moverPedido(pedido.id, 'entregue')}>
                            Confirmar Entrega
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}

                  {pedidosDaColuna.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppSidebar>
  )
}