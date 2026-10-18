// src/services/client-orders.js — pedidos do ponto de vista do cliente: criar, listar e cancelar.
// Os pedidos ficam no mesmo LocalStorage que o painel da empresa lê (dados.orders), então um
// pedido feito aqui aparece lá. Valores em centavos.
import { obterDados, salvarDados, lerSessao } from "./storage.js";
import { obterEmpresa } from "./companies.js";
import { obterProduto } from "./menu.js";
import { ESTADOS } from "../data/order-states.js";
import { MAX_QTD, PAGAMENTOS, ESTADOS_CANCELAVEIS } from "../data/order-rules.js";
import { somarLinhas } from "../utils/totals.js";

const falha = (erro) => ({ ok: false, erro });

/* ---------- consultas ---------- */
export const clienteAtual = () => obterDados().customers.find((c) => c.id === lerSessao().customerId) ?? null;

export const pedidosDoCliente = () =>
  obterDados().orders
    .filter((p) => p.customerId === lerSessao().customerId)
    .sort((a, b) => b.createdAt - a.createdAt);

export const obterPedidoDoCliente = (id) => pedidosDoCliente().find((p) => p.id === id) ?? null;

export const itensDoPedido = (pedidoId) => obterDados().orderItems.filter((i) => i.orderId === pedidoId);

export const resumoDosItens = (pedidoId) =>
  itensDoPedido(pedidoId).map((i) => `${i.qty}× ${i.name}`).join(", ");

export const podeCancelar = (pedido) => ESTADOS_CANCELAVEIS.includes(pedido.state);

export const enderecoEmTexto = ({ address }) =>
  `${address.street} — ${address.district}${address.complement ? ` (${address.complement})` : ""}`;

/* ---------- criar pedido ---------- */
// linhas: [{ productId, qty, note }]. Preços e nomes vêm do cardápio, nunca da tela.
// Retorna { ok: true, id } ou { ok: false, erro }.
export function criarPedido({ empresaId, linhas, contato, endereco, pagamento }) {
  const dados = obterDados();
  const empresa = obterEmpresa(empresaId);

  if (!empresa) return falha("Empresa não encontrada.");
  if (!empresa.active) return falha(`${empresa.name} está inativa e não aceita novos pedidos.`);
  if (!linhas.length) return falha("Seu carrinho está vazio.");
  if (!(pagamento in PAGAMENTOS)) return falha("Escolha uma forma de pagamento.");

  const itens = linhas.map((linha) => ({ ...linha, produto: obterProduto(linha.productId) }));

  for (const { produto, qty } of itens) {
    if (!produto || produto.companyId !== empresaId) return falha("Há um item no carrinho que não pertence a esta empresa. Remova-o para continuar.");
    if (!produto.available) return falha(`“${produto.name}” está indisponível. Remova o item para continuar.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTD) return falha("Quantidade inválida em um dos itens.");
  }

  const id = `PED-${dados.seq.order++}`;
  const agora = Date.now();
  const subtotal = somarLinhas(itens.map(({ produto, qty }) => ({ total: produto.price * qty })));

  dados.orders.push({
    id, companyId: empresaId, customerId: lerSessao().customerId, state: "recebido",
    address: endereco, contact: contato, payment: pagamento,
    subtotal, fee: empresa.fee, total: subtotal + empresa.fee,
    code: String(Math.floor(1000 + Math.random() * 9000)), // código de 4 dígitos da entrega
    createdAt: agora, reason: "",
    history: [{ state: "recebido", at: agora, by: "Cliente", note: "" }],
  });

  // O nome e o preço são copiados para o pedido: mudanças futuras no cardápio não alteram pedidos feitos.
  itens.forEach(({ produto, qty, note }) => {
    dados.orderItems.push({
      id: `it_${dados.seq.item++}`, orderId: id, productId: produto.id,
      name: produto.name, qty, unitPrice: produto.price, note: note ?? "",
    });
  });

  salvarDados();
  return { ok: true, id };
}

// Guarda os dados de contato e endereço no cadastro do cliente, para preencher o próximo checkout.
export function salvarDadosDoCliente({ contato, endereco }) {
  const cliente = clienteAtual();
  if (!cliente) return;
  Object.assign(cliente, { name: contato.name, phone: contato.phone, street: endereco.street, district: endereco.district, complement: endereco.complement });
  salvarDados();
}

/* ---------- cancelar pedido ---------- */
// Se o pedido já estava numa viagem que ainda não saiu, ele é retirado dela.
function liberarEntrega(pedidoId) {
  const dados = obterDados();
  const entrega = dados.deliveries.find((e) => e.orderId === pedidoId && e.state === "aguardando");
  if (!entrega) return;
  entrega.state = "cancelada";

  const viagem = dados.trips.find((v) => v.id === entrega.tripId);
  const aindaTemPedidos = dados.deliveries.some((e) => e.tripId === entrega.tripId && e.state === "aguardando");
  if (viagem?.state === "aguardando_retirada" && !aindaTemPedidos) {
    viagem.state = "cancelada";
    viagem.finishedAt = Date.now();
  }
}

export function cancelarPedido(id, motivo = "") {
  const pedido = obterPedidoDoCliente(id);
  if (!pedido) return falha("Este pedido não pertence à sua conta.");
  if (pedido.state === "em_entrega") return falha("O pedido já foi retirado pelo entregador e não pode ser cancelado.");
  if (!podeCancelar(pedido)) return falha(`O pedido ${id} já está ${ESTADOS[pedido.state].rotulo.toLowerCase()} e não pode mais ser alterado.`);

  const texto = motivo.trim() || "Cancelado pelo cliente.";
  pedido.state = "cancelado";
  pedido.reason = texto;
  pedido.history.push({ state: "cancelado", at: Date.now(), by: "Cliente", note: texto });
  liberarEntrega(id);
  salvarDados();
  return { ok: true };
}
