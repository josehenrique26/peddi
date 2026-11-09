"use client";

import { useState } from "react";

interface ModalCodigoProps {
  pedidoId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (codigo: string) => Promise<void>;
}

// Modal para o entregador digitar os 4 dígitos no momento da entrega
export function ModalCodigo({ pedidoId, isOpen, onClose, onConfirmar }: ModalCodigoProps) {
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.length !== 4) {
      setErro("O código precisa ter 4 dígitos.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      await onConfirmar(codigo);
      onClose();
    } catch (err: any) {
      setErro(err.message || "Código incorreto. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Entrega</h3>
        <p className="text-sm text-gray-600 mb-4">
          Peça ao cliente o código de 4 dígitos exibido na tela dele.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            maxLength={4}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            placeholder="0000"
            className="w-full text-center text-3xl font-mono tracking-widest py-3 border-2 border-gray-300 rounded-xl focus:border-orange-600 focus:outline-none"
            autoFocus
          />

          {erro && <p className="text-sm text-red-600 font-medium text-center">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando || codigo.length !== 4}
              className="flex-1 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition"
            >
              {carregando ? "Validando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
