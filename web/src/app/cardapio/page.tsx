"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CardProduto } from "@/components/CardProduto";
import { useState } from "react";

// Rota: /cardapio — O cliente visualiza produtos e filtra por categoria
export default function CardapioPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todas");

  // 1. Busca os produtos diretamente do Supabase com TanStack Query
  const { data: produtos = [], isLoading: carregandoProdutos } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Busca as categorias da loja
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const produtosFiltrados =
    categoriaAtiva === "todas"
      ? produtos
      : produtos.filter((p: any) => p.category_id === categoriaAtiva);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Cardápio</h1>
        <p className="text-gray-500 text-sm">Escolha seus itens favoritos e monte seu pedido</p>
      </div>

      {/* Filtro simples por categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCategoriaAtiva("todas")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            categoriaAtiva === "todas"
              ? "bg-orange-600 text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Todos
        </button>
        {categorias.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaAtiva(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              categoriaAtiva === cat.id
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {cat.nome}
          </button>
        ))}
      </div>

      {/* Grid de produtos */}
      {carregandoProdutos ? (
        <p className="text-gray-500 py-8 text-center">Carregando cardápio...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {produtosFiltrados.map((item: any) => (
            <CardProduto
              key={item.id}
              id={item.id}
              nome={item.nome}
              descricao={item.descricao}
              preco={item.preco}
              imagemUrl={item.imagem_url}
              disponivel={item.disponivel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
