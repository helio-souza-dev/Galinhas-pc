export interface Cliente {
  id: string
  nome: string
  telefone: string
  endereco: string
  cidade: string
  bairro: string
  referencia?: string
  observacoes?: string
  createdAt: string
}

export interface Produto {
  id: string
  nome: string
  tipo: 'ovos' | 'galinha'
  unidade: 'duzia' | 'cartela' | 'unidade'
  quantidade: number // quantidade por unidade (12 para duzia, 30 para cartela, 1 para unidade)
  preco: number
  estoque: number
  createdAt: string
}

export interface ItemVenda {
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitario: number
  subtotal: number
}

export interface Venda {
  id: string
  clienteId: string
  clienteNome: string
  itens: ItemVenda[]
  subtotal: number
  frete: number
  total: number
  formaPagamento: 'dinheiro' | 'pix' | 'cartao' | 'fiado'
  status: 'pendente' | 'pago' | 'parcial' // Status do pagamento
  valorPago: number
  observacoes?: string
  tipoVenda: 'retirada' | 'entrega' // 'retirada' para o que já foi entregue na hora
  dataEntrega?: string
  statusEntrega?: 'pendente' | 'preparando' | 'em_rota' | 'entregue'
  createdAt: string
  
}

// Adicione a interface Notificacao
export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  lida: boolean
  vendaId?: string
  createdAt: string
}

export interface Pagamento {
  id: string
  vendaId: string
  valor: number
  formaPagamento: 'dinheiro' | 'pix' | 'cartao'
  createdAt: string
}

export interface MovimentacaoEstoque {
  id: string
  produtoId: string
  produtoNome: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  motivo: string
  createdAt: string
}
