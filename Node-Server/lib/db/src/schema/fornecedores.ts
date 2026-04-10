import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fornecedoresTable = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  nomeEmpresa: text("nome_empresa").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  endereco: text("endereco").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email").notNull(),
  contatoPrincipal: text("contato_principal").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFornecedorSchema = createInsertSchema(fornecedoresTable).omit({ id: true, createdAt: true });
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type Fornecedor = typeof fornecedoresTable.$inferSelect;
