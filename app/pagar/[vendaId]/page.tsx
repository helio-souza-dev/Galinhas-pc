'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface PixData {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  valor: number
  clienteNome: string
  expiresAt?: string
}

export default function PagarPage() {
  const params = useParams()
  const vendaId = params.vendaId as string

  const [pix, setPix] = useState<PixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [pago, setPago] = useState(false)

  const gerarPix = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/mercadopago/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao gerar PIX')
      }

      const data = await res.json()
      setPix(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }, [vendaId])

  useEffect(() => {
    if (vendaId) gerarPix()
  }, [vendaId, gerarPix])

  // Polling para verificar se foi pago
  useEffect(() => {
    if (!pix || pago) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/status-pix?paymentId=${pix.paymentId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'approved') {
            setPago(true)
            clearInterval(interval)
          }
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [pix, pago])

  const copiar = async () => {
    if (!pix?.qrCode) return
    await navigator.clipboard.writeText(pix.qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  const formatarValor = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (pago) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.pagoIcon}>✅</div>
          <h1 style={styles.pagoTitulo}>Pagamento confirmado!</h1>
          <p style={styles.pagoSub}>Obrigado! Seu pedido foi recebido.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🐔</div>
          <h1 style={styles.titulo}>Galinhas PC</h1>
          <p style={styles.sub}>Pagamento via PIX</p>
        </div>

        {loading && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Gerando QR Code PIX...</p>
          </div>
        )}

        {erro && (
          <div style={styles.erroBox}>
            <p style={styles.erroText}>⚠️ {erro}</p>
            <button style={styles.btnRetentar} onClick={gerarPix}>
              Tentar novamente
            </button>
          </div>
        )}

        {pix && !loading && (
          <>
            {/* Valor */}
            <div style={styles.valorBox}>
              <span style={styles.valorLabel}>Total a pagar</span>
              <span style={styles.valor}>{formatarValor(pix.valor)}</span>
              {pix.clienteNome && (
                <span style={styles.cliente}>para {pix.clienteNome}</span>
              )}
            </div>

            {/* QR Code */}
            <div style={styles.qrBox}>
              {pix.qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${pix.qrCodeBase64}`}
                  alt="QR Code PIX"
                  style={styles.qrImage}
                />
              ) : (
                <div style={styles.qrPlaceholder}>
                  <span style={{ fontSize: 48 }}>📱</span>
                  <p style={{ color: '#888', margin: '8px 0 0' }}>QR Code gerado</p>
                </div>
              )}
            </div>

            {/* Instruções */}
            <ol style={styles.instrucoes}>
              <li>Abra o app do seu banco</li>
              <li>Acesse a área <strong>PIX</strong></li>
              <li>Escaneie o QR Code acima <strong>ou</strong> copie o código</li>
              <li>Confirme o pagamento</li>
            </ol>

            {/* Botão copiar */}
            <button
              style={copiado ? { ...styles.btnCopiar, ...styles.btnCopiado } : styles.btnCopiar}
              onClick={copiar}
            >
              {copiado ? '✅ Código copiado!' : '📋 Copiar código PIX'}
            </button>

            {/* Código PIX (truncado) */}
            <div style={styles.codigoBox}>
              <p style={styles.codigoTexto}>
                {pix.qrCode.substring(0, 60)}...
              </p>
            </div>

            <p style={styles.aguardando}>
              ⏳ Aguardando confirmação do pagamento...
            </p>
          </>
        )}

        <p style={styles.footer}>Pagamento processado com segurança pelo Mercado Pago</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '32px 24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '24px',
  },
  logo: {
    fontSize: '48px',
    lineHeight: 1,
    marginBottom: '8px',
  },
  titulo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#166534',
  },
  sub: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  valorBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  valorLabel: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  valor: {
    fontSize: '32px',
    fontWeight: 800,
    color: '#166534',
    letterSpacing: '-0.02em',
  },
  cliente: {
    fontSize: '13px',
    color: '#6b7280',
  },
  qrBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    padding: '12px',
    border: '2px solid #d1fae5',
    borderRadius: '12px',
  },
  qrImage: {
    width: '200px',
    height: '200px',
    borderRadius: '8px',
  },
  qrPlaceholder: {
    width: '200px',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  instrucoes: {
    textAlign: 'left',
    fontSize: '14px',
    color: '#374151',
    paddingLeft: '20px',
    marginBottom: '20px',
    lineHeight: '2',
  },
  btnCopiar: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background-color 0.2s',
  },
  btnCopiado: {
    backgroundColor: '#15803d',
  },
  codigoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
  },
  codigoTexto: {
    margin: 0,
    fontSize: '11px',
    color: '#9ca3af',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
  },
  aguardando: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  footer: {
    fontSize: '11px',
    color: '#d1d5db',
    marginTop: '8px',
  },
  loadingBox: {
    padding: '40px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #d1fae5',
    borderTop: '3px solid #16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
  },
  erroBox: {
    padding: '24px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  erroText: {
    color: '#dc2626',
    margin: '0 0 12px',
    fontSize: '14px',
  },
  btnRetentar: {
    padding: '8px 20px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pagoIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  pagoTitulo: {
    color: '#166534',
    fontSize: '24px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  pagoSub: {
    color: '#6b7280',
    fontSize: '15px',
    margin: 0,
  },
}