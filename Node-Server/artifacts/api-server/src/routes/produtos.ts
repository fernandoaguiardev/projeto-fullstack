import { Router, type IRouter } from "express";
import { eq, count, lt, sql } from "drizzle-orm";
import { db, produtosTable, fornecedoresTable, produtoFornecedorTable } from "@workspace/db";
import {
  CreateProdutoBody,
  GetProdutoParams,
  GetProdutoResponse,
  UpdateProdutoParams,
  UpdateProdutoBody,
  UpdateProdutoResponse,
  DeleteProdutoParams,
  ListProdutosQueryParams,
  ListProdutosResponse,
  AssociarFornecedorParams,
  AssociarFornecedorBody,
  DesassociarFornecedorParams,
  DesassociarFornecedorResponse,
  GetProdutoStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const produtoToDto = (p: typeof produtosTable.$inferSelect) => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
  dataValidade: p.dataValidade ?? null,
  codigoBarras: p.codigoBarras ?? null,
  imagemUrl: p.imagemUrl ?? null,
});

const fornecedorToDto = (f: typeof fornecedoresTable.$inferSelect) => ({
  ...f,
  createdAt: f.createdAt.toISOString(),
});

async function getProdutoComFornecedores(id: number) {
  const [produto] = await db
    .select()
    .from(produtosTable)
    .where(eq(produtosTable.id, id));

  if (!produto) return null;

  const fornecedores = await db
    .select({ fornecedor: fornecedoresTable })
    .from(produtoFornecedorTable)
    .innerJoin(fornecedoresTable, eq(produtoFornecedorTable.fornecedorId, fornecedoresTable.id))
    .where(eq(produtoFornecedorTable.produtoId, id));

  return {
    ...produtoToDto(produto),
    fornecedores: fornecedores.map((r) => fornecedorToDto(r.fornecedor)),
  };
}

router.get("/produtos/stats", async (_req, res): Promise<void> => {
  const [totalProd] = await db.select({ count: count() }).from(produtosTable);
  const [totalForn] = await db.select({ count: count() }).from(fornecedoresTable);
  const [baixo] = await db
    .select({ count: count() })
    .from(produtosTable)
    .where(lt(produtosTable.quantidadeEstoque, 10));
  const cats = await db
    .selectDistinct({ categoria: produtosTable.categoria })
    .from(produtosTable);

  res.json(
    GetProdutoStatsResponse.parse({
      totalProdutos: totalProd?.count ?? 0,
      totalFornecedores: totalForn?.count ?? 0,
      produtosEstoqueBaixo: baixo?.count ?? 0,
      categorias: cats.length,
    }),
  );
});

router.get("/produtos", async (req, res): Promise<void> => {
  const parsed = ListProdutosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const query = db.select().from(produtosTable);
  const produtos = parsed.data.categoria
    ? await query.where(eq(produtosTable.categoria, parsed.data.categoria))
    : await query.orderBy(produtosTable.nome);

  res.json(ListProdutosResponse.parse(produtos.map(produtoToDto)));
});

router.post("/produtos", async (req, res): Promise<void> => {
  const parsed = CreateProdutoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.codigoBarras) {
    const existing = await db
      .select()
      .from(produtosTable)
      .where(eq(produtosTable.codigoBarras, parsed.data.codigoBarras));
    if (existing.length > 0) {
      res.status(409).json({ error: "Produto com este código de barras já está cadastrado!" });
      return;
    }
  }

  const [produto] = await db
    .insert(produtosTable)
    .values({
      nome: parsed.data.nome,
      codigoBarras: parsed.data.codigoBarras ?? null,
      descricao: parsed.data.descricao,
      quantidadeEstoque: parsed.data.quantidadeEstoque ?? 0,
      categoria: parsed.data.categoria,
      dataValidade: parsed.data.dataValidade ?? null,
      imagemUrl: parsed.data.imagemUrl ?? null,
    })
    .returning();

  const result = await getProdutoComFornecedores(produto.id);
  res.status(201).json(GetProdutoResponse.parse(result));
});

router.get("/produtos/:id", async (req, res): Promise<void> => {
  const params = GetProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await getProdutoComFornecedores(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.json(GetProdutoResponse.parse(result));
});

router.put("/produtos/:id", async (req, res): Promise<void> => {
  const params = UpdateProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProdutoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.codigoBarras) {
    const existing = await db
      .select()
      .from(produtosTable)
      .where(eq(produtosTable.codigoBarras, parsed.data.codigoBarras));
    if (existing.length > 0 && existing[0].id !== params.data.id) {
      res.status(409).json({ error: "Produto com este código de barras já está cadastrado!" });
      return;
    }
  }

  const [produto] = await db
    .update(produtosTable)
    .set({
      nome: parsed.data.nome,
      codigoBarras: parsed.data.codigoBarras ?? null,
      descricao: parsed.data.descricao,
      quantidadeEstoque: parsed.data.quantidadeEstoque ?? 0,
      categoria: parsed.data.categoria,
      dataValidade: parsed.data.dataValidade ?? null,
      imagemUrl: parsed.data.imagemUrl ?? null,
    })
    .where(eq(produtosTable.id, params.data.id))
    .returning();

  if (!produto) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.json(UpdateProdutoResponse.parse(produtoToDto(produto)));
});

router.delete("/produtos/:id", async (req, res): Promise<void> => {
  const params = DeleteProdutoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [produto] = await db
    .delete(produtosTable)
    .where(eq(produtosTable.id, params.data.id))
    .returning();

  if (!produto) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.sendStatus(204);
});

router.post("/produtos/:id/fornecedores", async (req, res): Promise<void> => {
  const params = AssociarFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssociarFornecedorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [produto] = await db
    .select()
    .from(produtosTable)
    .where(eq(produtosTable.id, params.data.id));
  if (!produto) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, parsed.data.fornecedorId));
  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado" });
    return;
  }

  const existing = await db
    .select()
    .from(produtoFornecedorTable)
    .where(
      sql`${produtoFornecedorTable.produtoId} = ${params.data.id} AND ${produtoFornecedorTable.fornecedorId} = ${parsed.data.fornecedorId}`,
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Fornecedor já está associado a este produto!" });
    return;
  }

  await db.insert(produtoFornecedorTable).values({
    produtoId: params.data.id,
    fornecedorId: parsed.data.fornecedorId,
  });

  const result = await getProdutoComFornecedores(params.data.id);
  res.status(201).json(result);
});

router.delete("/produtos/:id/fornecedores/:fornecedorId", async (req, res): Promise<void> => {
  const params = DesassociarFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(produtoFornecedorTable)
    .where(
      sql`${produtoFornecedorTable.produtoId} = ${params.data.id} AND ${produtoFornecedorTable.fornecedorId} = ${params.data.fornecedorId}`,
    )
    .returning();

  if (!row) {
    res.status(404).json({ error: "Associação não encontrada" });
    return;
  }

  const result = await getProdutoComFornecedores(params.data.id);
  res.json(DesassociarFornecedorResponse.parse(result));
});

export default router;
