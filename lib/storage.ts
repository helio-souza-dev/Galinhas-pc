import { createClient } from '@/lib/supabase/client'
import { Cliente, Produto, Venda, ItemVenda, Pagamento, MovimentacaoEstoque } from './types'

// Supabase client (browser)
function getSupabase() {
  return createClient()
}

// ==================== CLIENTES ====================

export async function getClientes(): Promise<Cliente[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }
  
  return data.map(mapClienteFromDB)
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return mapClienteFromDB(data)
}

export async function addCliente(cliente: Omit<Cliente, 'id' | 'createdAt'>): Promise<Cliente> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: cliente.nome,
      telefone: cliente.telefone || null,
      endereco: cliente.endereco || null,
      cidade: cliente.cidade || null,
      bairro: cliente.bairro || null,
      referencia: cliente.referencia || null,
      observacoes: cliente.observacoes || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Erro ao adicionar cliente: ${error.message}`)
  return mapClienteFromDB(data)
}

export async function updateCliente(id: string, updates: Partial<Cliente>): Promise<Cliente | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nome: updates.nome,
      telefone: updates.telefone,
      endereco: updates.endereco,
      cidade: updates.cidade,
      bairro: updates.bairro,
      referencia: updates.referencia,
      observacoes: updates.observacoes,
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  return mapClienteFromDB(data)
}

export async function deleteCliente(id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id)
  
  return !error
}

// ==================== PRODUTOS ====================

export async function getProdutos(): Promise<Produto[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome')
  
  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return []
  }
  
  return data.map(mapProdutoFromDB)
}

export async function getProdutoById(id: string): Promise<Produto | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return mapProdutoFromDB(data)
}

export async function addProduto(produto: Omit<Produto, 'id' | 'createdAt'>): Promise<Produto> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome: produto.nome,
      tipo: produto.tipo,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      preco: produto.preco,
      estoque: produto.estoque,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Erro ao adicionar produto: ${error.message}`)
  return mapProdutoFromDB(data)
}

export async function updateProduto(id: string, updates: Partial<Produto>): Promise<Produto | null> {
  const supabase = getSupabase()
  
  const updateData: Record<string, unknown> = {}
  if (updates.nome !== undefined) updateData.nome = updates.nome
  if (updates.tipo !== undefined) updateData.tipo = updates.tipo
  if (updates.unidade !== undefined) updateData.unidade = updates.unidade
  if (updates.quantidade !== undefined) updateData.quantidade = updates.quantidade
  if (updates.preco !== undefined) updateData.preco = updates.preco
  if (updates.estoque !== undefined) updateData.estoque = updates.estoque
  
  const { data, error } = await supabase
    .from('produtos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  return mapProdutoFromDB(data)
}

export async function deleteProduto(id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id)
  
  return !error
}

// ==================== VENDAS ====================

export async function getVendas(): Promise<Venda[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar vendas:', error)
    return []
  }
  
  // Buscar itens de cada venda
  const vendas = await Promise.all(
    data.map(async (venda) => {
      const { data: itens } = await supabase
        .from('itens_venda')
        .select('*')
        .eq('venda_id', venda.id)
      
      return mapVendaFromDB(venda, itens || [])
    })
  )
  
  return vendas
}

