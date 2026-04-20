import { Cliente, Produto, Venda, Pagamento, MovimentacaoEstoque } from './types'

const STORAGE_KEYS = {
  clientes: 'granja_clientes',
  produtos: 'granja_produtos',
  vendas: 'granja_vendas',
  pagamentos: 'granja_pagamentos',
  movimentacoes: 'granja_movimentacoes',
}

function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Clientes
export function getClientes(): Cliente[] {
  return getItem<Cliente>(STORAGE_KEYS.clientes)
}

export function addCliente(cliente: Omit<Cliente, 'id' | 'createdAt'>): Cliente {
  const clientes = getClientes()
  const novoCliente: Cliente = {
    ...cliente,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  clientes.push(novoCliente)
  setItem(STORAGE_KEYS.clientes, clientes)
  return novoCliente
}

export function updateCliente(id: string, data: Partial<Cliente>): Cliente | null {
  const clientes = getClientes()
  const index = clientes.findIndex(c => c.id === id)
  if (index === -1) return null
  clientes[index] = { ...clientes[index], ...data }
  setItem(STORAGE_KEYS.clientes, clientes)
  return clientes[index]
}

export function deleteCliente(id: string): boolean {
  const clientes = getClientes()
  const filtered = clientes.filter(c => c.id !== id)
  if (filtered.length === clientes.length) return false
  setItem(STORAGE_KEYS.clientes, filtered)
  return true
}

// Produtos
export function getProdutos(): Produto[] {
  return getItem<Produto>(STORAGE_KEYS.produtos)
}

export function addProduto(produto: Omit<Produto, 'id' | 'createdAt'>): Produto {
  const produtos = getProdutos()
  const novoProduto: Produto = {
    ...produto,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  produtos.push(novoProduto)
  setItem(STORAGE_KEYS.produtos, produtos)
  return novoProduto
}

export function updateProduto(id: string, data: Partial<Produto>): Produto | null {
  const produtos = getProdutos()
  const index = produtos.findIndex(p => p.id === id)
  if (index === -1) return null
  produtos[index] = { ...produtos[index], ...data }
  setItem(STORAGE_KEYS.produtos, produtos)
  return produtos[index]
}

export function deleteProduto(id: string): boolean {
  const produtos = getProdutos()
  const filtered = produtos.filter(p => p.id !== id)
  if (filtered.length === produtos.length) return false
  setItem(STORAGE_KEYS.produtos, filtered)
  return true
}

// Vendas
export function getVendas(): Venda[] {
  return getItem<Venda>(STORAGE_KEYS.vendas)
}

export function addVenda(venda: Omit<Venda, 'id' | 'createdAt'>): Venda {
  const vendas = getVendas()
  const novaVenda: Venda = {
    ...venda,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  vendas.push(novaVenda)
  setItem(STORAGE_KEYS.vendas, vendas)
  
  // Atualizar estoque
  venda.itens.forEach(item => {
    const produtos = getProdutos()
    const produto = produtos.find(p => p.id === item.produtoId)
    if (produto) {
      updateProduto(produto.id, { estoque: produto.estoque - item.quantidade })
      addMovimentacao({
        produtoId: produto.id,
        produtoNome: produto.nome,
        tipo: 'saida',
        quantidade: item.quantidade,
        motivo: `Venda #${novaVenda.id.slice(-6)}`,
      })
    }
  })
  
  return novaVenda
}

export function updateVenda(id: string, data: Partial<Venda>): Venda | null {
  const vendas = getVendas()
  const index = vendas.findIndex(v => v.id === id)
  if (index === -1) return null
  vendas[index] = { ...vendas[index], ...data }
  setItem(STORAGE_KEYS.vendas, vendas)
  return vendas[index]
}

export function deleteVenda(id: string): boolean {
  const vendas = getVendas()
  const filtered = vendas.filter(v => v.id !== id)
  if (filtered.length === vendas.length) return false
  setItem(STORAGE_KEYS.vendas, filtered)
  return true
}

// Pagamentos
export function getPagamentos(): Pagamento[] {
  return getItem<Pagamento>(STORAGE_KEYS.pagamentos)
}

export function addPagamento(pagamento: Omit<Pagamento, 'id' | 'createdAt'>): Pagamento {
  const pagamentos = getPagamentos()
  const novoPagamento: Pagamento = {
    ...pagamento,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  pagamentos.push(novoPagamento)
  setItem(STORAGE_KEYS.pagamentos, pagamentos)
  
  // Atualizar valor pago da venda
  const vendas = getVendas()
  const venda = vendas.find(v => v.id === pagamento.vendaId)
  if (venda) {
    const novoValorPago = venda.valorPago + pagamento.valor
    let novoStatus: Venda['status'] = 'parcial'
    if (novoValorPago >= venda.total) {
      novoStatus = 'pago'
    } else if (novoValorPago === 0) {
      novoStatus = 'pendente'
    }
    updateVenda(venda.id, { valorPago: novoValorPago, status: novoStatus })
  }
  
  return novoPagamento
}

// Movimentacoes de Estoque
export function getMovimentacoes(): MovimentacaoEstoque[] {
  return getItem<MovimentacaoEstoque>(STORAGE_KEYS.movimentacoes)
}

export function addMovimentacao(movimentacao: Omit<MovimentacaoEstoque, 'id' | 'createdAt'>): MovimentacaoEstoque {
  const movimentacoes = getMovimentacoes()
  const novaMovimentacao: MovimentacaoEstoque = {
    ...movimentacao,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  movimentacoes.push(novaMovimentacao)
  setItem(STORAGE_KEYS.movimentacoes, movimentacoes)
  return novaMovimentacao
}

// Seed dados iniciais
export function seedInitialData(): void {
  if (typeof window === 'undefined') return
  
  // Verificar se ja tem dados
  if (getProdutos().length > 0) return
  
  // Produtos iniciais
  const produtosIniciais: Omit<Produto, 'id' | 'createdAt'>[] = [
    { nome: 'Ovos - Duzia', tipo: 'ovos', unidade: 'duzia', quantidade: 12, preco: 12, estoque: 50 },
    { nome: 'Ovos - Cartela (30)', tipo: 'ovos', unidade: 'cartela', quantidade: 30, preco: 28, estoque: 20 },
    { nome: 'Galinha Caipira', tipo: 'galinha', unidade: 'unidade', quantidade: 1, preco: 45, estoque: 15 },
  ]
  
  produtosIniciais.forEach(p => addProduto(p))
}

// Utilitarios
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function getGoogleMapsLink(endereco: string, cidade: string, bairro: string): string {
  const query = encodeURIComponent(`${endereco}, ${bairro}, ${cidade}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
