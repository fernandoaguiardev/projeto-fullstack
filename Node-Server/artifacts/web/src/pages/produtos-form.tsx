import {
  useCreateProduto,
  useGetProduto,
  getGetProdutoQueryKey,
  useUpdateProduto,
  getListProdutosQueryKey,
  getGetProdutoStatsQueryKey,
  useListFornecedores,
  getListFornecedoresQueryKey,
  useAssociarFornecedor,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Save, Image as ImageIcon, Building2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

const CATEGORIAS = [
  "Eletrônicos", "Alimentos", "Vestuário", "Móveis", "Ferramentas", "Higiene", "Papelaria", "Outro"
] as const;

const formSchema = z.object({
  nome: z.string().min(2, "Nome do produto deve ter pelo menos 2 caracteres"),
  codigoBarras: z.string().optional().nullable(),
  descricao: z.string().min(5, "Descrição é obrigatória"),
  quantidadeEstoque: z.coerce.number().min(0, "A quantidade não pode ser negativa"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  dataValidade: z.string().optional().nullable(),
  imagemUrl: z.string().url("URL de imagem inválida").optional().nullable().or(z.literal("")),
});

export default function ProdutoForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id && params.id !== "novo";
  const produtoId = isEditing ? parseInt(params.id as string) : 0;
  const queryClient = useQueryClient();

  const [fornecedoresSelecionados, setFornecedoresSelecionados] = useState<Set<number>>(new Set());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      codigoBarras: "",
      descricao: "",
      quantidadeEstoque: 0,
      categoria: "",
      dataValidade: "",
      imagemUrl: "",
    },
  });

  const { data: produto, isLoading } = useGetProduto(produtoId, {
    query: {
      queryKey: getGetProdutoQueryKey(produtoId),
      enabled: isEditing,
    }
  });

  const { data: fornecedores } = useListFornecedores({
    query: { queryKey: getListFornecedoresQueryKey() }
  });

  const associarMutation = useAssociarFornecedor({});

  const initializedRef = useRef(false);

  useEffect(() => {
    if (produto && isEditing && !initializedRef.current) {
      form.reset({
        nome: produto.nome,
        codigoBarras: produto.codigoBarras || "",
        descricao: produto.descricao,
        quantidadeEstoque: produto.quantidadeEstoque,
        categoria: produto.categoria,
        dataValidade: produto.dataValidade ? new Date(produto.dataValidade).toISOString().split('T')[0] : "",
        imagemUrl: produto.imagemUrl || "",
      });
      if (produto.fornecedores) {
        setFornecedoresSelecionados(new Set(produto.fornecedores.map(f => f.id)));
      }
      initializedRef.current = true;
    }
  }, [produto, form, isEditing]);

  const createMutation = useCreateProduto({
    mutation: {
      onSuccess: async (novoProduto) => {
        const idsParaAssociar = Array.from(fornecedoresSelecionados);
        for (const fornecedorId of idsParaAssociar) {
          try {
            await associarMutation.mutateAsync({ id: novoProduto.id, data: { fornecedorId } });
          } catch {
          }
        }
        toast({ title: "Sucesso!", description: "Produto cadastrado com sucesso." });
        queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProdutoStatsQueryKey() });
        setLocation("/produtos");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível cadastrar o produto." });
      }
    }
  });

  const updateMutation = useUpdateProduto({
    mutation: {
      onSuccess: async () => {
        const jaAssociados = new Set((produto?.fornecedores || []).map(f => f.id));
        const novos = Array.from(fornecedoresSelecionados).filter(id => !jaAssociados.has(id));
        for (const fornecedorId of novos) {
          try {
            await associarMutation.mutateAsync({ id: produtoId, data: { fornecedorId } });
          } catch {
          }
        }
        toast({ title: "Sucesso!", description: "Produto atualizado com sucesso." });
        queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProdutoQueryKey(produtoId) });
        queryClient.invalidateQueries({ queryKey: getGetProdutoStatsQueryKey() });
        setLocation(`/produtos/${produtoId}`);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o produto." });
      }
    }
  });

  function toggleFornecedor(id: number) {
    setFornecedoresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      codigoBarras: values.codigoBarras || null,
      dataValidade: values.dataValidade ? new Date(values.dataValidade).toISOString() : null,
      imagemUrl: values.imagemUrl || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: produtoId, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={isEditing ? `/produtos/${produtoId}` : "/produtos"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações do produto." : "Adicione um novo item ao inventário."}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Notebook Dell Inspiron" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes e especificações do produto"
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="imagemUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value ? (
                            <div className="aspect-square w-full rounded-md border overflow-hidden bg-muted relative">
                              <img src={field.value} alt="Preview" className="object-cover w-full h-full" onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxsaW5lIHgxPSIzIiB4Mj0iMjEiIHkxPSIzIiB5Mj0iMjEiLz48cGF0aCBkPSJNMTAuNSA1LjVBMi41IDIuNSAwIDAgMCAxMyA4Ii8+PHBhdGggZD0iTTIuOTkgMTFDMi41MSAxMS41NiAyIDEyLjUgMiAxNHY1YTIgMiAwIDAgMCAyIDJoMTRjMS41IDAgMi44OS0uOTkgMy41LTIiLz48cGF0aCBkPSJNMjEgMTVWNWEyIDIgMCAwIDAtMi0ySDYuNSIvPjwvc3ZnPg==';
                              }} />
                            </div>
                          ) : (
                            <div className="aspect-square w-full rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
                              <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                              <span className="text-xs">Sem imagem</span>
                            </div>
                          )}
                          <Input placeholder="https://exemplo.com/imagem.jpg" {...field} value={field.value || ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidadeEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade em Estoque *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoBarras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Deixe em branco se não aplicável</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-semibold">Fornecedores</span>
                <span className="text-sm text-muted-foreground">— selecione quem fornece este produto</span>
              </div>

              {fornecedores && fornecedores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fornecedores.map(f => {
                    const checked = fornecedoresSelecionados.has(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => toggleFornecedor(f.id)}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          checked
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-muted/30 hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        {checked
                          ? <CheckSquare className="h-4 w-4 shrink-0" />
                          : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
                        }
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{f.nomeEmpresa}</p>
                          <p className="text-xs text-muted-foreground truncate">{f.cnpj}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
                  Nenhum fornecedor cadastrado ainda.{" "}
                  <Link href="/fornecedores/novo" className="text-primary underline underline-offset-2">
                    Cadastrar fornecedor
                  </Link>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href={isEditing ? `/produtos/${produtoId}` : "/produtos"}>
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