export async function getVendaById(id: string): Promise<Venda | null> {
  const supabase = getSupabase()
  const { data: venda, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  
  const { data: itens } = await supabase
    .from('itens_venda')
    .select('*')
    .eq('venda_id', id)
  
  return mapVendaFromDB(venda, itens || [])
}

export async function getVendasByClienteId(clienteId: string): Promise<Venda[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  
  if (error) return []
  
  const vendas = await Promise.all(
    data.map(async (venda) => {
      const { data: itens } = await supabase
        .from('itens_venda')
        .select('*')
        .eq('venda_id', venda.id)
      
      return mapVendaFromDB(venda, itens || [])
    })
  )
  
  return vendas
}

export async function addVenda(venda: Omit<Venda, 'id' | 'createdAt'>): Promise<Venda> {
  const supabase = getSupabase()
  
  // Criar a venda
  const { data: vendaData, error: vendaError } = await supabase
    .from('vendas')
    .insert({
      cliente_id: venda.clienteId || null,
      cliente_nome: venda.clienteNome,
      subtotal: venda.subtotal,
      frete: venda.frete,
      total: venda.total,
      forma_pagamento: venda.formaPagamento,
      status: venda.status,
      valor_pago: venda.valorPago,
      observacoes: venda.observacoes || null,
    })
    .select()
    .single()
  
  if (vendaError) throw new Error(`Erro ao adicionar venda: ${vendaError.message}`)
  
  // Criar itens da venda
  const itensToInsert = venda.itens.map(item => ({
    venda_id: vendaData.id,
    produto_id: item.produtoId || null,
    produto_nome: item.produtoNome,
    quantidade: item.quantidade,
    preco_unitario: item.precoUnitario,
    subtotal: item.subtotal,
  }))
  
  const { data: itensData, error: itensError } = await supabase
    .from('itens_venda')
    .insert(itensToInsert)
    .select()
  
  if (itensError) {
    console.error('Erro ao adicionar itens:', itensError)
  }
  
  // Atualizar estoque e criar movimentacoes
  for (const item of venda.itens) {
    if (item.produtoId) {
      // Buscar produto atual
      const { data: produto } = await supabase
        .from('produtos')
        .select('estoque')
        .eq('id', item.produtoId)
        .single()
      
      if (produto) {
        // Atualizar estoque
        await supabase
          .from('produtos')
          .update({ estoque: produto.estoque - item.quantidade })
          .eq('id', item.produtoId)
        
        // Criar movimentacao
        await supabase
          .from('movimentacoes_estoque')
          .insert({
            produto_id: item.produtoId,
            produto_nome: item.produtoNome,
            tipo: 'saida',
            quantidade: item.quantidade,
            motivo: `Venda #${vendaData.id.slice(-6)}`,
          })
      }
    }
  }
  
  return mapVendaFromDB(vendaData, itensData || [])
}

export async function updateVenda(id: string, updates: Partial<Venda>): Promise<Venda | null> {
  const supabase = getSupabase()
  
  const updateData: Record<string, unknown> = {}
  if (updates.status !== undefined) updateData.status = updates.status
  if (updates.valorPago !== undefined) updateData.valor_pago = updates.valorPago
  if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes
  
  const { data, error } = await supabase
    .from('vendas')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return null
  
  const { data: itens } = await supabase
    .from('itens_venda')
    .select('*')
    .eq('venda_id', id)
  
  return mapVendaFromDB(data, itens || [])
}

export async function deleteVenda(id: string): Promise<boolean> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('vendas')
    .delete()
    .eq('id', id)
  
  return !error
}

// ==================== PAGAMENTOS ====================

export async function getPagamentos(): Promise<Pagamento[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('pagamentos')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data.map(mapPagamentoFromDB)
}

export async function getPagamentosByVendaId(vendaId: string): Promise<Pagamento[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('pagamentos')
    .select('*')
    .eq('venda_id', vendaId)
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data.map(mapPagamentoFromDB)
}

