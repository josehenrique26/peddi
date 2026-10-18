// src/pages/client-cart.js — carrinho (carrinho.html): quantidades, observação por item e total.
import "../styles/main.css";
import "../styles/pages/client.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { entrarComoCliente } from "../utils/guard.js";
import { brl } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { somarLinhas } from "../utils/totals.js";
import { MAX_QTD } from "../data/order-rules.js";
import { carregarDados, lerSessao } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { empresaPorSlug } from "../services/menu.js";
import { obterCarrinho, adicionarAoCarrinho, diminuirQuantidade, removerDoCarrinho, limparCarrinho, definirObservacao, linhasDoCarrinho } from "../services/cart.js";
import { el, mount } from "../components/dom.js";
import { icone, montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarTopoDaLoja, montarTopoDoCliente } from "../components/client-header.js";
import { imagemDoProduto } from "../components/product-image.js";
import { seletorDeQuantidade } from "../components/qty-stepper.js";
import { blocoDeTotais } from "../components/totals-box.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);

let empresa;

/* ---------- uma linha do carrinho ---------- */
function linhaDoCarrinho(linha) {
  const { produto } = linha;
  const nome = produto?.name ?? "Produto removido";

  const observacao = el("input", {
    type: "text", class: "line-note", maxlength: 120, value: linha.note,
    placeholder: "Observação (ex.: sem cebola)", "aria-label": `Observação para ${nome}`,
    oninput: (e) => definirObservacao(linha.productId, e.target.value),
  });

  return el("div", { class: "line" },
    produto ? imagemDoProduto(produto, "pimg-sm") : el("span"),
    el("div", {},
      el("div", { class: "strong" }, nome),
      el("div", { class: "muted small" }, produto ? `${brl(produto.price)} cada` : ""),
      linha.indisponivel && el("span", { class: "badge b-red badge-gap" }, icone("alert", 13), "Indisponível: remova para continuar"),
      !linha.indisponivel && observacao,
    ),
    el("div", { class: "right" },
      seletorDeQuantidade({
        nome, qtd: linha.qty, mais: !linha.indisponivel && linha.qty < MAX_QTD,
        aoDiminuir: () => { diminuirQuantidade(linha.productId); desenhar(); },
        aoAumentar: () => alterarMais(linha.productId),
      }),
      el("div", { class: "strong line-total" }, brl(linha.total)),
      el("button", { type: "button", class: "linkish small", onclick: () => remover(linha.productId) }, "Remover"),
    ),
  );
}

/* ---------- ações ---------- */
function alterarMais(produtoId) {
  const resultado = adicionarAoCarrinho(produtoId);
  if (resultado.erro) avisar(resultado.erro, "err");
  desenhar();
}

function remover(produtoId) {
  removerDoCarrinho(produtoId);
  avisar("Item removido.", "info");
  desenhar();
}

async function limpar() {
  const resposta = await confirmar({ titulo: "Limpar carrinho?", texto: "Todos os itens serão removidos.", textoConfirmar: "Limpar carrinho", perigo: true });
  if (!resposta) return;
  limparCarrinho();
  avisar("Carrinho limpo.", "info");
  desenhar();
}

/* ---------- tela ---------- */
function mostrarVazio() {
  const slug = lerSessao().lastShop;
  const destino = empresaPorSlug(slug) ? rotas.loja(slug) : rotas.inicio();
  const acao = el("a", { class: "btn btn-primary", href: destino }, empresaPorSlug(slug) ? "Ver cardápio" : "Informar link ou código");
  mount($("#carrinho-vazio"), estadoVazio({ icone: "cart", titulo: "Seu carrinho está vazio", texto: "Escolha produtos do cardápio de uma empresa para montar o pedido.", acao }));
  $("#carrinho-vazio").hidden = false;
  $("#carrinho-cheio").hidden = true;
}

function desenhar() {
  const carrinho = obterCarrinho();
  if (!carrinho.items.length) {
    montarTopoDoCliente();
    mostrarVazio();
    return;
  }

  empresa = obterEmpresa(carrinho.companyId);
  const linhas = linhasDoCarrinho();
  const temIndisponivel = linhas.some((l) => l.indisponivel);

  montarTopoDaLoja(empresa);
  $("#carrinho-vazio").hidden = true;
  $("#carrinho-cheio").hidden = false;
  $("#continuar").href = rotas.loja(empresa.slug);

  mount($("#itens"), linhas.map(linhaDoCarrinho));
  mount($("#resumo"), blocoDeTotais({ subtotal: somarLinhas(linhas), taxa: empresa.fee }));

  $("#aviso-indisponivel").hidden = !temIndisponivel;
  $("#ir-checkout").setAttribute("aria-disabled", String(temIndisponivel));
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
entrarComoCliente();
montarBarraDemo($("#demo"));

$("#limpar").addEventListener("click", limpar);
$("#ir-checkout").addEventListener("click", (e) => {
  if ($("#ir-checkout").getAttribute("aria-disabled") === "true") {
    e.preventDefault();
    avisar("Remova os itens indisponíveis antes de continuar.", "err");
  }
});

desenhar();
montarIcones();
