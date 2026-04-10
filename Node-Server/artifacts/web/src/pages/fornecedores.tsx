import { useListFornecedores, getListFornecedoresQueryKey, useDeleteFornecedor } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Truck, Plus, Search, Building2, Phone, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Fornecedores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [fornecedorToDelete, setFornecedorToDelete] = useState<number | null>(null);

  const { data: fornecedores, isLoading } = useListFornecedores({
    query: { queryKey: getListFornecedoresQueryKey() }
  });

  const deleteMutation = useDeleteFornecedor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Fornecedor excluído com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: getListFornecedoresQueryKey() });
        setFornecedorToDelete(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível excluir o fornecedor.",
        });
        setFornecedorToDelete(null);
      }
    }
  });

  const filteredFornecedores = fornecedores?.filter((f) => 
    f.nomeEmpresa.toLowerCase().includes(search.toLowerCase()) || 
    f.cnpj.includes(search) ||
    f.contatoPrincipal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus parceiros e fornecedores de produtos.</p>
        </div>
        <Link href="/fornecedores/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </Link>
      </div>

      <div className="flex items-center border rounded-md px-3 py-2 bg-card max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
        <Input 
          placeholder="Buscar fornecedores..." 
          className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-5 w-40 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-5 w-32 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-5 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><div className="h-5 w-48 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : filteredFornecedores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredFornecedores?.map((fornecedor) => (
                <TableRow key={fornecedor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{fornecedor.nomeEmpresa}</div>
                        <div className="text-xs text-muted-foreground">{fornecedor.cnpj}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{fornecedor.contatoPrincipal}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {fornecedor.telefone}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {fornecedor.email}
                    </div>
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
                          <Link href={`/fornecedores/${fornecedor.id}/editar`} className="flex items-center cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          onClick={() => setFornecedorToDelete(fornecedor.id)}
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

      <AlertDialog open={fornecedorToDelete !== null} onOpenChange={(open) => !open && setFornecedorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => fornecedorToDelete && deleteMutation.mutate({ id: fornecedorToDelete })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
