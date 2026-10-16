// src/services/orders.js — Serviço de pedidos e reserva de viagens (RF-ENT-01, RF-ENT-02 e RF-ENT-03)

export const CHAVE_PEDIDOS = "peddi_pedidos";
export const CHAVE_SELECIONADOS = "peddi_pedidos_selecionados";

// Dados iniciais de demonstração para pedidos prontos
export const PEDIDOS_INICIAIS = [
  {
    id: "#1046",
    status: "Pronto",
    entregador_id: null,
    bairro: "Saúde",
    itens: "2× Margherita",
    valor: "R$ 76,00",
    tempo: "há 21 min de espera",
    endereco_completo: "Rua São Sebastião, 342, Saúde",
    cliente: "Ana Beatriz Lima",
    telefone: "(11) 98765-4321",
  },
  {
    id: "#1050",
    status: "Pronto",
    entregador_id: null,
    bairro: "Paraíso",
    itens: "1× Calabresa especial",
    valor: "R$ 48,00",
    tempo: "há 8 min de espera",
    endereco_completo: "Av. Bernardino de Campos, 120, Paraíso",
    cliente: "Marcos Vinícius Rocha",
    telefone: "(11) 97654-3210",
  },
  {
    id: "#1051",
    status: "Pronto",
    entregador_id: null,
    bairro: "Ipiranga",
    itens: "2× Portuguesa, 1× Guaraná 2 L",
    valor: "R$ 95,00",
    tempo: "há 15 min de espera",
    endereco_completo: "Rua Bom Pastor, 800, Ipiranga",
    cliente: "Juliana Mendes",
    telefone: "(11) 96543-2109",
  },
  {
    id: "#1052",
    status: "Pronto",
    entregador_id: null,
    bairro: "Vila Mariana",
    itens: "1× Quatro Queijos, 1× Suco de laranja 400 ml",
    valor: "R$ 67,00",
    tempo: "há 33 min de espera",
    endereco_completo: "Rua Domingos de Morais, 1500, Vila Mariana",
    cliente: "Carlos Eduardo",
    telefone: "(11) 95432-1098",
  },
];

/**
 * Retorna todos os pedidos armazenados no LocalStorage.
 * Se ainda não existirem, inicializa com PEDIDOS_INICIAIS.
 */
export function obterPedidos() {
  const salvo = localStorage.getItem(CHAVE_PEDIDOS);
  if (!salvo) {
    salvarPedidos(PEDIDOS_INICIAIS);
    return PEDIDOS_INICIAIS;
  }
  try {
    return JSON.parse(salvo);
  } catch {
    return PEDIDOS_INICIAIS;
  }
}

/**
 * Salva a lista de pedidos no LocalStorage e notifica listeners.
 */
export function salvarPedidos(pedidos) {
  localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos));
  window.dispatchEvent(new CustomEvent("peddi_pedidos_alterados", { detail: pedidos }));
}

/**
 * RF-ENT-01: Lista apenas os pedidos com status "Pronto" e sem entregador atribuído.
 */
export function listarPedidosProntos() {
  return obterPedidos().filter(
    (pedido) => pedido.status === "Pronto" && !pedido.entregador_id
  );
}

/**
 * RF-ENT-03: Critério 1 - "Ao iniciar, o serviço confere se cada pedido ainda está livre"
 * Confere o estado atual de cada pedido pelo ID no LocalStorage.
 *
 * @param {string[]} idsPedidos - Lista de IDs dos pedidos a conferir (ex: ["#1046", "#1050"])
 * @returns {{ todosLivres: boolean, livres: object[], ocupados: object[] }}
 */
export function conferirPedidosLivres(idsPedidos) {
  const pedidos = obterPedidos();
  const livres = [];
  const ocupados = [];

  for (const id of idsPedidos) {
    const pedido = pedidos.find((p) => p.id === id);

    // O pedido está livre se:
    // 1. Ele existe
    // 2. O status ainda é "Pronto"
    // 3. O campo entregador_id é nulo/vazio
    if (!pedido) {
      ocupados.push({ id, motivo: "inexistente" });
    } else if (pedido.status !== "Pronto" || Boolean(pedido.entregador_id)) {
      ocupados.push({
        id,
        motivo: pedido.entregador_id ? "outro_entregador" : "status_invalido",
        entregador_id: pedido.entregador_id,
        status: pedido.status,
      });
    } else {
      livres.push(pedido);
    }
  }

  return {
    todosLivres: ocupados.length === 0,
    livres,
    ocupados,
  };
}

/**
 * RF-ENT-03: Trava de reserva atômica ("tudo ou nada")
 * Critérios atendidos:
 * - Ao iniciar, o serviço confere se cada pedido ainda está livre
 * - Se outro entregador pegou, a reserva é abortada para manter atomicidade
 * - Reserva é tudo ou nada: nenhum pedido é reservado se pelo menos um estiver ocupado
 *
 * @param {string[]} idsPedidos - IDs selecionados pelo entregador
 * @param {string} courierId - ID do entregador (ex: "ct_1" ou nome)
 * @returns {{ sucesso: boolean, motivo?: string, ocupados: string[], livres: string[], reservados?: string[] }}
 */
export function reservarPedidosAtomicamente(idsPedidos, courierId = "ct_1") {
  if (!idsPedidos || idsPedidos.length === 0) {
    return { sucesso: false, motivo: "nenhum_pedido_selecionado", ocupados: [], livres: [] };
  }

  // 1. Confere no armazenamento se TODOS os pedidos ainda estão livres
  const checagem = conferirPedidosLivres(idsPedidos);

  // 2. Se houver qualquer pedido ocupado/indisponível:
  // REGRA TUDO OU NADA: NÃO altera o banco, cancela a transação de reserva por completo!
  if (!checagem.todosLivres) {
    return {
      sucesso: false,
      motivo: "pedidos_ocupados",
      ocupados: checagem.ocupados.map((item) => item.id),
      detalhesOcupados: checagem.ocupados,
      livres: checagem.livres.map((item) => item.id),
    };
  }

  // 3. Se TODOS estão 100% livres: realiza a reserva atômica de todos juntos
  const pedidos = obterPedidos();
  const pedidosAtualizados = pedidos.map((p) => {
    if (idsPedidos.includes(p.id)) {
      return {
        ...p,
        entregador_id: courierId,
        reservado_em: new Date().toISOString(),
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  // Persiste a seleção oficial da viagem para as próximas etapas
  localStorage.setItem(CHAVE_SELECIONADOS, JSON.stringify(idsPedidos));

  return {
    sucesso: true,
    reservados: idsPedidos,
    courierId,
  };
}

/**
 * Função utilitária para teste e demonstração:
 * Simula que outro entregador reservou um pedido simultaneamente.
 */
export function simularOutroEntregadorPegou(pedidoId, outroEntregadorId = "ct_2") {
  const pedidos = obterPedidos();
  const pedidosAtualizados = pedidos.map((p) => {
    if (p.id === pedidoId) {
      return {
        ...p,
        entregador_id: outroEntregadorId,
        reservado_em: new Date().toISOString(),
      };
    }
    return p;
  });
  salvarPedidos(pedidosAtualizados);
}
