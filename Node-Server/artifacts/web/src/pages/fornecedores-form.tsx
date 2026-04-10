import { useCreateFornecedor, useGetFornecedor, getGetFornecedorQueryKey, useUpdateFornecedor, getListFornecedoresQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

const formSchema = z.object({
  nomeEmpresa: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, "CNPJ inválido. Formato: 00.000.000/0000-00"),
  endereco: z.string().min(5, "Endereço é obrigatório"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}\-\d{4}$/, "Telefone inválido. Formato: (00) 00000-0000"),
  email: z.string().email("E-mail inválido"),
  contatoPrincipal: z.string().min(2, "Nome do contato é obrigatório"),
});

export default function FornecedorForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id && params.id !== "novo";
  const fornecedorId = isEditing ? parseInt(params.id as string) : 0;
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeEmpresa: "",
      cnpj: "",
      endereco: "",
      telefone: "",
      email: "",
      contatoPrincipal: "",
    },
  });

  const { data: fornecedor, isLoading } = useGetFornecedor(fornecedorId, {
    query: {
      queryKey: getGetFornecedorQueryKey(fornecedorId),
      enabled: isEditing,
    }
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (fornecedor && isEditing && !initializedRef.current) {
      form.reset({
        nomeEmpresa: fornecedor.nomeEmpresa,
        cnpj: fornecedor.cnpj,
        endereco: fornecedor.endereco,
        telefone: fornecedor.telefone,
        email: fornecedor.email,
        contatoPrincipal: fornecedor.contatoPrincipal,
      });
      initializedRef.current = true;
    }
  }, [fornecedor, form, isEditing]);

  const createMutation = useCreateFornecedor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso!",
          description: "Fornecedor cadastrado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: getListFornecedoresQueryKey() });
        setLocation("/fornecedores");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível cadastrar o fornecedor.",
        });
      }
    }
  });

  const updateMutation = useUpdateFornecedor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Sucesso!",
          description: "Fornecedor atualizado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: getListFornecedoresQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFornecedorQueryKey(fornecedorId) });
        setLocation("/fornecedores");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar o fornecedor.",
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing) {
      updateMutation.mutate({ id: fornecedorId, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  }

  // CNPJ Mask
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  // Phone Mask
  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  if (isEditing && isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/fornecedores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize os dados do fornecedor abaixo." : "Preencha os dados para cadastrar um novo fornecedor."}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nomeEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Razão Social ou Nome Fantasia" className="pl-9" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00.000.000/0000-00" 
                        {...field} 
                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        maxLength={18}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        {...field} 
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@empresa.com.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contatoPrincipal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato Principal *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa de contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/fornecedores">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
