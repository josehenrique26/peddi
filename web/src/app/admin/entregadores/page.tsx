"use client";

import { useState } from "react";

// Rota: /admin/entregadores — Gestão e geração do código de conexão
export default function AdminEntregadoresPage() {
  const [codigoConexao, setCodigoConexao] = useState("VILA8842");

  function gerarNovoCodigo() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let novo = "";
    for (let i = 0; i < 8; i++) {
      novo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCodigoConexao(novo);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Vínculo de Entregadores</h1>
        <p className="text-sm text-gray-500">
          Compartilhe o código de conexão para que entregadores autorizados retirem pedidos da sua loja.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-center">
        <span className="text-xs font-bold text-gray-400 uppercase">Código de Conexão Atual</span>
        <div className="text-4xl font-mono font-black text-orange-600 tracking-wider">
          {codigoConexao}
        </div>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Ao renovar o código, entregadores que ainda não iniciaram viagem precisarão confirmar o novo código.
        </p>

        <div className="pt-4 flex gap-3 justify-center">
          <button
            onClick={() => {
              navigator.clipboard.writeText(codigoConexao);
              alert("Código copiado!");
            }}
            className="px-4 py-2 border border-gray-300 font-bold text-sm rounded-xl hover:bg-gray-50"
          >
            Copiar Código
          </button>
          <button
            onClick={gerarNovoCodigo}
            className="px-4 py-2 bg-orange-600 text-white font-bold text-sm rounded-xl hover:bg-orange-700"
          >
            Gerar Novo Código
          </button>
        </div>
      </div>
    </div>
  );
}
