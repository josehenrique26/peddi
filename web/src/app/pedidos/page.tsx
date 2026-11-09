"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BadgeStatus } from "@/components/BadgeStatus";
import Link from "next/link";

// Rota: /pedidos — Lista de pedidos do cliente com atualização em tempo real
export default function MeusPedidosPage() {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["meus-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000, // atualiza a cada 5 segundos
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Meus Pedidos</h1>
        <p className="text-gray-500 text-sm">Acompanhe o andamento dos seus pedidos em tempo real</p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-center py-8">Carregando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-3">
          <p className="text-gray-500">Você ainda não realizou nenhum pedido.</p>
          <Link
            href="/cardapio"
            className="inline-block px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-sm"
          >
            Ir para o Cardápio
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido: any) => (
            <Link
              key={pedido.id}
              href={`/pedidos/${pedido.id}`}
              className="block bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400">
                    #{pedido.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-1">
                    {(pedido.total / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(pedido.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>

                <BadgeStatus status={pedido.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
