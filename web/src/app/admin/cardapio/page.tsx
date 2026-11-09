"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/schemas";
import { z } from "zod";
import { useState } from "react";

type ProdutoFormData = z.infer<typeof produtoSchema>;

// Rota: /admin/cardapio — CRUD de produtos e categorias da loja
export default function AdminCardapioPage() {
  const queryClient = useQueryClient();
  const [modalAberto, setModalAberto] = useState(false);

  // Busca produtos
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(nome)");
      if (error) throw error;
      return data || [];
    },
  });

  // Busca categorias
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
  });

  // Mutação para cadastrar produto
  const cadastrarMutation = useMutation({
    mutationFn: async (dados: ProdutoFormData) => {
      const precoEmCentavos = Math.round(dados.preco * 100);
      const { error } = await supabase.from("products").insert({
        nome: dados.nome,
        descricao: dados.descricao,
        preco: precoEmCentavos,
        category_id: dados.categoryId,
        disponivel: dados.disponivel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
      reset();
      setModalAberto(false);
    },
  });

  // Alterna disponibilidade do produto
  const toggleDisponivelMutation = useMutation({
    mutationFn: async ({ id, disponivel }: { id: string; disponivel: boolean }) => {
      const { error } = await supabase.from("products").update({ disponivel }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-produtos"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Gerenciar Cardápio</h1>
          <p className="text-sm text-gray-500">Adicione ou pause itens do seu catálogo</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition"
        >
          + Novo Produto
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Carregando cardápio...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtos.map((p: any) => (
                <tr key={p.id}>
                  <td className="p-4 font-semibold text-gray-900">{p.nome}</td>
                  <td className="p-4 text-gray-600">{p.categories?.nome || "Sem categoria"}</td>
                  <td className="p-4 font-bold text-gray-900">
                    {(p.preco / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        p.disponivel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.disponivel ? "Ativo" : "Pausado"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() =>
                        toggleDisponivelMutation.mutate({ id: p.id, disponivel: !p.disponivel })
                      }
                      className="text-xs font-bold text-orange-600 hover:underline"
                    >
                      {p.disponivel ? "Pausar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal simples de cadastro de produto */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit((data) => cadastrarMutation.mutate(data))}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900">Adicionar Produto</h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome</label>
              <input
                {...register("nome")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
              <select
                {...register("categoryId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {categorias.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-600">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                {...register("preco")}
                placeholder="45.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {errors.preco && <p className="text-xs text-red-600">{errors.preco.message}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cadastrarMutation.isPending}
                className="flex-1 py-2 bg-orange-600 text-white font-semibold rounded-lg text-sm"
              >
                Salvar Produto
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
