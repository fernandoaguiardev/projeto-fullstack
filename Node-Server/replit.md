# Workspace — EstoquePRO

## Visão Geral

Sistema de Controle de Estoque (Projeto Integrador Full Stack).
pnpm workspace monorepo com TypeScript. Cada pacote gerencia suas próprias dependências.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: v24
- **TypeScript**: 5.9
- **API framework**: Express 5
- **Banco de dados**: PostgreSQL + Drizzle ORM
- **Validação**: Zod (zod/v4), drizzle-zod
- **Codegen de API**: Orval (a partir da spec OpenAPI)
- **Build**: esbuild (bundle CJS)
- **Frontend**: React + Vite

## Artefatos

- `artifacts/api-server` — Servidor REST Express 5 (path: `/api`)
- `artifacts/web` — Frontend React + Vite (path: `/`)

## Entidades do Sistema

### Fornecedor
Campos: nomeEmpresa, cnpj (único), endereco, telefone, email, contatoPrincipal

### Produto
Campos: nome, codigoBarras (único, opcional), descricao, quantidadeEstoque, categoria, dataValidade, imagemUrl

### Associação Produto-Fornecedor
Tabela many-to-many: produto_id ↔ fornecedor_id

## Endpoints da API

### Health
- `GET /api/healthz` — Health check

### Fornecedores
- `GET /api/fornecedores` — Listar fornecedores
- `POST /api/fornecedores` — Cadastrar fornecedor (409 se CNPJ duplicado)
- `GET /api/fornecedores/:id` — Buscar fornecedor
- `PUT /api/fornecedores/:id` — Atualizar fornecedor
- `DELETE /api/fornecedores/:id` — Excluir fornecedor

### Produtos
- `GET /api/produtos` — Listar produtos (filtro: ?categoria=)
- `POST /api/produtos` — Cadastrar produto (409 se código de barras duplicado)
- `GET /api/produtos/stats` — Estatísticas do estoque
- `GET /api/produtos/:id` — Buscar produto com fornecedores associados
- `PUT /api/produtos/:id` — Atualizar produto
- `DELETE /api/produtos/:id` — Excluir produto
- `POST /api/produtos/:id/fornecedores` — Associar fornecedor ao produto
- `DELETE /api/produtos/:id/fornecedores/:fornecedorId` — Desassociar fornecedor

## Páginas do Frontend

- `/` — Dashboard com estatísticas e produtos recentes
- `/produtos` — Lista de produtos com filtro por categoria
- `/produtos/novo` — Cadastro de produto
- `/produtos/:id` — Detalhes do produto com associação de fornecedores
- `/produtos/:id/editar` — Edição de produto
- `/fornecedores` — Lista de fornecedores
- `/fornecedores/novo` — Cadastro de fornecedor
- `/fornecedores/:id/editar` — Edição de fornecedor

## Comandos Principais

- `pnpm run typecheck` — typecheck completo
- `pnpm run build` — build de todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e schemas Zod
- `pnpm --filter @workspace/api-server run dev` — rodar API localmente
- `pnpm --filter @workspace/web run dev` — rodar frontend localmente
