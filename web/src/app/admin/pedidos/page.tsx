"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BadgeStatus } from "@/components/BadgeStatus";

// Rota: /admin/pedidos — Quadro Kanban para a cozinha e equipe da loja
export default function AdminPedidosPage() {
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["admin-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 4000,
  });

  // Mutação para avançar o status do pedido
  const mudarStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pedidos"] });
    },
  });

  const recebidos = pedidos.filter((p: any) => p.status === "recebido");
  const emPreparo = pedidos.filter((p: any) => p.status === "em_preparo");
  const prontos = pedidos.filter((p: any) => p.status === "pronto");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Gestão de Pedidos</h1>
          <p className="text-sm text-gray-500">Controle da cozinha e despacho para entregadores</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Carregando pedidos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna 1: Recebidos */}
          <div className="bg-gray-100 p-4 rounded-2xl space-y-3">
            <h2 className="font-bold text-gray-700 flex items-center justify-between">
              <span>Novos Recebidos</span>
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {recebidos.length}
              </span>
            </h2>

            {recebidos.map((pedido: any) => (
              <div key={pedido.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{pedido.nome_cliente}</h4>
                    <span className="text-xs text-gray-400">#{pedido.id.slice(0, 6)}</span>
                  </div>
                  <BadgeStatus status={pedido.status} />
                </div>
                <p className="text-xs text-gray-600 font-medium">{pedido.endereco} — {pedido.bairro}</p>
                <button
                  onClick={() => mudarStatusMutation.mutate({ id: pedido.id, novoStatus: "em_preparo" })}
                  className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs rounded-lg transition"
                >
                  Iniciar Preparo &rarr;
                </button>
              </div>
            ))}
          </div>

          {/* Coluna 2: Em Preparo */}
          <div className="bg-gray-100 p-4 rounded-2xl space-y-3">
            <h2 className="font-bold text-gray-700 flex items-center justify-between">
              <span>Na Cozinha / Em Preparo</span>
              <span className="bg-yellow-600 text-white text-xs px-2 py-0.5 rounded-full">
                {emPreparo.length}
              </span>
            </h2>

            {emPreparo.map((pedido: any) => (
              <div key={pedido.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{pedido.nome_cliente}</h4>
                    <span className="text-xs text-gray-400">#{pedido.id.slice(0, 6)}</span>
                  </div>
                  <BadgeStatus status={pedido.status} />
                </div>
                <p className="text-xs text-gray-600 font-medium">{pedido.endereco} — {pedido.bairro}</p>
                <button
                  onClick={() => mudarStatusMutation.mutate({ id: pedido.id, novoStatus: "pronto" })}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition"
                >
                  Marcar como Pronto &rarr;
                </button>
              </div>
            ))}
          </div>

          {/* Coluna 3: Prontos para Retirada */}
          <div className="bg-gray-100 p-4 rounded-2xl space-y-3">
            <h2 className="font-bold text-gray-700 flex items-center justify-between">
              <span>Pronto (Aguardando Entregador)</span>
              <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                {prontos.length}
              </span>
            </h2>

            {prontos.map((pedido: any) => (
              <div key={pedido.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{pedido.nome_cliente}</h4>
                    <span className="text-xs text-gray-400">#{pedido.id.slice(0, 6)}</span>
                  </div>
                  <BadgeStatus status={pedido.status} />
                </div>
                <p className="text-xs text-gray-500">Aguardando entregador assumir viagem...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
