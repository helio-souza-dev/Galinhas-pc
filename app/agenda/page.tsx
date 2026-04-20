'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getVendas, formatCurrency } from '@/lib/storage'
import { Venda } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getVendas()
        setVendas(data)
      } catch (error) {
        console.error("Erro ao carregar vendas:", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtra as vendas que têm dataEntrega igual ao dia selecionado no calendário
  const entregasDoDia = vendas.filter((venda) => {
    if (!venda.dataEntrega || !date) return false
    // Compara apenas o Ano-Mês-Dia
    return venda.dataEntrega === format(date, 'yyyy-MM-dd')
  })

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
        
        {/* Lado Esquerdo: Calendário */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Agenda de Entregas</h1>
          <Card>
            <CardContent className="p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="rounded-md border shadow-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Lista de Entregas do Dia */}
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
              {entregasDoDia.map(entrega => (
                <Card key={entrega.id} className="border-l-4 border-l-primary shadow-sm">
                  <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>{entrega.clienteNome}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatCurrency(entrega.total)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 pt-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Itens:</strong> {entrega.itens.map(i => `${i.quantidade}x ${i.produtoNome}`).join(', ')}
                    </p>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        entrega.status === 'pago' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                      }`}>
                        Pagamento: {entrega.status}
                      </span>
                      {entrega.observacoes && (
                         <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                           Obs: {entrega.observacoes}
                         </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppSidebar>
  )
}