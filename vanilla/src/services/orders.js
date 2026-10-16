// src/services/orders.js — Serviço de pedidos, reserva e viagens (RF-ENT-01 ao RF-ENT-04)

export const CHAVE_PEDIDOS = "peddi_pedidos";
export const CHAVE_SELECIONADOS = "peddi_pedidos_selecionados";
export const CHAVE_VIAGEM = "peddi_viagem_atual";

// Dados iniciais de demonstração com endereço completo e complemento
export const PEDIDOS_INICIAIS = [
  {
    id: "#1046",
    status: "Pronto",
    entregador_id: null,
    bairro: "Saúde",
    itens: "2× Margherita",
    valor: "R$ 76,00",
    tempo: "há 21 min de espera",
    endereco_completo: "Rua São Sebastião, 342",
    complemento: "Apto 42, bloco B",
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
    endereco_completo: "Av. Bernardino de Campos, 120",
    complemento: "Conjunto 501",
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
    endereco_completo: "Rua Bom Pastor, 800",
    complemento: "Casa dos fundos",
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
    endereco_completo: "Rua Domingos de Morais, 1500",
    complemento: "Apto 12",
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
 */
export function conferirPedidosLivres(idsPedidos) {
  const pedidos = obterPedidos();
  const livres = [];
  const ocupados = [];

  for (const id of idsPedidos) {
    const pedido = pedidos.find((p) => p.id === id);

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
 */
export function reservarPedidosAtomicamente(idsPedidos, courierId = "ct_1") {
  if (!idsPedidos || idsPedidos.length === 0) {
    return { sucesso: false, motivo: "nenhum_pedido_selecionado", ocupados: [], livres: [] };
  }

  const checagem = conferirPedidosLivres(idsPedidos);

  if (!checagem.todosLivres) {
    return {
      sucesso: false,
      motivo: "pedidos_ocupados",
      ocupados: checagem.ocupados.map((item) => item.id),
      detalhesOcupados: checagem.ocupados,
      livres: checagem.livres.map((item) => item.id),
    };
  }

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
  localStorage.setItem(CHAVE_SELECIONADOS, JSON.stringify(idsPedidos));

  return {
    sucesso: true,
    reservados: idsPedidos,
    courierId,
  };
}

/**
 * RF-ENT-04: Critério 2 - Gera um código numérico aleatório de 4 dígitos (ex.: "4829")
 */
export function gerarCodigo4Digitos() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * RF-ENT-04: Início da viagem
 * Critérios atendidos:
 * - 1. Cria a viagem em andamento e muda os pedidos para "Saiu para entrega"
 * - 2. Gera um código de 4 dígitos por pedido
 * - 3. Libera os dados completos no pedido
 * - 5. Grava no LocalStorage para retomar caso o sistema seja reaberto
 *
 * @param {string[]} idsPedidos - IDs selecionados para a viagem
 * @param {string} courierId - ID do entregador ativo
 * @returns {{ sucesso: boolean, viagem?: object, motivo?: string }}
 */
export function iniciarViagem(idsPedidos, courierId = "ct_1") {
  if (!idsPedidos || idsPedidos.length === 0) {
    return { sucesso: false, motivo: "nenhum_pedido" };
  }

  // Primeiro faz a conferência atômica da reserva (RF-ENT-03)
  const reserva = reservarPedidosAtomicamente(idsPedidos, courierId);
  if (!reserva.sucesso) {
    return reserva;
  }

  // Atualiza pedidos: status para "Saiu para entrega" e gera código de 4 dígitos
  const todos = obterPedidos();
  const pedidosAtualizados = todos.map((p) => {
    if (idsPedidos.includes(p.id)) {
      const codigo = p.codigo_entrega || gerarCodigo4Digitos();
      return {
        ...p,
        status: "Saiu para entrega",
        entregador_id: courierId,
        codigo_entrega: codigo,
        tentativas_restantes: 3,
        saiu_em: new Date().toISOString(),
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  // Cria a viagem em andamento
  const viagem = {
    id: "trip_" + Date.now(),
    courierId,
    status: "em_andamento",
    pedidos: idsPedidos,
    criada_em: new Date().toISOString(),
  };

  localStorage.setItem(CHAVE_VIAGEM, JSON.stringify(viagem));

  return {
    sucesso: true,
    viagem,
    pedidos: pedidosAtualizados.filter((p) => idsPedidos.includes(p.id)),
  };
}

/**
 * RF-ENT-04: Critério 5 - "Reabrir o sistema retoma a viagem atual"
 * Retorna os dados da viagem atual se ela estiver em andamento.
 */
export function obterViagemAtual() {
  const salvo = localStorage.getItem(CHAVE_VIAGEM);
  if (!salvo) return null;

  try {
    const viagem = JSON.parse(salvo);
    if (!viagem || viagem.status !== "em_andamento") return null;

    // Busca os dados completos e atualizados de cada pedido da viagem
    const todosPedidos = obterPedidos();
    const pedidosDetalhados = viagem.pedidos
      .map((id) => todosPedidos.find((p) => p.id === id))
      .filter(Boolean);

    return {
      ...viagem,
      pedidosDetalhados,
    };
  } catch {
    return null;
  }
}

/**
 * Finaliza a viagem atual
 */
export function finalizarViagem() {
  localStorage.removeItem(CHAVE_VIAGEM);
  localStorage.removeItem(CHAVE_SELECIONADOS);
}

/**
 * Utilitário para testes: simula outro entregador pegando um pedido
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
