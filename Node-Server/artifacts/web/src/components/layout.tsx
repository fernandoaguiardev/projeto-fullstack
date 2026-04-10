import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, XCircle, LayoutDashboard, Package, Truck, Box } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000, // Check every 30s
    }
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/produtos", label: "Produtos", icon: Package },
    { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="flex flex-col w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border bg-sidebar px-4 py-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">EstoquePRO</span>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 mb-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Server Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-3 mt-8 rounded-md bg-secondary/50 text-sm">
          {isError ? (
            <>
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">API Offline</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground font-mono text-xs">API {health?.status || 'Online'}</span>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
