import { useGetProduto, getGetProdutoQueryKey, useAssociarFornecedor, useDesassociarFornecedor, useListFornecedores, getListFornecedoresQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Package, Calendar, Barcode, Layers, Pencil, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function ProdutoDetalhes() {
  const { id } = useParams();
  const produtoId = parseInt(id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string>("");

  const { data: produto, isLoading } = useGetProduto(produtoId, {
    query: { queryKey: getGetProdutoQueryKey(produtoId), enabled: !!produtoId }
  });

  const { data: fornecedores } = useListFornecedores({
    query: { queryKey: getListFornecedoresQueryKey() }
  });

  const associarMutation = useAssociarFornecedor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso!",
          description: "Fornecedor associado ao produto.",
        });
        queryClient.invalidateQueries({ queryKey: getGetProdutoQueryKey(produtoId) });
        setSelectedFornecedorId("");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível associar o fornecedor.",
        });
      }
    }
  });

  const desassociarMutation = useDesassociarFornecedor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Fornecedor desassociado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: getGetProdutoQueryKey(produtoId) });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível desassociar o fornecedor.",
        });
      }
    }
  });

  const handleAssociar = () => {
    if (!selectedFornecedorId) return;
    associarMutation.mutate({ 
      id: produtoId, 
      data: { fornecedorId: parseInt(selectedFornecedorId) } 
    });
  };

  const handleDesassociar = (fornecedorId: number) => {
    desassociarMutation.mutate({ 
      id: produtoId, 
      fornecedorId 
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando detalhes...</div>;
  }

  if (!produto) {
    return <div className="p-8 text-center">Produto não encontrado.</div>;
  }

  // Filter out already associated fornecedores for the dropdown
  const associatedIds = new Set(produto.fornecedores?.map(f => f.id) || []);
  const availableFornecedores = fornecedores?.filter(f => !associatedIds.has(f.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/produtos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detalhes do Produto</h1>
        </div>
        <Link href={`/produtos/${produto.id}/editar`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Produto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-0 shadow-md bg-gradient-to-b from-card to-muted/20">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="w-40 h-40 rounded-xl overflow-hidden bg-background border-2 border-muted flex items-center justify-center mb-6 shadow-sm">
              {produto.imagemUrl ? (
                <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>
            <h2 className="text-xl font-bold text-center mb-2">{produto.nome}</h2>
            <Badge variant="outline" className="mb-4">{produto.categoria}</Badge>
            
            <div className="w-full space-y-4 mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estoque Atual</span>
                <Badge variant={produto.quantidadeEstoque > 5 ? "secondary" : "destructive"} className="text-sm px-3 py-1">
                  {produto.quantidadeEstoque} unid.
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center"><Barcode className="h-3 w-3 mr-1"/> Código</span>
                <span className="text-sm font-mono">{produto.codigoBarras || "N/A"}</span>
              </div>
              
              {produto.dataValidade && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1"/> Validade</span>
                  <span className="text-sm">{new Date(produto.dataValidade).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {produto.descricao}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Fornecedores Associados</CardTitle>
                <CardDescription>Empresas que fornecem este produto</CardDescription>
              </div>
              <Badge variant="secondary">{produto.fornecedores?.length || 0}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex-1">
                  <Select value={selectedFornecedorId} onValueChange={setSelectedFornecedorId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione um fornecedor para associar" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFornecedores.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhum fornecedor disponível</SelectItem>
                      ) : (
                        availableFornecedores.map(f => (
                          <SelectItem key={f.id} value={f.id.toString()}>{f.nomeEmpresa}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAssociar} 
                  disabled={!selectedFornecedorId || selectedFornecedorId === "none" || associarMutation.isPending}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Associar
                </Button>
              </div>

              {produto.fornecedores && produto.fornecedores.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produto.fornecedores.map((fornecedor) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell className="font-medium">{fornecedor.nomeEmpresa}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{fornecedor.contatoPrincipal}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDesassociar(fornecedor.id)}
                              disabled={desassociarMutation.isPending}
                            >
                              <Unlink className="h-4 w-4 mr-2" />
                              Desassociar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 bg-card border border-dashed rounded-lg text-muted-foreground">
                  <Truck className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p>Nenhum fornecedor associado a este produto ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
