// src/pages/client-menu.js — cardápio da empresa (loja.html?empresa=slug).
// O HTML fixo fica no .html; o JS preenche textos e cria os itens das listas (cartões e categorias).
import "../styles/main.css";
import "../styles/pages/client.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { entrarComoCliente } from "../utils/guard.js";
import { brl, plural } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { contarItens, somarLinhas } from "../utils/totals.js";
import { categoriasDe, filtrarProdutos, agruparPorCategoria } from "../utils/cardapio.js";
import { carregarDados, gravarSessao, lerSessao } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { empresaPorSlug, produtosDaEmpresa } from "../services/menu.js";
import { obterCarrinho, adicionarAoCarrinho, diminuirQuantidade, limparCarrinho, linhasDoCarrinho } from "../services/cart.js";
import { el, mount } from "../components/dom.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarTopoDaLoja } from "../components/client-header.js";
import { cartaoDoProduto } from "../components/product-card.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);

let empresa;
let produtos;
let categoria = "todos";
let busca = "";

/* ---------- cabeçalho da empresa (textos fixos, só preenchidos) ---------- */
function preencherCabecalho() {
  document.title = `${empresa.name} — cardápio · Peddi`;
  $("#h-loja").textContent = empresa.name;
  $("#descricao").textContent = empresa.description ?? "";
  $("#marca").textContent = empresa.brandEmoji;
  $("#marca").style.background = empresa.brandColor;
  $('[data-campo="categoria"]').textContent = empresa.category;
  $('[data-campo="endereco"]').textContent = empresa.address;
  $('[data-campo="taxa"]').textContent = brl(empresa.fee);
}

/* ---------- categorias ---------- */
function montarCategorias() {
  const nomes = ["todos", ...categoriasDe(produtos)];
  const botoes = nomes.map((nome) =>
    el("button", {
      type: "button", class: "chip", "aria-pressed": nome === categoria,
      onclick: () => { categoria = nome; atualizarCardapio(); },
    }, nome === "todos" ? "Todos" : nome));
  mount($("#categorias"), botoes);
}

/* ---------- lista de produtos ---------- */
function secaoDaCategoria(nome, lista, carrinho) {
  const cartoes = lista.map((produto) => {
    const item = carrinho.companyId === empresa.id ? carrinho.items.find((i) => i.productId === produto.id) : null;
    return cartaoDoProduto(produto, item?.qty ?? 0, { aoAdicionar: adicionar, aoDiminuir: diminuir });
  });
  return el("section", { "aria-labelledby": `cat-${nome}` },
    el("h2", { id: `cat-${nome}`, class: "cat-title" }, nome),
    el("div", { class: "pgrid" }, cartoes),
  );
}

function desenharCardapio() {
  const carrinho = obterCarrinho();
  const grupos = agruparPorCategoria(filtrarProdutos(produtos, { categoria, busca }));
  const secoes = Object.entries(grupos).map(([nome, lista]) => secaoDaCategoria(nome, lista, carrinho));

  if (!secoes.length) {
    const limpar = el("button", { type: "button", class: "btn btn-ghost", onclick: limparFiltros }, "Limpar filtros");
    mount($("#cardapio"), estadoVazio({ icone: "search", titulo: "Nada encontrado", texto: "Nenhum produto corresponde à busca ou à categoria escolhida.", acao: limpar }));
    return;
  }
  mount($("#cardapio"), secoes);
}

function limparFiltros() {
  categoria = "todos";
  busca = "";
  $("#busca").value = "";
  atualizarCardapio();
}

/* ---------- carrinho: barra inferior e aviso de outra empresa ---------- */
function atualizarBarraDoCarrinho() {
  const carrinho = obterCarrinho();
  const outra = carrinho.items.length && carrinho.companyId !== empresa.id ? obterEmpresa(carrinho.companyId) : null;

  $("#aviso-carrinho").hidden = !outra;
  if (outra) $("#empresa-do-carrinho").textContent = outra.name;

  const qtd = contarItens(carrinho.items);
  $("#barra-carrinho").hidden = !qtd || Boolean(outra);
  $('[data-campo="barra-texto"]').textContent = `Ver carrinho · ${qtd} ${plural(qtd, "item", "itens")}`;
  $('[data-campo="barra-total"]').textContent = brl(somarLinhas(linhasDoCarrinho()));
}

function atualizarCardapio() {
  montarCategorias();
  desenharCardapio();
  atualizarBarraDoCarrinho();
  montarTopoDaLoja(empresa); // atualiza o contador do carrinho
}

/* ---------- ações do cliente ---------- */
async function adicionar(produtoId) {
  const resultado = adicionarAoCarrinho(produtoId);

  if (resultado.conflito) {
    const resposta = await confirmar({
      titulo: "Seu carrinho é de outra empresa",
      texto: `Você tem itens de ${resultado.conflito.name} no carrinho. Para pedir de ${empresa.name}, o carrinho atual será esvaziado.`,
      textoConfirmar: "Esvaziar e adicionar", perigo: true,
    });
    if (!resposta) return;
    limparCarrinho();
    return adicionar(produtoId);
  }

  if (resultado.erro) avisar(resultado.erro, "err");
  atualizarCardapio();
}

function diminuir(produtoId) {
  diminuirQuantidade(produtoId);
  atualizarCardapio();
}

/* ---------- empresa inexistente ou inativa ---------- */
function mostrarIndisponivel({ titulo, texto, icone }) {
  const voltar = el("a", { class: "btn btn-primary", href: rotas.inicio() }, "Informar outro link ou código");
  mount($("#indisponivel"), estadoVazio({ icone, titulo, texto, acao: voltar }));
  $("#indisponivel").hidden = false;
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
entrarComoCliente();
montarBarraDemo($("#demo"));

empresa = empresaPorSlug(new URLSearchParams(location.search).get("empresa"));

if (!empresa) {
  montarTopoDaLoja({ slug: "", name: "Peddi", brandColor: "#FF6A1A", brandEmoji: "🍽️" });
  mostrarIndisponivel({ icone: "search", titulo: "Empresa não encontrada", texto: "Esse link não corresponde a nenhuma empresa no Peddi. Tente novamente pelo link ou pelo código." });
} else if (!empresa.active) {
  montarTopoDaLoja(empresa);
  mostrarIndisponivel({ icone: "store", titulo: `${empresa.name} não está recebendo pedidos`, texto: "Esta empresa está inativa no momento. Confira o link com o estabelecimento ou volte mais tarde." });
} else {
  gravarSessao({ ...lerSessao(), lastShop: empresa.slug });
  produtos = produtosDaEmpresa(empresa.id);
  preencherCabecalho();
  $("#busca").addEventListener("input", (e) => { busca = e.target.value; desenharCardapio(); });
  $("#loja").hidden = false;
  atualizarCardapio();
}

montarIcones();
