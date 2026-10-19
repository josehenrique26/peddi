// src/services/courier-orders.js — o que o ENTREGADOR pode fazer: montar viagem, retirar e confirmar entregas.
// Usa os mesmos dados do cliente e da empresa (dados.orders, dados.trips, dados.deliveries):
// o que o entregador faz aparece na hora no quadro da empresa e no acompanhamento do cliente.
import { obterDados, salvarDados, lerSessao } from "./storage.js";
import { ESTADOS } from "../data/order-states.js";
import { MAX_PEDIDOS_VIAGEM, MAX_TENTATIVAS, MOTIVOS_FALHA } from "../data/order-rules.js";

const falha = (erro) => ({ ok: false, erro });

const VIAGEM_ATIVA = ["aguardando_retirada", "em_andamento"];
const ENTREGA_ABERTA = ["aguardando", "em_entrega"];

/* ---------- consultas ---------- */
export const entregadorAtual = () => obterDados().couriers.find((c) => c.id === lerSessao().courierId) ?? null;
export const obterViagem = (id) => obterDados().trips.find((v) => v.id === id) ?? null;
export const obterPedido = (id) => obterDados().orders.find((p) => p.id === id) ?? null;
export const entregasDaViagem = (viagemId) => obterDados().deliveries.filter((e) => e.tripId === viagemId);

export const viagensDoEntregador = (entregadorId) =>
  obterDados().trips
    .filter((v) => v.courierId === entregadorId)
    .sort((a, b) => VIAGEM_ATIVA.includes(b.state) - VIAGEM_ATIVA.includes(a.state) || b.createdAt - a.createdAt);

export const viagemAtiva = (entregadorId) =>
  viagensDoEntregador(entregadorId).find((v) => VIAGEM_ATIVA.includes(v.state)) ?? null;

export const entregasConcluidas = (entregadorId) =>
  obterDados().deliveries
    .filter((e) => e.state === "entregue" && obterViagem(e.tripId)?.courierId === entregadorId)
    .sort((a, b) => b.completedAt - a.completedAt);

const entregaAtivaDoPedido = (pedidoId) =>
  obterDados().deliveries.find((e) => e.orderId === pedidoId && ENTREGA_ABERTA.includes(e.state) && VIAGEM_ATIVA.includes(obterViagem(e.tripId)?.state));

export const ultimoEvento = (pedido) => pedido.history[pedido.history.length - 1];

// Pedidos prontos da empresa que ainda não estão em nenhuma viagem, os mais antigos primeiro.
export const pedidosProntos = (empresaId) =>
  obterDados().orders
    .filter((p) => p.companyId === empresaId && p.state === "pronto" && !entregaAtivaDoPedido(p.id))
    .sort((a, b) => ultimoEvento(a).at - ultimoEvento(b).at);

// Tentativas de código que ainda restam numa entrega.
export const tentativasRestantes = (entrega) => MAX_TENTATIVAS - (entrega.attempts ?? 0);

/* ---------- viagem ---------- */
// Confere tudo de novo na hora de gravar: outro entregador pode ter pego o pedido enquanto a tela estava aberta.
export function criarViagem(entregadorId, pedidoIds) {
  const dados = obterDados();
  const entregador = dados.couriers.find((c) => c.id === entregadorId);

  if (!entregador) return falha("Entregador não encontrado.");
  if (!entregador.active) return falha("Seu cadastro está inativo. Peça ao estabelecimento para reativá-lo antes de assumir viagens.");
  if (viagemAtiva(entregadorId)) return falha("Você já tem uma viagem em andamento. Conclua as entregas antes de iniciar outra.");
  if (!pedidoIds.length) return falha("Selecione ao menos um pedido.");
  if (pedidoIds.length > MAX_PEDIDOS_VIAGEM) return falha(`Uma viagem aceita no máximo ${MAX_PEDIDOS_VIAGEM} pedidos.`);

  for (const id of pedidoIds) {
    const pedido = obterPedido(id);
    if (!pedido) return falha("Pedido não encontrado.");
    if (pedido.companyId !== entregador.companyId) return falha("Você só pode levar pedidos da empresa à qual está vinculado.");
    if (pedido.state !== "pronto") return falha(`${id} não está mais pronto para retirada (${ESTADOS[pedido.state].rotulo}).`);
    if (entregaAtivaDoPedido(id)) return falha(`${id} já foi escolhido por outro entregador.`);
  }

  const id = `VG-${dados.seq.trip++}`;
  dados.trips.push({ id, companyId: entregador.companyId, courierId: entregadorId, orderIds: [...pedidoIds], state: "aguardando_retirada", createdAt: Date.now(), pickedUpAt: null, finishedAt: null });
  pedidoIds.forEach((pedidoId) => {
    dados.deliveries.push({ id: `DL-${dados.seq.delivery++}`, tripId: id, orderId: pedidoId, code: obterPedido(pedidoId).code, state: "aguardando", completedAt: null });
  });
  salvarDados();
  return { ok: true, id };
}

function obterViagemDoEntregador(viagemId, entregadorId) {
  const viagem = obterViagem(viagemId);
  return viagem && viagem.courierId === entregadorId ? viagem : null;
}

export function desfazerViagem(viagemId, entregadorId) {
  const viagem = obterViagemDoEntregador(viagemId, entregadorId);
  if (!viagem) return falha("Viagem não encontrada.");
  if (viagem.state !== "aguardando_retirada") return falha("Depois da retirada a viagem não pode ser desfeita.");

  entregasDaViagem(viagem.id).filter((e) => e.state === "aguardando").forEach((e) => { e.state = "cancelada"; });
  viagem.state = "cancelada";
  viagem.finishedAt = Date.now();
  salvarDados();
  return { ok: true };
}

