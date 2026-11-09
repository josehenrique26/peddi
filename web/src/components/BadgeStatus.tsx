interface BadgeStatusProps {
  status: string;
}

// Badge visual colorida para identificar o estado do pedido em qualquer tela
export function BadgeStatus({ status }: BadgeStatusProps) {
  const statusFormatado = status.toLowerCase().replace(/_/g, " ");

  const estilos: Record<string, string> = {
    recebido: "bg-blue-100 text-blue-800 border-blue-300",
    em_preparo: "bg-yellow-100 text-yellow-800 border-yellow-300",
    pronto: "bg-orange-100 text-orange-800 border-orange-300",
    saiu_para_entrega: "bg-purple-100 text-purple-800 border-purple-300",
    entregue: "bg-green-100 text-green-800 border-green-300",
    cancelado: "bg-red-100 text-red-800 border-red-300",
    bloqueado: "bg-red-200 text-red-900 border-red-400",
    nao_concluido: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const estiloAtual = estilos[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${estiloAtual}`}
    >
      {statusFormatado}
    </span>
  );
}
