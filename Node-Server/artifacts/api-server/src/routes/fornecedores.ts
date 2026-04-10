import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fornecedoresTable } from "@workspace/db";
import {
  CreateFornecedorBody,
  GetFornecedorParams,
  GetFornecedorResponse,
  UpdateFornecedorParams,
  UpdateFornecedorBody,
  UpdateFornecedorResponse,
  DeleteFornecedorParams,
  ListFornecedoresResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toDto = (f: typeof fornecedoresTable.$inferSelect) => ({
  ...f,
  createdAt: f.createdAt.toISOString(),
});

router.get("/fornecedores", async (_req, res): Promise<void> => {
  const fornecedores = await db
    .select()
    .from(fornecedoresTable)
    .orderBy(fornecedoresTable.nomeEmpresa);
  res.json(ListFornecedoresResponse.parse(fornecedores.map(toDto)));
});

router.post("/fornecedores", async (req, res): Promise<void> => {
  const parsed = CreateFornecedorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.cnpj, parsed.data.cnpj));

  if (existing.length > 0) {
    res.status(409).json({ error: "Fornecedor com esse CNPJ já está cadastrado!" });
    return;
  }

  const [fornecedor] = await db
    .insert(fornecedoresTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(GetFornecedorResponse.parse(toDto(fornecedor)));
});

router.get("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = GetFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fornecedor] = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.id, params.data.id));

  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado" });
    return;
  }

  res.json(GetFornecedorResponse.parse(toDto(fornecedor)));
});

router.put("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = UpdateFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFornecedorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(fornecedoresTable)
    .where(eq(fornecedoresTable.cnpj, parsed.data.cnpj));

  if (existing.length > 0 && existing[0].id !== params.data.id) {
    res.status(409).json({ error: "Fornecedor com esse CNPJ já está cadastrado!" });
    return;
  }

  const [fornecedor] = await db
    .update(fornecedoresTable)
    .set(parsed.data)
    .where(eq(fornecedoresTable.id, params.data.id))
    .returning();

  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado" });
    return;
  }

  res.json(UpdateFornecedorResponse.parse(toDto(fornecedor)));
});

router.delete("/fornecedores/:id", async (req, res): Promise<void> => {
  const params = DeleteFornecedorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fornecedor] = await db
    .delete(fornecedoresTable)
    .where(eq(fornecedoresTable.id, params.data.id))
    .returning();

  if (!fornecedor) {
    res.status(404).json({ error: "Fornecedor não encontrado" });
    return;
  }

  res.sendStatus(204);
});

export default router;
