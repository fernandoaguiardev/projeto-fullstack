import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const produtosTable = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigoBarras: text("codigo_barras").unique(),
  descricao: text("descricao").notNull(),
  quantidadeEstoque: integer("quantidade_estoque").notNull().default(0),
  categoria: text("categoria").notNull(),
  dataValidade: date("data_validade"),
  imagemUrl: text("imagem_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProdutoSchema = createInsertSchema(produtosTable).omit({ id: true, createdAt: true });
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtosTable.$inferSelect;
