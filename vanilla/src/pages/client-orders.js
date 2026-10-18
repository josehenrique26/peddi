// src/pages/client-orders.js — "Meus pedidos" (pedidos.html): em andamento e anteriores, com cancelamento.
import "../styles/main.css";
import "../styles/pages/client.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { entrarComoCliente } from "../utils/guard.js";
import { rotas } from "../utils/routes.js";
import { ESTADOS_EM_ANDAMENTO } from "../data/order-states.js";
import { carregarDados, lerSessao, escutarMudancas } from "../services/storage.js";
import { empresaPorSlug } from "../services/menu.js";
import { pedidosDoCliente, cancelarPedido } from "../services/client-orders.js";
import { el, mount } from "../components/dom.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarTopoDoCliente } from "../components/client-header.js";
import { cartaoDoPedido } from "../components/order-card.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);

let aba = "andamento"; // "andamento" | "anteriores"

/* ---------- lista ---------- */
function botaoParaComecar() {
  const slug = lerSessao().lastShop;
  return empresaPorSlug(slug)
    ? el("a", { class: "btn btn-primary", href: rotas.loja(slug) }, "Ver cardápio")
    : el("a", { class: "btn btn-primary", href: rotas.inicio() }, "Informar link ou código");
}

function desenhar() {
  const todos = pedidosDoCliente();
  const emAndamento = todos.filter((p) => ESTADOS_EM_ANDAMENTO.includes(p.state));
  const anteriores = todos.filter((p) => !ESTADOS_EM_ANDAMENTO.includes(p.state));
  const lista = aba === "andamento" ? emAndamento : anteriores;

  $('[data-aba="andamento"]').textContent = `Em andamento (${emAndamento.length})`;
  $('[data-aba="anteriores"]').textContent = `Anteriores (${anteriores.length})`;
  document.querySelectorAll("[data-aba]").forEach((botao) =>
    botao.setAttribute("aria-pressed", String(botao.dataset.aba === aba)));

  if (!lista.length) {
    mount($("#lista-pedidos"), estadoVazio({
      icone: "receipt",
      titulo: aba === "andamento" ? "Nenhum pedido em andamento" : "Nenhum pedido anterior",
      texto: "Quando você finalizar uma compra, o acompanhamento aparece aqui.",
      acao: botaoParaComecar(),
    }));
    return;
  }
  mount($("#lista-pedidos"), lista.map((pedido) => cartaoDoPedido(pedido, { aoCancelar: cancelar })));
}

/* ---------- cancelamento ---------- */
async function cancelar(pedido) {
  const resposta = await confirmar({
    titulo: `Cancelar o pedido ${pedido.id}?`,
    texto: "O cancelamento só é possível antes de o entregador retirar o pedido.",
    textoConfirmar: "Cancelar pedido", perigo: true, pedirMotivo: true,
  });
  if (!resposta) return;

  const resultado = cancelarPedido(pedido.id, resposta.motivo);
  if (resultado.erro) avisar(resultado.erro, "err");
  else avisar(`Pedido ${pedido.id} cancelado.`);
  desenhar();
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
entrarComoCliente();
montarBarraDemo($("#demo"));
montarTopoDoCliente();

document.querySelectorAll("[data-aba]").forEach((botao) =>
  botao.addEventListener("click", () => { aba = botao.dataset.aba; desenhar(); }));

escutarMudancas(desenhar); // a empresa mudou o estado de um pedido em outra aba
desenhar();
