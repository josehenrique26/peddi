// src/pages/admin-orders.js — Quadro Kanban de pedidos da empresa (admin-pedidos.html).
// As colunas já estão no HTML. Aqui criamos os cartões com document.createElement
// e chamamos o serviço admin-orders.js quando a empresa clica num botão.

import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { brl, quando, hora, dataCurta, plural } from "../utils/format.js";
import { ESTADOS } from "../data/order-states.js";
import { PAGAMENTOS } from "../data/order-rules.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosDaEmpresa } from "../services/orders.js";
import { itensDoPedido, resumoDosItens, enderecoEmTexto } from "../services/client-orders.js";
import { avancarPedido, rejeitarPedido, obterPedidoDaEmpresa } from "../services/admin-orders.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral, ligarMenuMovel } from "../components/admin-shell.js";
import { seloDeEstado } from "../components/status-badge.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);

const COLUNAS = ["recebido", "em_preparo", "pronto", "em_entrega"];
const ENCERRADOS = ["entregue", "rejeitado", "cancelado"];

// Texto do botão principal de cada etapa (o que a empresa pode fazer).
const ACAO_PRINCIPAL = { recebido: "Iniciar preparo", em_preparo: "Marcar como pronto" };
// Etapas em que a empresa só acompanha.
const DICA = { pronto: "Aguardando o entregador", em_entrega: "Com o entregador" };
// Minutos parados numa etapa antes de o cartão ser marcado como "atrasado".
const LIMITE_MIN = { recebido: 10, em_preparo: 40, pronto: 15 };
const JANELA_ENCERRADOS_MS = 24 * 60 * 60 * 1000;

let empresaId;
let busca = ""; // texto digitado no campo de busca

