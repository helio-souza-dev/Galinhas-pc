import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import crypto from 'crypto'

function validarAssinatura(
  req: NextRequest,
  dataId: string,
  liveMode: boolean
): boolean {
  // Escolhe o secret correto baseado no ambiente
  const secret = liveMode
    ? process.env.MP_WEBHOOK_SECRET
    : process.env.MP_WEBHOOK_SECRET_TEST

  if (!secret) return true // sem secret configurado, aceita tudo

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')

  if (!xSignature || !xRequestId) return false

  const parts = xSignature.split(',')
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1]
  const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1]

  if (!ts || !hash) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
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

    const { type, data, live_mode } = body
    const paymentId = data?.id

    if (!validarAssinatura(request, String(paymentId), !!live_mode)) {
      console.warn('Webhook MP: assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    if (type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pagamento ausente' }, { status: 400 })
    }

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
      console.warn('Webhook MP: external_reference ausente no pagamento', paymentId)
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    if (mpStatus === 'approved') {
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

      await supabase.from('notificacoes').insert({
        titulo: 'Pagamento confirmado',
        mensagem: `Pagamento de R$ ${valor?.toFixed(2)} confirmado via Mercado Pago.`,
        lida: false,
        venda_id: vendaId,
      })

      console.log(`Venda ${vendaId} marcada como PAGA (payment ${paymentId})`)

    } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
      await supabase
        .from('vendas')
        .update({ status: 'pendente', mp_payment_id: String(paymentId) })
        .eq('id', vendaId)

      console.log(`Venda ${vendaId} com pagamento PENDENTE (payment ${paymentId})`)

    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await supabase.from('notificacoes').insert({
        titulo: 'Pagamento recusado',
        mensagem: 'Pagamento via Mercado Pago foi recusado ou cancelado.',
        lida: false,
        venda_id: vendaId,
      })

      console.log(`Venda ${vendaId} com pagamento RECUSADO (status: ${mpStatus})`)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro no webhook MP:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Ovos Galinha Feliz Webhook' })
}