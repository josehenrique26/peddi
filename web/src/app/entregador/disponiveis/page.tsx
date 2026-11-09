"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Rota: /entregador/disponiveis — Lista pedidos prontos (mostra apenas bairro e valor) e permite selecionar até 3
export default function EntregadorDisponiveisPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Busca pedidos com status 'pronto' que ainda não estão em viagem
  const { data: pedidosProntos = [], isLoading } = useQuery({
    queryKey: ["pedidos-prontos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pronto")
        .is("delivery_id", null);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Alterna seleção de até 3 pedidos
  function toggleSelecao(id: string) {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((item) => item !== id));
    } else {
      if (selecionados.length >= 3) {
        alert("Você pode selecionar no máximo 3 pedidos por viagem.");
        return;
      }
      setSelecionados([...selecionados, id]);
    }
  }

  // Inicia a viagem chamando a função RPC ou atualizando no banco
  const iniciarViagemMutation = useMutation({
    mutationFn: async () => {
      // 1. Cria a entrega na tabela deliveries
      const { data: entrega, error: erroEntrega } = await supabase
        .from("deliveries")
        .insert({ status: "em_andamento" })
        .select()
        .single();

      if (erroEntrega) throw erroEntrega;

      // 2. Atualiza os pedidos selecionados para 'saiu_para_entrega' e gera o código de 4 dígitos
      for (const orderId of selecionados) {
        const codigoAleatorio = Math.floor(1000 + Math.random() * 9000).toString();
        await supabase
          .from("orders")
          .update({
            status: "saiu_para_entrega",
            delivery_id: entrega.id,
            codigo_entrega: codigoAleatorio,
          })
          .eq("id", orderId);
      }

      return entrega.id;
    },
    onSuccess: (entregaId) => {
      queryClient.invalidateQueries({ queryKey: ["pedidos-prontos"] });
      router.push(`/entregador/viagem?id=${entregaId}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Pedidos Prontos</h1>
          <p className="text-sm text-gray-500">Selecione até 3 pedidos para iniciar sua rota</p>
        </div>

        <button
          onClick={() => iniciarViagemMutation.mutate()}
          disabled={selecionados.length === 0 || iniciarViagemMutation.isPending}
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition shadow"
        >
          {iniciarViagemMutation.isPending
            ? "Iniciando rota..."
            : `Iniciar Viagem (${selecionados.length}/3)`}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Buscando pedidos disponíveis...</p>
      ) : pedidosProntos.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
          <p className="text-gray-500">Nenhum pedido pronto para entrega no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {pedidosProntos.map((pedido: any) => {
            const isSelected = selecionados.includes(pedido.id);

            return (
              <div
                key={pedido.id}
                onClick={() => toggleSelecao(pedido.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition ${
                  isSelected
                    ? "bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-500"
                    : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400">
                    #{pedido.id.slice(0, 6).toUpperCase()}
                  </span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-5 h-5 text-orange-600 rounded"
                  />
                </div>

                <div className="mt-3 space-y-1">
                  {/* Privacidade: mostra apenas bairro e valor */}
                  <div className="text-lg font-bold text-gray-900">Bairro: {pedido.bairro}</div>
                  <div className="text-xs text-gray-400">Endereço completo liberado ao sair</div>
                  <div className="text-sm font-extrabold text-orange-600 pt-2">
                    {(pedido.total / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
