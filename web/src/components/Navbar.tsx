"use client";

import Link from "next/link";
import { useCarrinho } from "@/lib/cart-store";

// Barra de navegação unificada com links simples e contador de carrinho
export function Navbar() {
  const totalItens = useCarrinho((state) => state.totalItens());

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-2xl text-orange-600">
          <span>🍕</span> Peddi
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/cardapio" className="text-gray-700 hover:text-orange-600 transition">
            Cardápio
          </Link>
          <Link href="/pedidos" className="text-gray-700 hover:text-orange-600 transition">
            Meus Pedidos
          </Link>
          <Link href="/admin/pedidos" className="text-gray-700 hover:text-orange-600 transition">
            Empresa
          </Link>
          <Link href="/entregador/disponiveis" className="text-gray-700 hover:text-orange-600 transition">
            Entregador
          </Link>

          <Link
            href="/carrinho"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-bold text-sm transition"
          >
            <span>🛒</span>
            <span>{totalItens}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