// Todos os pedidos da viagem passam juntos para "em_entrega".
export function registrarRetirada(viagemId, entregadorId) {
  const viagem = obterViagemDoEntregador(viagemId, entregadorId);
  if (!viagem) return falha("Viagem não encontrada.");
  if (viagem.state !== "aguardando_retirada") return falha("A retirada desta viagem já foi registrada.");

  const entregas = entregasDaViagem(viagem.id).filter((e) => e.state === "aguardando");
  if (!entregas.length) return falha("Não há pedidos ativos nesta viagem.");

  const agora = Date.now();
  for (const entrega of entregas) {
    const pedido = obterPedido(entrega.orderId);
    if (pedido.state !== "pronto") return falha(`${pedido.id} não está mais pronto para retirada.`);
  }
  for (const entrega of entregas) {
    const pedido = obterPedido(entrega.orderId);
    pedido.state = "em_entrega";
    pedido.history.push({ state: "em_entrega", at: agora, by: "Entregador", note: `Retirado na viagem ${viagem.id}` });
    entrega.state = "em_entrega";
  }
  viagem.state = "em_andamento";
  viagem.pickedUpAt = agora;
  salvarDados();
  return { ok: true };
}

// A viagem termina quando nenhuma entrega dela está aberta.
function encerrarViagemSeCompleta(viagem) {
  if (entregasDaViagem(viagem.id).some((e) => ENTREGA_ABERTA.includes(e.state))) return;
  viagem.state = "concluida";
  viagem.finishedAt = Date.now();
}

/* ---------- entrega ---------- */
// Só a primeira entrega ainda aberta da viagem pode ser concluída (paradas em ordem).
export function paradaAtual(viagem) {
  return viagem.orderIds.find((id) => entregasDaViagem(viagem.id).some((e) => e.orderId === id && e.state === "em_entrega")) ?? null;
}

function entregaDoEntregador(pedidoId, entregadorId) {
  const entrega = obterDados().deliveries.find((e) => e.orderId === pedidoId && e.state === "em_entrega" && obterViagem(e.tripId)?.courierId === entregadorId);
  return entrega ?? null;
}

export function confirmarEntrega(pedidoId, codigo, entregadorId) {
  const pedido = obterPedido(pedidoId);
  const entrega = entregaDoEntregador(pedidoId, entregadorId);
  if (!pedido || !entrega || pedido.state !== "em_entrega") return falha("Este pedido não está em entrega na sua viagem.");

  const viagem = obterViagem(entrega.tripId);
  if (paradaAtual(viagem) !== pedidoId) return falha("Conclua as paradas anteriores antes desta entrega.");
  if (tentativasRestantes(entrega) <= 0) return { ok: false, bloqueada: true, erro: "Limite de tentativas esgotado. Entre em contato com o estabelecimento." };
  if (!/^\d{4}$/.test(String(codigo).trim())) return falha("O código deve ter exatamente 4 dígitos numéricos.");

  if (String(codigo).trim() !== pedido.code) {
    entrega.attempts = (entrega.attempts ?? 0) + 1;
    const restam = tentativasRestantes(entrega);
    pedido.history.push({ state: pedido.state, at: Date.now(), by: "Entregador", note: restam ? "Código de confirmação incorreto" : `Entrega bloqueada: ${MAX_TENTATIVAS} tentativas de código incorretas` });
    salvarDados();
    return restam
      ? { ok: false, restam, erro: `Código incorreto. Resta${restam === 1 ? " apenas" : "m"} ${restam} tentativa${restam > 1 ? "s" : ""}. Peça ao cliente para conferir o código.` }
      : { ok: false, bloqueada: true, erro: "Limite de tentativas esgotado. Entre em contato com o estabelecimento." };
  }

  const agora = Date.now();
  pedido.state = "entregue";
  pedido.history.push({ state: "entregue", at: agora, by: "Entregador", note: "Código de confirmação validado" });
  entrega.state = "entregue";
  entrega.completedAt = agora;
  encerrarViagemSeCompleta(viagem);
  salvarDados();
  return { ok: true };
}

// Entrega não concluída: o pedido é cancelado com o motivo, que a empresa e o cliente enxergam.
export function registrarFalha(pedidoId, motivoId, detalhe, entregadorId) {
  const motivo = MOTIVOS_FALHA.find((m) => m.id === motivoId);
  const pedido = obterPedido(pedidoId);
  const entrega = entregaDoEntregador(pedidoId, entregadorId);
  if (!motivo) return falha("Escolha o motivo da entrega não concluída.");
  if (!pedido || !entrega) return falha("Este pedido não está em entrega na sua viagem.");
  if (motivoId === "outro" && !detalhe.trim()) return falha("Descreva o motivo.");

  const texto = detalhe.trim() ? `${motivo.rotulo} (${detalhe.trim()})` : motivo.rotulo;
  pedido.state = "cancelado";
  pedido.reason = `Falha na entrega: ${texto}`;
  pedido.history.push({ state: "cancelado", at: Date.now(), by: "Entregador", note: pedido.reason });
  entrega.state = "nao_concluida";
  entrega.failReason = texto;
  entrega.completedAt = Date.now();
  encerrarViagemSeCompleta(obterViagem(entrega.tripId));
  salvarDados();
  return { ok: true };
}

// Só para a demonstração: libera de novo as tentativas de uma entrega bloqueada.
export function liberarTentativas(pedidoId, entregadorId) {
  const entrega = entregaDoEntregador(pedidoId, entregadorId);
  if (!entrega) return falha("Entrega não encontrada.");
  entrega.attempts = 0;
  salvarDados();
  return { ok: true };
}