export async function addPagamento(pagamento: Omit<Pagamento, 'id' | 'createdAt'>): Promise<Pagamento> {
  const supabase = getSupabase()
  
  // Inserir pagamento
  const { data, error } = await supabase
    .from('pagamentos')
    .insert({
      venda_id: pagamento.vendaId,
      valor: pagamento.valor,
      forma_pagamento: pagamento.formaPagamento,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Erro ao adicionar pagamento: ${error.message}`)
  
  // Atualizar valor pago da venda
  const { data: venda } = await supabase
    .from('vendas')
    .select('valor_pago, total')
    .eq('id', pagamento.vendaId)
    .single()
  
  if (venda) {
    const novoValorPago = Number(venda.valor_pago) + pagamento.valor
    let novoStatus: 'pendente' | 'parcial' | 'pago' = 'parcial'
    if (novoValorPago >= Number(venda.total)) {
      novoStatus = 'pago'
    } else if (novoValorPago === 0) {
      novoStatus = 'pendente'
    }
    
    await supabase
      .from('vendas')
      .update({ valor_pago: novoValorPago, status: novoStatus })
      .eq('id', pagamento.vendaId)
  }
  
  return mapPagamentoFromDB(data)
}

// ==================== MOVIMENTACOES ====================

export async function getMovimentacoes(): Promise<MovimentacaoEstoque[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data.map(mapMovimentacaoFromDB)
}

export async function addMovimentacao(movimentacao: Omit<MovimentacaoEstoque, 'id' | 'createdAt'>): Promise<MovimentacaoEstoque> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .insert({
      produto_id: movimentacao.produtoId || null,
      produto_nome: movimentacao.produtoNome,
      tipo: movimentacao.tipo,
      quantidade: movimentacao.quantidade,
      motivo: movimentacao.motivo || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Erro ao adicionar movimentacao: ${error.message}`)
  
  // Atualizar estoque do produto
  if (movimentacao.produtoId) {
    const { data: produto } = await supabase
      .from('produtos')
      .select('estoque')
      .eq('id', movimentacao.produtoId)
      .single()
    
    if (produto) {
      const novoEstoque = movimentacao.tipo === 'entrada'
        ? produto.estoque + movimentacao.quantidade
        : produto.estoque - movimentacao.quantidade
      
      await supabase
        .from('produtos')
        .update({ estoque: novoEstoque })
        .eq('id', movimentacao.produtoId)
    }
  }
  
  return mapMovimentacaoFromDB(data)
}

// ==================== MAPEADORES ====================

function mapClienteFromDB(data: Record<string, unknown>): Cliente {
  return {
    id: data.id as string,
    nome: data.nome as string,
    telefone: (data.telefone as string) || '',
    endereco: (data.endereco as string) || '',
    cidade: (data.cidade as string) || '',
    bairro: (data.bairro as string) || '',
    referencia: (data.referencia as string) || undefined,
    observacoes: (data.observacoes as string) || undefined,
    createdAt: data.created_at as string,
  }
}

function mapProdutoFromDB(data: Record<string, unknown>): Produto {
  return {
    id: data.id as string,
    nome: data.nome as string,
    tipo: data.tipo as 'ovos' | 'galinha',
    unidade: data.unidade as 'duzia' | 'cartela' | 'unidade',
    quantidade: Number(data.quantidade),
    preco: Number(data.preco),
    estoque: Number(data.estoque),
    createdAt: data.created_at as string,
  }
}

function mapVendaFromDB(venda: Record<string, unknown>, itens: Record<string, unknown>[]): Venda {
  return {
    id: venda.id as string,
    clienteId: (venda.cliente_id as string) || '',
    clienteNome: venda.cliente_nome as string,
    itens: itens.map(mapItemVendaFromDB),
    subtotal: Number(venda.subtotal),
    frete: Number(venda.frete),
    total: Number(venda.total),
    formaPagamento: venda.forma_pagamento as 'dinheiro' | 'pix' | 'cartao' | 'fiado',
    status: venda.status as 'pendente' | 'pago' | 'parcial',
    valorPago: Number(venda.valor_pago),
    observacoes: (venda.observacoes as string) || undefined,
    createdAt: venda.created_at as string,
  }
}

function mapItemVendaFromDB(data: Record<string, unknown>): ItemVenda {
  return {
    produtoId: (data.produto_id as string) || '',
    produtoNome: data.produto_nome as string,
    quantidade: Number(data.quantidade),
    precoUnitario: Number(data.preco_unitario),
    subtotal: Number(data.subtotal),
  }
}

function mapPagamentoFromDB(data: Record<string, unknown>): Pagamento {
  return {
    id: data.id as string,
    vendaId: data.venda_id as string,
    valor: Number(data.valor),
    formaPagamento: data.forma_pagamento as 'dinheiro' | 'pix' | 'cartao',
    createdAt: data.created_at as string,
  }
}

function mapMovimentacaoFromDB(data: Record<string, unknown>): MovimentacaoEstoque {
  return {
    id: data.id as string,
    produtoId: (data.produto_id as string) || '',
    produtoNome: data.produto_nome as string,
    tipo: data.tipo as 'entrada' | 'saida',
    quantidade: Number(data.quantidade),
    motivo: (data.motivo as string) || '',
    createdAt: data.created_at as string,
  }
}

// ==================== UTILITARIOS ====================

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

// Adicione no final do arquivo lib/storage.ts
export async function atualizarStatusEntrega(vendaId: string, novoStatus: 'pendente' | 'preparando' | 'em_rota' | 'entregue') {
  const { error } = await supabase
    .from('vendas')
    .update({ status_entrega: novoStatus })
    .eq('id', vendaId);

  if (error) {
    console.error('Erro ao atualizar status de entrega:', error);
    throw new Error('Falha ao atualizar status de entrega');
  }
  
  return true;
}

