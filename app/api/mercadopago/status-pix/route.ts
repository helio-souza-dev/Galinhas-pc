import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('paymentId')

  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId ausente' }, { status: 400 })
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao consultar pagamento' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ status: data.status })
}