"use client";

import { useCarrinho } from "@/lib/cart-store";

interface ProdutoProps {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  disponivel?: boolean;
}

// Card de produto reutilizável no cardápio do cliente
export function CardProduto({ id, nome, descricao, preco, imagemUrl, disponivel = true }: ProdutoProps) {
  const adicionarItem = useCarrinho((state) => state.adicionarItem);

  const precoFormatado = (preco / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="flex flex-col justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition">
      <div>
        {imagemUrl ? (
          <img src={imagemUrl} alt={nome} className="w-full h-40 object-cover rounded-lg mb-3" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-4xl rounded-lg mb-3">
            🍕
          </div>
        )}
        <h3 className="font-bold text-gray-900 text-lg">{nome}</h3>
        {descricao && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{descricao}</p>}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="font-extrabold text-orange-600 text-lg">{precoFormatado}</span>
        {disponivel ? (
          <button
            onClick={() => adicionarItem({ id, nome, preco, imagemUrl })}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition"
          >
            + Adicionar
          </button>
        ) : (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
            Esgotado
          </span>
        )}
      </div>
    </div>
  );
}
