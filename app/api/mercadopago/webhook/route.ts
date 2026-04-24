import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Valida a assinatura do webhook do Mercado Pago
function validarAssinatura(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // Em dev, não valida

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  if (!xSignature || !xRequestId) return false

  // Extrai ts e hash da assinatura
  const parts = xSignature.split(',')
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
  const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1]

  if (!ts || !hash) return false

  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return expectedHash === hash
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Valida assinatura (segurança)
    if (!validarAssinatura(request, rawBody)) {
      console.warn('Webhook MP: assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const { type, data } = body

    // Só processa notificações de pagamento
    if (type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pagamento ausente' }, { status: 400 })
    }

    // Busca detalhes do pagamento na API do MP
    const accessToken = process.env.MP_ACCESS_TOKEN
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!mpResponse.ok) {
      console.error('Erro ao buscar pagamento no MP:', await mpResponse.text())
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
    }

    const pagamento = await mpResponse.json()

    const {
      status: mpStatus,
      external_reference: vendaId,
      transaction_amount: valor,
      payment_method_id: metodoPagamento,
    } = pagamento

    if (!vendaId) {
      console.warn('Webhook MP: external_reference (vendaId) ausente')
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient()

    // Mapeia o status do MP para o status do sistema
    if (mpStatus === 'approved') {
      // Pagamento aprovado → marca venda como paga
      const { error } = await supabase
        .from('vendas')
        .update({
          status: 'pago',
          valor_pago: valor,
          forma_pagamento: metodoPagamento?.includes('pix') ? 'pix' : 'cartao',
          mp_payment_id: String(paymentId),
        })
        .eq('id', vendaId)

      if (error) {
        console.error('Erro ao atualizar venda:', error)
        return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 })
      }

      // Cria notificação no sistema
      await supabase.from('notificacoes').insert({
        titulo: '💰 Pagamento confirmado!',
        mensagem: `Pagamento de R$ ${valor?.toFixed(2)} confirmado via Mercado Pago.`,
        lida: false,
        venda_id: vendaId,
      })

      console.log(`✅ Venda ${vendaId} marcada como PAGA via MP (payment ${paymentId})`)

    } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
      // Pagamento pendente (PIX gerado mas não pago ainda)
      await supabase
        .from('vendas')
        .update({ status: 'pendente', mp_payment_id: String(paymentId) })
        .eq('id', vendaId)

      console.log(`⏳ Venda ${vendaId} com pagamento PENDENTE no MP`)

    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      // Pagamento rejeitado/cancelado
      await supabase
        .from('notificacoes').insert({
          titulo: '❌ Pagamento recusado',
          mensagem: `Pagamento via Mercado Pago foi recusado ou cancelado.`,
          lida: false,
          venda_id: vendaId,
        })

      console.log(`❌ Venda ${vendaId} com pagamento RECUSADO no MP (status: ${mpStatus})`)
    }

    // Responde 200 para o MP saber que recebemos ok
    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro no webhook MP:', error)
    // Retorna 200 mesmo em erro para MP não retentar indefinidamente
    return NextResponse.json({ ok: true })
  }
}

// MP às vezes faz GET para validar a URL do webhook
export async function GET() {
  return NextResponse.json({ ok: true, service: 'Galinhas PC Webhook' })
}