// Cria um elemento com classe e texto. Só para encurtar o código repetido.
function criar(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

const ultimoEvento = (pedido) => pedido.history[pedido.history.length - 1];

/* ---------- ações dos botões ---------- */
function avancar(id) {
  const resultado = avancarPedido(empresaId, id);
  if (resultado.ok) avisar(`Pedido ${id} movido para "${ESTADOS[resultado.estado].rotulo}".`);
  else avisar(resultado.erro, "err");
  desenharTudo();
}

async function rejeitar(id) {
  const resposta = await confirmar({
    titulo: `Rejeitar o pedido ${id}?`,
    texto: "O cliente será avisado e verá o motivo.",
    textoConfirmar: "Rejeitar pedido",
    perigo: true,
    pedirMotivo: true,
  });
  if (!resposta) return; // desistiu

  const resultado = rejeitarPedido(empresaId, id, resposta.motivo);
  if (resultado.ok) avisar(`Pedido ${id} rejeitado.`);
  else avisar(resultado.erro, "err");
  desenharTudo();
}

/* ---------- cartão do pedido ---------- */
function criarCartao(pedido) {
  const ultimo = ultimoEvento(pedido);
  const cartao = criar("article", "kcard");
  cartao.setAttribute("aria-label", `Pedido ${pedido.id}`);

  // Linha de cima: número do pedido + botão de detalhes (e o selo, nos encerrados)
  const topo = criar("div", "kcard-top");
  const numero = criar("button", "oid", pedido.id);
  numero.type = "button";
  numero.addEventListener("click", () => abrirDetalhes(pedido.id));
  topo.append(numero);
  if (ENCERRADOS.includes(pedido.state)) topo.append(seloDeEstado(pedido.state));

  const cliente = criar("div", "muted small", `${pedido.contact.name} · feito ${quando(pedido.createdAt)}`);
  const itens = criar("p", "kcard-itens", resumoDosItens(pedido.id));

  // Linha do meio: total + há quanto tempo está nesta etapa
  const meio = criar("div", "kcard-meio");
  meio.append(criar("span", "strong", brl(pedido.total)));
  const minutos = (Date.now() - ultimo.at) / 60000;
  if (ENCERRADOS.includes(pedido.state)) {
    meio.append(criar("span", "muted small", quando(ultimo.at)));
  } else {
    const atrasado = minutos > LIMITE_MIN[pedido.state];
    meio.append(criar("span", atrasado ? "small late" : "muted small", `${atrasado ? "Atrasado · " : ""}na etapa: ${quando(ultimo.at)}`));
  }

  cartao.append(topo, cliente, itens, meio);

  if (pedido.reason && ENCERRADOS.includes(pedido.state) && pedido.state !== "entregue") {
    cartao.append(criar("p", "small muted", `Motivo: ${pedido.reason}`));
  }

  // Botões
  const acoes = criar("div", "kcard-acoes");
  if (ACAO_PRINCIPAL[pedido.state]) {
    const principal = criar("button", "btn btn-primary btn-sm", ACAO_PRINCIPAL[pedido.state]);
    principal.type = "button";
    principal.addEventListener("click", () => avancar(pedido.id));
    acoes.append(principal);
  }
  if (pedido.state === "recebido") {
    const recusar = criar("button", "btn btn-danger btn-sm", "Rejeitar");
    recusar.type = "button";
    recusar.addEventListener("click", () => rejeitar(pedido.id));
    acoes.append(recusar);
  }
  if (DICA[pedido.state]) acoes.append(criar("span", "muted small", DICA[pedido.state]));
  if (acoes.children.length) cartao.append(acoes);

  return cartao;
}

/* ---------- quadro ---------- */
function preencherLista(nome, pedidos, textoVazio) {
  $(`[data-contagem="${nome}"]`).textContent = pedidos.length;

  const lista = $(`[data-lista="${nome}"]`);
  if (pedidos.length === 0) {
    lista.replaceChildren(criar("p", "kcol-vazio muted small", textoVazio));
    return;
  }
  lista.replaceChildren(...pedidos.map(criarCartao));
}

function montarQuadro() {
  const termo = busca.trim().toLowerCase();
  const todos = pedidosDaEmpresa(empresaId).filter((p) =>
    !termo || p.id.toLowerCase().includes(termo) || p.contact.name.toLowerCase().includes(termo));

  // Colunas: o pedido que espera há mais tempo fica no topo.
  for (const estado of COLUNAS) {
    const daColuna = todos
      .filter((p) => p.state === estado)
      .sort((a, b) => ultimoEvento(a).at - ultimoEvento(b).at);
    preencherLista(estado, daColuna, "Nenhum pedido");
  }

  // Encerrados: só as últimas 24 horas, o mais recente primeiro.
  const limite = Date.now() - JANELA_ENCERRADOS_MS;
  const encerrados = todos
    .filter((p) => ENCERRADOS.includes(p.state) && ultimoEvento(p).at >= limite)
    .sort((a, b) => ultimoEvento(b).at - ultimoEvento(a).at);
  preencherLista("encerrados", encerrados, "Nenhum pedido encerrado nas últimas 24 horas");

  const emAndamento = todos.filter((p) => COLUNAS.includes(p.state)).length;
  $("#resumo").textContent = `${emAndamento} ${plural(emAndamento, "pedido", "pedidos")} em andamento`;
}

/* ---------- detalhes do pedido ---------- */
function abrirDetalhes(id) {
  const pedido = obterPedidoDaEmpresa(empresaId, id);
  if (!pedido) return avisar(`O pedido ${id} não foi encontrado nesta empresa.`, "info");

  $("#det-titulo").textContent = `Pedido ${pedido.id}`;
  $("#det-selo").replaceChildren(seloDeEstado(pedido.state));
  $("#det-cliente").textContent = pedido.contact.name;
  $("#det-telefone").textContent = pedido.contact.phone;
  $("#det-endereco").textContent = enderecoEmTexto(pedido);
  $("#det-pagamento").textContent = PAGAMENTOS[pedido.payment] ?? pedido.payment;
  $("#det-criado").textContent = `${dataCurta(pedido.createdAt)} às ${hora(pedido.createdAt)}`;

  // Itens
  const itens = itensDoPedido(pedido.id).map((item) => {
    const linha = criar("li");
    linha.append(criar("span", "", `${item.qty}× ${item.name}`), criar("span", "muted", brl(item.qty * item.unitPrice)));
    if (item.note) linha.append(criar("small", "muted det-obs", `Obs.: ${item.note}`));
    return linha;
  });
  $("#det-itens").replaceChildren(...itens);
  $("#det-subtotal").textContent = brl(pedido.subtotal);
  $("#det-taxa").textContent = brl(pedido.fee);
  $("#det-total").textContent = brl(pedido.total);

  // Motivo (só se houver)
  $("#det-motivo-bloco").hidden = !pedido.reason;
  $("#det-motivo").textContent = pedido.reason;

  // Histórico, do mais antigo para o mais novo
  const historico = pedido.history.map((evento) => {
    const linha = criar("li");
    linha.append(
      seloDeEstado(evento.state),
      criar("span", "muted small", `${dataCurta(evento.at)} ${hora(evento.at)} · ${evento.by}`));
    if (evento.note) linha.append(criar("small", "hist-nota", evento.note));
    return linha;
  });
  $("#det-historico").replaceChildren(...historico);

  $("#detalhes").showModal();
}

/* ---------- inicialização ---------- */
function desenharTudo() {
  const empresa = obterEmpresa(empresaId);
  document.title = `Pedidos · ${empresa.name} · Peddi`;
  montarMenuLateral("pedidos", empresaId);
  montarQuadro();
  montarIcones(); // troca os <span data-icon> pelos ícones SVG
}

aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  montarBarraDemo($("#demo"));
  ligarMenuMovel();

  $("#busca").addEventListener("input", (e) => { busca = e.target.value; montarQuadro(); });
  // Ao fechar os detalhes, tira ?pedido=... do endereço.
  $("#detalhes").addEventListener("close", () => history.replaceState(null, "", "admin-pedidos.html"));

  desenharTudo();
  escutarMudancas(desenharTudo); // cliente ou outra aba mexeu nos pedidos: redesenha

  // Os "há X min" ficam velhos: atualiza a cada minuto (menos com uma janela aberta).
  setInterval(() => { if (!document.querySelector("dialog[open]")) desenharTudo(); }, 60000);

  // O dashboard abre um pedido direto: admin-pedidos.html?pedido=PED-1011
  const pedidoDaUrl = new URLSearchParams(location.search).get("pedido");
  if (pedidoDaUrl) abrirDetalhes(pedidoDaUrl);
}
