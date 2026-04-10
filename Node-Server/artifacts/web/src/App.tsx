import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Fornecedores from "@/pages/fornecedores";
import FornecedorForm from "@/pages/fornecedores-form";
import Produtos from "@/pages/produtos";
import ProdutoForm from "@/pages/produtos-form";
import ProdutoDetalhes from "@/pages/produto-detalhes";
import Layout from "@/components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        {/* Produtos */}
        <Route path="/produtos" component={Produtos} />
        <Route path="/produtos/novo" component={ProdutoForm} />
        <Route path="/produtos/:id/editar" component={ProdutoForm} />
        <Route path="/produtos/:id" component={ProdutoDetalhes} />
        
        {/* Fornecedores */}
        <Route path="/fornecedores" component={Fornecedores} />
        <Route path="/fornecedores/novo" component={FornecedorForm} />
        <Route path="/fornecedores/:id/editar" component={FornecedorForm} />
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
