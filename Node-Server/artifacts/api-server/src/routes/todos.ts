import { Router, type IRouter } from "express";
import { eq, count, and, sql } from "drizzle-orm";
import { db, todosTable } from "@workspace/db";
import {
  ListTodosQueryParams,
  CreateTodoBody,
  GetTodoParams,
  GetTodoResponse,
  UpdateTodoParams,
  UpdateTodoBody,
  UpdateTodoResponse,
  DeleteTodoParams,
  ToggleTodoParams,
  ToggleTodoResponse,
  GetTodoStatsResponse,
  ListTodosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/todos/stats", async (req, res): Promise<void> => {
  const [totalResult] = await db.select({ count: count() }).from(todosTable);
  const [completedResult] = await db
    .select({ count: count() })
    .from(todosTable)
    .where(eq(todosTable.completed, true));
  const [pendingResult] = await db
    .select({ count: count() })
    .from(todosTable)
    .where(eq(todosTable.completed, false));
  const [highPriorityResult] = await db
    .select({ count: count() })
    .from(todosTable)
    .where(and(eq(todosTable.priority, "high"), eq(todosTable.completed, false)));

  const stats = GetTodoStatsResponse.parse({
    total: totalResult?.count ?? 0,
    completed: completedResult?.count ?? 0,
    pending: pendingResult?.count ?? 0,
    highPriority: highPriorityResult?.count ?? 0,
  });

  res.json(stats);
});

router.get("/todos", async (req, res): Promise<void> => {
  const parsed = ListTodosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status } = parsed.data;

  const query = db
    .select()
    .from(todosTable)
    .orderBy(sql`${todosTable.completed} asc, ${todosTable.createdAt} desc`);

  let todos;
  if (status === "completed") {
    todos = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.completed, true))
      .orderBy(sql`${todosTable.createdAt} desc`);
  } else if (status === "pending") {
    todos = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.completed, false))
      .orderBy(sql`${todosTable.createdAt} desc`);
  } else {
    todos = await query;
  }

  res.json(ListTodosResponse.parse(todos.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() }))));
});

router.post("/todos", async (req, res): Promise<void> => {
  const parsed = CreateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [todo] = await db
    .insert(todosTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority ?? "medium",
    })
    .returning();

  res.status(201).json(GetTodoResponse.parse({ ...todo, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() }));
});

router.get("/todos/:id", async (req, res): Promise<void> => {
  const params = GetTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(GetTodoResponse.parse({ ...todo, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() }));
});

router.patch("/todos/:id", async (req, res): Promise<void> => {
  const params = UpdateTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof todosTable.$inferInsert> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  const [todo] = await db
    .update(todosTable)
    .set(updates)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(UpdateTodoResponse.parse({ ...todo, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() }));
});

router.delete("/todos/:id", async (req, res): Promise<void> => {
  const params = DeleteTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .delete(todosTable)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/todos/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const [todo] = await db
    .update(todosTable)
    .set({ completed: !existing.completed, updatedAt: new Date() })
    .where(eq(todosTable.id, params.data.id))
    .returning();

  res.json(ToggleTodoResponse.parse({ ...todo, createdAt: todo.createdAt.toISOString(), updatedAt: todo.updatedAt.toISOString() }));
});

export default router;
