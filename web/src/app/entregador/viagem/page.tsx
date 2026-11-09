"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { ModalCodigo } from "@/components/ModalCodigo";
import { BadgeStatus } from "@/components/BadgeStatus";

// Rota: /entregador/viagem — Exibe as paradas da viagem com endereços completos e confirmação por código
export default function EntregadorViagemPage() {
  const queryClient = useQueryClient();
  const [pedidoSelecionadoParaValidar, setPedidoSelecionadoParaValidar] = useState<string | null>(null);

  // Busca os pedidos em andamento que saíram para entrega
  const { data: paradas = [], isLoading } = useQuery({
    queryKey: ["viagem-ativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "saiu_para_entrega");
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 3000,
  });

  // Validação do código de 4 dígitos informado pelo cliente
  async function validarCodigo(codigoDigitado: string) {
    if (!pedidoSelecionadoParaValidar) return;

    // Busca o código correto no banco
    const { data: pedido, error } = await supabase
      .from("orders")
      .select("codigo_entrega")
      .eq("id", pedidoSelecionadoParaValidar)
      .single();

    if (error || !pedido) throw new Error("Erro ao consultar pedido.");

    if (pedido.codigo_entrega !== codigoDigitado) {
      throw new Error("Código inválido! Peça o código correto ao cliente.");
    }

    // Código correto: marca o pedido como entregue
    await supabase
      .from("orders")
      .update({ status: "entregue", codigo_entrega: null })
      .eq("id", pedidoSelecionadoParaValidar);

    queryClient.invalidateQueries({ queryKey: ["viagem-ativa"] });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Viagem em Andamento</h1>
        <p className="text-sm text-gray-500">
          Entregue as encomendas e digite os 4 dígitos para concluir cada parada
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Carregando paradas...</p>
      ) : paradas.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-3">
          <span className="text-4xl block">🎉</span>
          <h3 className="text-lg font-bold text-gray-900">Nenhuma entrega pendente</h3>
          <p className="text-sm text-gray-500">Todas as paradas foram concluídas ou você não tem viagem ativa.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paradas.map((pedido: any, index: number) => (
            <div key={pedido.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase">
                    Parada #{index + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 text-lg">{pedido.nome_cliente}</h3>
                  <p className="text-xs text-gray-500">Tel: {pedido.telefone}</p>
                </div>
                <BadgeStatus status={pedido.status} />
              </div>

              {/* Dados completos liberados na rota */}
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                <p>
                  <strong>Endereço:</strong> {pedido.endereco}
                </p>
                <p>
                  <strong>Bairro:</strong> {pedido.bairro}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${pedido.endereco}, ${pedido.bairro}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 text-center border border-gray-300 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
                >
                  Abrir no GPS 🗺️
                </a>

                <button
                  onClick={() => setPedidoSelecionadoParaValidar(pedido.id)}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  Confirmar Entrega 🔢
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para digitar os 4 dígitos */}
      {pedidoSelecionadoParaValidar && (
        <ModalCodigo
          pedidoId={pedidoSelecionadoParaValidar}
          isOpen={!!pedidoSelecionadoParaValidar}
          onClose={() => setPedidoSelecionadoParaValidar(null)}
          onConfirmar={validarCodigo}
        />
      )}
    </div>
  );
}
