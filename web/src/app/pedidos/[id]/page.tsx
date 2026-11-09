"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BadgeStatus } from "@/components/BadgeStatus";
import { useParams } from "next/navigation";
import Link from "next/link";

// Rota: /pedidos/[id] — Acompanhamento do pedido e exibição do código de 4 dígitos
export default function DetalhesPedidoPage() {
  const { id } = useParams<{ id: string }>();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, // polling a cada 3s para pegar a alteração de status
  });

  if (isLoading) return <p className="text-center py-12 text-gray-500">Carregando detalhes do pedido...</p>;
  if (!pedido) return <p className="text-center py-12 text-red-500">Pedido não encontrado.</p>;

  const saiuParaEntrega = pedido.status === "saiu_para_entrega";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/pedidos" className="text-sm font-semibold text-orange-600 hover:underline">
        &larr; Voltar para meus pedidos
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400">PEDIDO</span>
            <h1 className="text-xl font-black text-gray-900">
              #{pedido.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <BadgeStatus status={pedido.status} />
        </div>

        {/* Bloco de Código de Confirmação (Só aparece quando Saiu para entrega) */}
        {saiuParaEntrega && pedido.codigo_entrega && (
          <div className="bg-orange-50 border-2 border-orange-400 p-5 rounded-2xl text-center space-y-2">
            <span className="text-xs font-black uppercase text-orange-800 tracking-wider">
              Código de Confirmação da Entrega
            </span>
            <div className="text-5xl font-mono font-black text-orange-600 tracking-widest py-1">
              {pedido.codigo_entrega}
            </div>
            <p className="text-xs text-orange-900 font-medium">
              Informe estes 4 dígitos ao entregador apenas quando receber sua encomenda.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 text-sm space-y-2">
          <p className="text-gray-600">
            <strong>Endereço:</strong> {pedido.endereco} — {pedido.bairro}
          </p>
          <p className="text-gray-600">
            <strong>Pagamento:</strong> {pedido.forma_pagamento?.toUpperCase()}
          </p>
          <p className="text-gray-600">
            <strong>Total:</strong>{" "}
            {(pedido.total / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
