import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { fornecedoresTable } from "./fornecedores";
import { produtosTable } from "./produtos";

export const produtoFornecedorTable = pgTable(
  "produto_fornecedor",
  {
    produtoId: integer("produto_id")
      .notNull()
      .references(() => produtosTable.id, { onDelete: "cascade" }),
    fornecedorId: integer("fornecedor_id")
      .notNull()
      .references(() => fornecedoresTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.produtoId, table.fornecedorId] })],
);
