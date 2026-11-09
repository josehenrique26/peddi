"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Rota: /admin/dashboard — Métricas de faturamento e total de pedidos
export default function AdminDashboardPage() {
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["dashboard-pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const pedidosValidos = pedidos.filter((p: any) => p.status !== "cancelado");
  const faturamentoTotal = pedidosValidos.reduce((acc: number, p: any) => acc + (p.total || 0), 0);
  const totalEntregues = pedidos.filter((p: any) => p.status === "entregue").length;
  const ticketMedio = pedidosValidos.length > 0 ? faturamentoTotal / pedidosValidos.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Indicadores gerais de desempenho da loja</p>
      </div>

      {isLoading ? (
        <p className="text-gray-500 py-8 text-center">Carregando métricas...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Faturamento Total</span>
            <div className="text-3xl font-black text-green-600 mt-2">
              {(faturamentoTotal / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Soma dos pedidos concluídos e em andamento</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Total de Pedidos</span>
            <div className="text-3xl font-black text-gray-900 mt-2">{pedidos.length}</div>
            <p className="text-xs text-gray-500 mt-1">{totalEntregues} pedidos entregues com sucesso</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Ticket Médio</span>
            <div className="text-3xl font-black text-orange-600 mt-2">
              {(ticketMedio / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Valor médio por pedido realizado</p>
          </div>
        </div>
      )}
    </div>
  );
}
