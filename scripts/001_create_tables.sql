-- Script de criação das tabelas para o sistema Granja
-- Versão 1.0

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  bairro TEXT,
  referencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ovos', 'galinha')),
  unidade TEXT NOT NULL CHECK (unidade IN ('duzia', 'cartela', 'unidade')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'fiado')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial')),
  valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens da Venda
CREATE TABLE IF NOT EXISTS itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  produto_nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_created ON vendas(created_at);
CREATE INDEX IF NOT EXISTS idx_itens_venda ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_venda ON pagamentos(venda_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_created ON movimentacoes_estoque(created_at);

-- Habilitar RLS (Row Level Security) - desabilitado por padrão para acesso público
-- Caso queira adicionar autenticação no futuro, habilite o RLS

-- Dados iniciais de produtos
INSERT INTO produtos (nome, tipo, unidade, quantidade, preco, estoque)
VALUES 
  ('Ovos - Dúzia', 'ovos', 'duzia', 12, 12.00, 50),
  ('Ovos - Cartela (30)', 'ovos', 'cartela', 30, 28.00, 20),
  ('Galinha Caipira', 'galinha', 'unidade', 1, 45.00, 15)
ON CONFLICT DO NOTHING;
