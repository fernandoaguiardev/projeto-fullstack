import { useListProdutos, getListProdutosQueryKey, useDeleteProduto, getGetProdutoStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package, Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const CATEGORIAS = [
  "Eletrônicos", "Alimentos", "Vestuário", "Móveis", "Ferramentas", "Higiene", "Papelaria", "Outro"
];

export default function Produtos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas");
  const [produtoToDelete, setProdutoToDelete] = useState<number | null>(null);

  const { data: produtos, isLoading } = useListProdutos(
    categoriaFilter !== "todas" ? { categoria: categoriaFilter } : {},
    { query: { queryKey: getListProdutosQueryKey(categoriaFilter !== "todas" ? { categoria: categoriaFilter } : undefined) } }
  );

  const deleteMutation = useDeleteProduto({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProdutoStatsQueryKey() });
        setProdutoToDelete(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível excluir o produto.",
        });
        setProdutoToDelete(null);
      }
    }
  });

  const filteredProdutos = produtos?.filter((p) => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo do seu estoque.</p>
        </div>
        <Link href="/produtos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou código..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px] flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Categorias</SelectItem>
              {CATEGORIAS.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="hidden md:table-cell">Cód. Barras</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-5 w-48 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell className="text-right"><div className="h-5 w-12 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-5 w-32 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : filteredProdutos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos?.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                        {produto.imagemUrl ? (
                          <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover rounded-md" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{produto.nome}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 w-[200px]" title={produto.descricao}>
                          {produto.descricao}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{produto.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${produto.quantidadeEstoque <= 5 ? 'text-destructive' : ''}`}>
                      {produto.quantidadeEstoque}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-sm">
                    {produto.codigoBarras || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/produtos/${produto.id}`} className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/produtos/${produto.id}/editar`} className="flex items-center cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          onClick={() => setProdutoToDelete(produto.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={produtoToDelete !== null} onOpenChange={(open) => !open && setProdutoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e removerá todas as associações de fornecedores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => produtoToDelete && deleteMutation.mutate({ id: produtoToDelete })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
