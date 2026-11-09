import Link from "next/link";

export default function HomePage() {
  return (
    <div className="py-12 text-center max-w-2xl mx-auto space-y-6">
      <span className="text-6xl block">🍕</span>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
        Bem-vindo ao <span className="text-orange-600">Peddi</span>
      </h1>
      <p className="text-lg text-gray-600">
        Gerenciamento de cardápio, recebimento de pedidos e controle de entregas com confirmação por código de 4 dígitos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <Link
          href="/cardapio"
          className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-left"
        >
          <span className="text-3xl block mb-2">🛒</span>
          <h3 className="font-bold text-gray-900 text-lg">Área do Cliente</h3>
          <p className="text-sm text-gray-500 mt-1">Ver cardápio e fazer pedidos</p>
        </Link>

        <Link
          href="/admin/pedidos"
          className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-left"
        >
          <span className="text-3xl block mb-2">🏪</span>
          <h3 className="font-bold text-gray-900 text-lg">Estabelecimento</h3>
          <p className="text-sm text-gray-500 mt-1">Gerenciar pedidos e cardápio</p>
        </Link>

        <Link
          href="/entregador/disponiveis"
          className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-orange-500 hover:shadow-md transition text-left"
        >
          <span className="text-3xl block mb-2">🛵</span>
          <h3 className="font-bold text-gray-900 text-lg">Entregador</h3>
          <p className="text-sm text-gray-500 mt-1">Assumir viagens e entregar</p>
        </Link>
      </div>
    </div>
  );
}
