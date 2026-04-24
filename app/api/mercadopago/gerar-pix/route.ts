import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

export async function POST(request: NextRequest) {
  try {
    const { vendaId } = await request.json()

    if (!vendaId) {
      return NextResponse.json({ error: 'vendaId ausente' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Busca a venda no banco
    const { data: venda, error } = await supabase
      .from('vendas')
      .select('*, itens_venda(*)')
      .eq('id', vendaId)
      .single()

    if (error || !venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'Token MP não configurado' }, { status: 500 })
    }

    // Cria pagamento PIX direto na API do MP (não usa checkout)
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `pix-${vendaId}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(venda.total),
        description: `Pedido Galinhas PC - ${venda.cliente_nome}`,
        payment_method_id: 'pix',
        external_reference: vendaId,
        payer: {
          email: 'cliente@galinhaspc.com', // email genérico pois não temos o do cliente
          first_name: venda.cliente_nome.split(' ')[0],
          last_name: venda.cliente_nome.split(' ').slice(1).join(' ') || 'Cliente',
        },
      }),
    })

    if (!response.ok) {
      const erro = await response.text()
      console.error('Erro MP ao gerar PIX:', erro)
      return NextResponse.json({ error: 'Erro ao gerar PIX no MP' }, { status: 500 })
    }

    const pagamento = await response.json()

    const qrCode = pagamento.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = pagamento.point_of_interaction?.transaction_data?.qr_code_base64

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code não retornado pelo MP' }, { status: 500 })
    }

    // Salva o mp_payment_id na venda
    await supabase
      .from('vendas')
      .update({ mp_payment_id: String(pagamento.id) })
      .eq('id', vendaId)

    return NextResponse.json({
      paymentId: pagamento.id,
      qrCode,
      qrCodeBase64,
      valor: venda.total,
      clienteNome: venda.cliente_nome,
      expiresAt: pagamento.date_of_expiration,
    })
  } catch (error) {
    console.error('Erro ao gerar PIX:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}