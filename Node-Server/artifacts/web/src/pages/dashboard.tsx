import { useGetProdutoStats, getGetProdutoStatsQueryKey, useListProdutos, getListProdutosQueryKey } from "@workspace/api-client-react";
import { Package, Truck, AlertTriangle, Layers, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProdutoStats({
    query: { queryKey: getGetProdutoStatsQueryKey() }
  });

  const { data: produtos, isLoading: produtosLoading } = useListProdutos(
    {},
    { query: { queryKey: getListProdutosQueryKey() } }
  );

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <div className="h-8 w-16 bg-muted rounded animate-pulse mt-1" />
        ) : (
          <div className="text-2xl font-bold font-mono">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu controle de estoque.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Produtos"
          value={stats?.totalProdutos || 0}
          icon={Package}
          description="Itens cadastrados no sistema"
        />
        <StatCard
          title="Total de Fornecedores"
          value={stats?.totalFornecedores || 0}
          icon={Truck}
          description="Parceiros registrados"
        />
        <StatCard
          title="Estoque Baixo"
          value={stats?.produtosEstoqueBaixo || 0}
          icon={AlertTriangle}
          description="Produtos abaixo do limite"
        />
        <StatCard
          title="Categorias"
          value={stats?.categorias || 0}
          icon={Layers}
          description="Grupos de produtos"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Produtos Recentes</CardTitle>
            <CardDescription>
              Últimos itens adicionados ao inventário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {produtosLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-[200px] bg-muted rounded animate-pulse" />
                      <div className="h-3 w-[150px] bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : produtos && produtos.length > 0 ? (
              <div className="space-y-6">
                {produtos.slice(0, 5).map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-md text-primary">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">{produto.categoria}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={produto.quantidadeEstoque > 10 ? "secondary" : "destructive"}>
                        {produto.quantidadeEstoque} unid.
                      </Badge>
                      <Link href={`/produtos/${produto.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto cadastrado ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos para tarefas comuns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/produtos/novo" className="block">
              <Button className="w-full justify-start h-14" variant="outline">
                <Package className="mr-2 h-5 w-5" />
                Cadastrar Novo Produto
              </Button>
            </Link>
            <Link href="/fornecedores/novo" className="block">
              <Button className="w-full justify-start h-14" variant="outline">
                <Truck className="mr-2 h-5 w-5" />
                Cadastrar Fornecedor
              </Button>
            </Link>
            <Link href="/produtos" className="block">
              <Button className="w-full justify-start h-14" variant="secondary">
                <Layers className="mr-2 h-5 w-5" />
                Ver Inventário Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
