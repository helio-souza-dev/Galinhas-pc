'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Venda } from '@/lib/types'
import { formatCurrency } from '@/lib/storage'
import { toast } from 'sonner'
import { ExternalLink, Loader2 } from 'lucide-react'

interface BotaoMercadoPagoProps {
  venda: Venda
  telefoneCliente?: string
  onLinkGerado?: (url: string) => void
}

export function BotaoMercadoPago({ venda, telefoneCliente, onLinkGerado }: BotaoMercadoPagoProps) {
  const [loading, setLoading] = useState(false)
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null)

  const gerarLink = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/mercadopago/criar-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendaId: venda.id,
          clienteNome: venda.clienteNome,
          itens: venda.itens,
          total: venda.total,
          frete: venda.frete,
        }),
      })

      if (!response.ok) throw new Error('Erro ao gerar link')

      const data = await response.json()

      // Em produção usa initPoint; em sandbox usa sandboxInitPoint
      const isProd = process.env.NEXT_PUBLIC_MP_ENV === 'production'
      const url = isProd ? data.initPoint : data.sandboxInitPoint

      setLinkPagamento(url)
      onLinkGerado?.(url)

      await navigator.clipboard.writeText(url)
      toast.success('Link copiado! Envie para o cliente pelo WhatsApp.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao gerar link de pagamento')
    } finally {
      setLoading(false)
    }
  }

  const enviarWhatsApp = (telefone: string) => {
    if (!linkPagamento) return
    const tel = telefone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá! Segue o link para pagamento do seu pedido (${formatCurrency(venda.total)}) via Mercado Pago:\n\n${linkPagamento}`
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank')
  }

  if (venda.status === 'pago') {
    return (
      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 font-medium">
        Pago via MP
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {!linkPagamento ? (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-xs border-blue-400 text-blue-600 hover:bg-blue-50"
          onClick={gerarLink}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-blue-500" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-5.668 5.668a1.07 1.07 0 01-1.513 0L7.438 10.97a1.07 1.07 0 111.513-1.513l2.186 2.187 4.912-4.913a1.07 1.07 0 111.513 1.517z"/>
            </svg>
          )}
          {loading ? 'Gerando...' : 'Cobrar via Mercado Pago'}
        </Button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-green-600 font-medium">Link gerado e copiado!</p>
          <div className="flex gap-2 flex-wrap">
            <a href={linkPagamento} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                <ExternalLink className="h-3 w-3" />
                Abrir link
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 gap-1 border-green-400 text-green-600"
              onClick={() => {
                const tel = telefoneCliente || prompt('Telefone do cliente não encontrado. Digite (com DDD):')
                if (tel) enviarWhatsApp(tel)
              }}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-green-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar WhatsApp
            </Button>
            <Button
              size="sm" variant="ghost"
              className="text-xs h-7 text-muted-foreground"
              onClick={() => setLinkPagamento(null)}
            >
              Gerar novo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}