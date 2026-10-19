import { obterDados, salvarDados } from "./storage.js";

export const CHAVE_PEDIDOS = "peddi_pedidos";
export const CHAVE_SELECIONADOS = "peddi_pedidos_selecionados";
export const CHAVE_VIAGEM = "peddi_viagem_atual";

export const pedidosDaEmpresa = (empresaId) => {
  const dados = obterDados();
  return Array.isArray(dados?.orders)
    ? dados.orders.filter((p) => p.companyId === empresaId)
    : [];
};

// Todas as movimentações (histórico) dos pedidos da empresa, da mais recente para a mais antiga.
export function atividadesRecentes(empresaId, limite = 8) {
  return pedidosDaEmpresa(empresaId)
    .flatMap((pedido) => pedido.history.map((evento) => ({ pedido, evento })))
    .sort((a, b) => b.evento.at - a.evento.at)
    .slice(0, limite);
}

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
  window.dispatchEvent(
    new CustomEvent("peddi_pedidos_alterados", { detail: pedidos }),
  );
}

/**
 * RF-ENT-01: Lista apenas os pedidos com status "Pronto" e sem entregador atribuído.
 */
export function listarPedidosProntos() {
  return obterPedidos().filter(
    (pedido) => pedido.status === "Pronto" && !pedido.entregador_id,
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
    return {
      sucesso: false,
      motivo: "nenhum_pedido_selecionado",
      ocupados: [],
      livres: [],
    };
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

  // RF-ENT-08 (Critério 1): Com viagem em andamento, Iniciar viagem fica bloqueado com aviso
  const viagemAtual = obterViagemAtual(courierId);
  if (viagemAtual && viagemAtual.status === "em_andamento") {
    return {
      sucesso: false,
      motivo: "viagem_em_andamento",
      erro: "Você já possui uma viagem em andamento. Conclua todas as entregas antes de iniciar uma nova viagem.",
    };
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
        bloqueado: false,
        saiu_em: new Date().toISOString(),
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  // RF-ENT-06: Sincroniza pedidos para 'em_entrega' no banco de dados compartilhado (peddi.v1.data)
  sincronizarPedidoEmEntregaComDadosGlobais(idsPedidos, courierId);

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
 * RF-ENT-04 & RF-ENT-08: Retorna os dados da viagem atual se ela estiver em andamento.
 * Pode ser filtrado por entregador para garantir 1 viagem por vez para cada um.
 */
export function obterViagemAtual(courierId = null) {
  const salvo = localStorage.getItem(CHAVE_VIAGEM);
  if (!salvo) return null;

  try {
    const viagem = JSON.parse(salvo);
    if (!viagem || viagem.status !== "em_andamento") return null;
    if (courierId && viagem.courierId && viagem.courierId !== courierId) return null;

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
 * RF-ENT-08: Cancela a entrega de um pedido na viagem (ex: cliente ausente/recusa)
 */
export function cancelarEntregaPedido(pedidoId, motivo = "Cancelado pelo cliente/estabelecimento") {
  const todosPedidos = obterPedidos();
  const pedidosAtualizados = todosPedidos.map((p) => {
    if (p.id === pedidoId) {
      return {
        ...p,
        status: "Cancelado",
        cancelado_em: new Date().toISOString(),
        motivo_cancelamento: motivo,
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  try {
    const dados = obterDados();
    if (dados && Array.isArray(dados.orders)) {
      const numLimpo = pedidoId.replace(/\D/g, "");
      const pedidoGlobal = dados.orders.find(
        (o) =>
          o.id === pedidoId ||
          o.id === `PED-${numLimpo}` ||
          String(o.id) === String(numLimpo)
      );
      if (pedidoGlobal) {
        pedidoGlobal.state = "cancelado";
        if (!pedidoGlobal.history) pedidoGlobal.history = [];
        pedidoGlobal.history.push({
          state: "cancelado",
          by: "Estabelecimento",
          at: Date.now(),
          note: motivo,
        });
        salvarDados();
        window.dispatchEvent(new Event("storage"));
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar cancelamento com dados globais:", err);
  }

  return { sucesso: true, pedidoId, status: "Cancelado" };
}

/**
 * RF-ENT-09: Motivos pré-definidos para registro de entrega não concluída
 */
export const MOTIVOS_FALHA_ENTREGA = [
  { id: "cliente_ausente", rotulo: "Cliente ausente" },
  { id: "endereco_nao_encontrado", rotulo: "Endereço não encontrado" },
  { id: "codigo_perdido", rotulo: "Código de confirmação perdido / cliente sem código" },
  { id: "outro", rotulo: "Outro motivo" },
];

/**
 * RF-ENT-09: Registra entrega não concluída com motivo e salva para visualização da empresa.
 * Critérios atendidos:
 * 1. Em pedido "Saiu para entrega", entregador registra "Entrega não concluída" informando o motivo.
 * 2. Disponível também quando limite de tentativas se esgota (RF-ENT-07).
 * 3. O pedido deixa de contar como pendente na viagem (ajuste RF-ENT-08).
 * 4. O motivo fica salvo no pedido e visível para a empresa.
 *
 * @param {string} pedidoId - Identificador do pedido (ex: "PED-1046" ou "1046")
 * @param {string} motivo - Motivo selecionado
 * @param {string} detalhe - Detalhes adicionais se aplicável
 * @returns {{ sucesso: boolean, pedidoId: string, status: string, motivo: string }}
 */
export function registrarFalhaEntrega(pedidoId, motivo, detalhe = "") {
  const detalheLimpo = String(detalhe || "").trim();
  const motivoFormatado = detalheLimpo ? `${motivo} (${detalheLimpo})` : motivo;
  const agoraIso = new Date().toISOString();

  const todosPedidos = obterPedidos();
  const pedidosAtualizados = todosPedidos.map((p) => {
    if (p.id === pedidoId) {
      return {
        ...p,
        status: "Não concluído",
        nao_concluido_em: agoraIso,
        motivo_falha: motivoFormatado,
        motivo_cancelamento: motivoFormatado,
        bloqueado: false,
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  // RF-ENT-09 (Critério 4): Salva motivo no pedido compartilhado e visível para a empresa
  try {
    const dados = obterDados();
    if (dados && Array.isArray(dados.orders)) {
      const numLimpo = pedidoId.replace(/\D/g, "");
      const pedidoGlobal = dados.orders.find(
        (o) =>
          o.id === pedidoId ||
          o.id === `PED-${numLimpo}` ||
          String(o.id) === String(numLimpo)
      );
      if (pedidoGlobal) {
        pedidoGlobal.state = "cancelado";
        pedidoGlobal.reason = `Falha na entrega: ${motivoFormatado}`;
        if (!pedidoGlobal.history) pedidoGlobal.history = [];
        pedidoGlobal.history.push({
          state: "cancelado",
          by: "Entregador",
          at: Date.now(),
          note: `Entrega não concluída pelo entregador: ${motivoFormatado}`,
        });
        salvarDados();
        window.dispatchEvent(new Event("storage"));
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar falha na entrega com dados globais:", err);
  }

  return {
    sucesso: true,
    pedidoId,
    status: "Não concluído",
    motivo: motivoFormatado,
  };
}

/**
 * RF-ENT-08 e RF-ENT-09: Finaliza a viagem quando todos os pedidos forem Entregues, Cancelados ou Não concluídos
 */
export function finalizarViagem() {
  try {
    const viagemAtual = obterViagemAtual();
    if (viagemAtual) {
      const dados = obterDados();
      if (dados && Array.isArray(dados.trips)) {
        const trip = dados.trips.find((t) => t.id === viagemAtual.id);
        if (trip) {
          trip.state = "concluida";
          trip.finishedAt = Date.now();
        }
      }
      salvarDados();
      window.dispatchEvent(new Event("storage"));
    }
  } catch (err) {
    console.error("Erro ao finalizar viagem no storage global:", err);
  }

  localStorage.removeItem(CHAVE_VIAGEM);
  localStorage.removeItem(CHAVE_SELECIONADOS);
  window.dispatchEvent(new CustomEvent("peddi_viagem_encerrada"));
}

/**
 * Utilitário para testes: simula outro entregador pegando um pedido
 */
export function simularOutroEntregadorPegou(
  pedidoId,
  outroEntregadorId = "ct_2",
) {
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

/**
 * RF-ENT-06: Sincroniza pedidos para 'em_entrega' nos dados compartilhados (peddi.v1.data)
 */
export function sincronizarPedidoEmEntregaComDadosGlobais(idsPedidos, courierId) {
  try {
    const dados = obterDados();
    if (!dados || !Array.isArray(dados.orders)) return;

    const agora = Date.now();
    idsPedidos.forEach((id) => {
      const numLimpo = id.replace(/\D/g, "");
      const pedidoGlobal = dados.orders.find(
        (o) => o.id === id || o.id === `PED-${numLimpo}` || String(o.id) === String(numLimpo)
      );
      if (pedidoGlobal) {
        pedidoGlobal.state = "em_entrega";
        if (!pedidoGlobal.history) pedidoGlobal.history = [];
        pedidoGlobal.history.push({
          state: "em_entrega",
          by: "Entregador",
          at: agora,
        });
      }
    });

    salvarDados();
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Erro ao sincronizar pedido em entrega com dados globais:", err);
  }
}

/**
 * RF-ENT-06: Sincroniza pedido entregue com o storage global (peddi.v1.data)
 * Garante que cliente e empresa vejam o pedido como 'Entregue' (Critério 3)
 */
export function sincronizarPedidoEntregueComDadosGlobais(pedidoAlvo, agoraIso = new Date().toISOString()) {
  try {
    const dados = obterDados();
    if (!dados || !Array.isArray(dados.orders)) return;

    const timestampMs = new Date(agoraIso).getTime();
    const pedidoId = pedidoAlvo.id;
    const numLimpo = pedidoId.replace(/\D/g, "");

    let pedidoGlobal = dados.orders.find(
      (o) => o.id === pedidoId ||
             o.id === `PED-${numLimpo}` ||
             String(o.id) === String(numLimpo)
    );

    if (pedidoGlobal) {
      pedidoGlobal.state = "entregue";
      if (!pedidoGlobal.history) pedidoGlobal.history = [];
      pedidoGlobal.history.push({
        state: "entregue",
        by: "Entregador",
        at: timestampMs,
        note: "Confirmado com código de 4 dígitos",
      });
    } else {
      // Sincroniza criando a entrada em dados.orders para o dashboard da empresa e cliente
      const valorNumerico = parseFloat(
        String(pedidoAlvo.valor || "50")
          .replace(/[^\d,]/g, "")
          .replace(",", ".")
      );
      const totalCentavos = Math.round((valorNumerico || 50) * 100);

      pedidoGlobal = {
        id: `PED-${numLimpo || "1046"}`,
        companyId: "co_forno",
        customerId: "cu_1",
        state: "entregue",
        address: {
          street: pedidoAlvo.endereco_completo || "Endereço do cliente",
          district: pedidoAlvo.bairro || "Centro",
          complement: pedidoAlvo.complemento || "",
        },
        contact: {
          name: pedidoAlvo.cliente || "Cliente",
          phone: pedidoAlvo.telefone || "(83) 98800-0000",
        },
        payment: "pix",
        subtotal: totalCentavos - 500,
        fee: 500,
        total: totalCentavos,
        code: pedidoAlvo.codigo_entrega,
        createdAt: timestampMs - 45 * 60000,
        history: [
          { state: "recebido", by: "Cliente", at: timestampMs - 45 * 60000 },
          { state: "em_preparo", by: "Estabelecimento", at: timestampMs - 35 * 60000 },
          { state: "pronto", by: "Estabelecimento", at: timestampMs - 20 * 60000 },
          { state: "em_entrega", by: "Entregador", at: timestampMs - 10 * 60000 },
          { state: "entregue", by: "Entregador", at: timestampMs, note: "Confirmado com código de 4 dígitos" },
        ],
      };
      dados.orders.push(pedidoGlobal);
    }

    if (Array.isArray(dados.deliveries)) {
      const delivery = dados.deliveries.find(
        (d) => d.orderId === pedidoGlobal.id || d.orderId === pedidoId
      );
      if (delivery) {
        delivery.state = "entregue";
        delivery.completedAt = timestampMs;
      }
    }

    salvarDados();
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Erro ao sincronizar pedido entregue com dados globais:", err);
  }
}

/**
 * RF-ENT-07: Registra o bloqueio da entrega no storage compartilhado (peddi.v1.data)
 */
export function sincronizarPedidoBloqueadoComDadosGlobais(pedidoAlvo) {
  try {
    const dados = obterDados();
    if (!dados || !Array.isArray(dados.orders)) return;

    const timestampMs = Date.now();
    const pedidoId = pedidoAlvo.id;
    const numLimpo = pedidoId.replace(/\D/g, "");

    const pedidoGlobal = dados.orders.find(
      (o) =>
        o.id === pedidoId ||
        o.id === `PED-${numLimpo}` ||
        String(o.id) === String(numLimpo)
    );

    if (pedidoGlobal) {
      if (!pedidoGlobal.history) pedidoGlobal.history = [];
      pedidoGlobal.history.push({
        state: pedidoGlobal.state || "em_entrega",
        by: "Entregador",
        at: timestampMs,
        note: "Entrega bloqueada: 3 tentativas de código incorretas",
      });
      salvarDados();
      window.dispatchEvent(new Event("storage"));
    }
  } catch (err) {
    console.error("Erro ao sincronizar bloqueio com dados globais:", err);
  }
}

/**
 * RF-ENT-07: Reseta as tentativas de código para 3 e desbloqueia o pedido (para fins de teste/suporte)
 */
export function resetarTentativasPedido(pedidoId) {
  const todosPedidos = obterPedidos();
  const pedidosAtualizados = todosPedidos.map((p) => {
    if (p.id === pedidoId) {
      return {
        ...p,
        tentativas_restantes: 3,
        bloqueado: false,
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);
  return { sucesso: true, tentativas_restantes: 3, bloqueado: false };
}

/**
 * RF-ENT-05, RF-ENT-06 e RF-ENT-07: Validação por código de 4 dígitos, controle de tentativas e finalização
 */
export function validarEConfirmarEntrega(pedidoId, codigoDigitado) {
  const codigoLimpo = String(codigoDigitado || "").trim();

  const viagem = obterViagemAtual();
  if (!viagem) {
    return {
      sucesso: false,
      bloqueado: false,
      erro: "Nenhuma viagem em andamento encontrada.",
    };
  }

  const pedidos = viagem.pedidosDetalhados;
  const indiceAlvo = pedidos.findIndex((p) => p.id === pedidoId);

  if (indiceAlvo === -1) {
    return {
      sucesso: false,
      bloqueado: false,
      erro: "Pedido não encontrado nesta viagem.",
    };
  }

  // RF-ENT-05, RF-ENT-08 & RF-ENT-09: Confirmação na ordem das paradas (ignora já Entregues, Cancelados ou Não concluídos)
  const paradaPendenteAnterior = pedidos
    .slice(0, indiceAlvo)
    .find((p) => p.status !== "Entregue" && p.status !== "Cancelado" && p.status !== "Não concluído");

  if (paradaPendenteAnterior) {
    const numeroParadaPendente = pedidos.indexOf(paradaPendenteAnterior) + 1;
    return {
      sucesso: false,
      bloqueado: false,
      erro: `Você deve concluir a Parada ${numeroParadaPendente} antes de confirmar esta entrega.`,
    };
  }

  const pedidoAlvo = pedidos[indiceAlvo];
  if (pedidoAlvo.status === "Entregue" || pedidoAlvo.status === "Cancelado" || pedidoAlvo.status === "Não concluído") {
    return {
      sucesso: false,
      bloqueado: false,
      erro: `Esta parada já foi finalizada como "${pedidoAlvo.status}" anteriormente.`,
    };
  }

  const tentativasAtuais =
    typeof pedidoAlvo.tentativas_restantes === "number"
      ? pedidoAlvo.tentativas_restantes
      : 3;

  // RF-ENT-07 (Critério 3): Bloqueio se tentativas esgotadas
  if (pedidoAlvo.bloqueado || tentativasAtuais <= 0) {
    return {
      sucesso: false,
      bloqueado: true,
      tentativasRestantes: 0,
      erro: "Limite de 3 tentativas esgotado. Entrega bloqueada! Entre em contato com o estabelecimento.",
    };
  }

  // Critérios 1 e 2: deve conter exatamente 4 dígitos numéricos
  if (!/^\d{4}$/.test(codigoLimpo)) {
    return {
      sucesso: false,
      bloqueado: false,
      tentativasRestantes: tentativasAtuais,
      erro: "O código deve ter exatamente 4 dígitos numéricos.",
    };
  }

  // RF-ENT-07 (Critérios 1, 2 e 3): Código incorreto mostra erro, decrementa tentativa e bloqueia se chegar a 0
  if (pedidoAlvo.codigo_entrega && pedidoAlvo.codigo_entrega !== codigoLimpo) {
    const novasTentativas = Math.max(0, tentativasAtuais - 1);
    const estaBloqueado = novasTentativas === 0;

    const todosPedidos = obterPedidos();
    const pedidosAtualizados = todosPedidos.map((p) => {
      if (p.id === pedidoId) {
        return {
          ...p,
          tentativas_restantes: novasTentativas,
          bloqueado: estaBloqueado,
        };
      }
      return p;
    });

    salvarPedidos(pedidosAtualizados);

    if (estaBloqueado) {
      sincronizarPedidoBloqueadoComDadosGlobais(pedidoAlvo);
      return {
        sucesso: false,
        bloqueado: true,
        tentativasRestantes: 0,
        erro: "Limite de 3 tentativas esgotado! Esta entrega foi bloqueada por segurança. Entre em contato com o estabelecimento.",
      };
    }

    return {
      sucesso: false,
      bloqueado: false,
      tentativasRestantes: novasTentativas,
      erro: `Código incorreto! Resta${novasTentativas === 1 ? " apenas" : "m"} ${novasTentativas} tentativa${novasTentativas > 1 ? "s" : ""}. Peça ao cliente para verificar o código.`,
    };
  }

  // RF-ENT-06 (Critério 1): Código correto muda o pedido para Entregue e grava a hora
  const agoraIso = new Date().toISOString();
  const todosPedidos = obterPedidos();
  const pedidosAtualizados = todosPedidos.map((p) => {
    if (p.id === pedidoId) {
      return {
        ...p,
        status: "Entregue",
        entregue_em: agoraIso,
      };
    }
    return p;
  });

  salvarPedidos(pedidosAtualizados);

  // RF-ENT-06 (Critério 3): Cliente e empresa veem o pedido como Entregue
  sincronizarPedidoEntregueComDadosGlobais(pedidoAlvo, agoraIso);

  // RF-ENT-06, RF-ENT-08 & RF-ENT-09 (Critério 3): Progresso da viagem atualizado (todos Entregues, Cancelados ou Não concluídos)
  const viagemAtualizada = obterViagemAtual();
  const todosConcluidos = viagemAtualizada?.pedidosDetalhados.every(
    (p) => p.status === "Entregue" || p.status === "Cancelado" || p.status === "Não concluído"
  );

  return {
    sucesso: true,
    bloqueado: false,
    tentativasRestantes: tentativasAtuais,
    mensagem: `Entrega do Pedido ${pedidoId} confirmada com sucesso!`,
    todosEntregues: Boolean(todosConcluidos),
    todosConcluidos: Boolean(todosConcluidos),
    pedido: pedidosAtualizados.find((p) => p.id === pedidoId),
  };
}
