import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendaId, clienteNome, itens, total, frete } = body

    if (!vendaId || !itens || !total) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'Token do Mercado Pago não configurado' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Monta os itens no formato do Mercado Pago
    const mpItens = itens.map((item: { produtoNome: string; quantidade: number; precoUnitario: number }) => ({
      id: item.produtoNome,
      title: item.produtoNome,
      quantity: item.quantidade,
      unit_price: item.precoUnitario,
      currency_id: 'BRL',
    }))

    // Adiciona o frete como item separado se houver
    if (frete && frete > 0) {
      mpItens.push({
        id: 'frete',
        title: 'Frete',
        quantity: 1,
        unit_price: frete,
        currency_id: 'BRL',
      })
    }

    const preference = {
      items: mpItens,
      payer: {
        name: clienteNome,
      },
      // URLs de retorno após o pagamento
      back_urls: {
        success: `${appUrl}/vendas?mp=sucesso&venda=${vendaId}`,
        failure: `${appUrl}/vendas?mp=falha&venda=${vendaId}`,
        pending: `${appUrl}/vendas?mp=pendente&venda=${vendaId}`,
      },
      auto_return: 'approved',
      // Webhook: MP vai chamar essa URL quando o pagamento for confirmado
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      // Referência externa para identificar a venda no webhook
      external_reference: vendaId,
      // Expira em 24 horas
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      statement_descriptor: 'Galinhas PC',
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }], // só PIX e cartão
        installments: 1, // sem parcelamento
      },
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    })

    if (!response.ok) {
      const erro = await response.text()
      console.error('Erro MP:', erro)
      return NextResponse.json({ error: 'Erro ao criar preferência no Mercado Pago' }, { status: 500 })
    }

    const data = await response.json()

    // Salva o mp_preference_id na venda para rastrear
    const supabase = createClient()
    await supabase
      .from('vendas')
      .update({ mp_preference_id: data.id })
      .eq('id', vendaId)

    return NextResponse.json({
      preferenceId: data.id,
      initPoint: data.init_point,       // URL de pagamento (produção)
      sandboxInitPoint: data.sandbox_init_point, // URL de pagamento (sandbox/teste)
    })
  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}