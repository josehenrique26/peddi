// src/pages/client-checkout.js — finalização do pedido (checkout.html).
// Os campos do formulário estão no HTML; o JS preenche valores, valida e cria o pedido.
import "../styles/main.css";
import "../styles/pages/client.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { entrarComoCliente } from "../utils/guard.js";
import { brl } from "../utils/format.js";
import { rotas, navegar } from "../utils/routes.js";
import { somarLinhas } from "../utils/totals.js";
import { formatarCep, formatarTelefone, validarCheckout } from "../utils/validate.js";
import { PAGAMENTOS } from "../data/order-rules.js";
import { carregarDados, lerSessao } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { empresaPorSlug } from "../services/menu.js";
import { obterCarrinho, linhasDoCarrinho, limparCarrinho } from "../services/cart.js";
import { clienteAtual, criarPedido, salvarDadosDoCliente } from "../services/client-orders.js";
import { buscarCep } from "../services/viacep.js";
import { el, mount } from "../components/dom.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarTopoDaLoja, montarTopoDoCliente } from "../components/client-header.js";
import { blocoDeTotais } from "../components/totals-box.js";
import { estadoVazio } from "../components/empty-state.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
const form = $("#form-checkout");

const CAMPOS = ["name", "phone", "cep", "street", "district"]; // campos que mostram mensagem de erro
let empresa;
let linhas;

/* ---------- erros dos campos ---------- */
function limparErros() {
  CAMPOS.forEach((campo) => {
    $(`#e-${campo}`).textContent = "";
    form.elements[campo].removeAttribute("aria-invalid");
  });
  $("#e-form").textContent = "";
}

// Mostra as mensagens e leva o foco ao primeiro campo com problema.
function mostrarErros(erros) {
  limparErros();
  const campos = Object.keys(erros);
  campos.forEach((campo) => {
    $(`#e-${campo}`).textContent = erros[campo];
    form.elements[campo].setAttribute("aria-invalid", "true");
  });
  if (campos.length) form.elements[campos[0]].focus();
  return campos.length > 0;
}

/* ---------- CEP (ViaCEP) ---------- */
async function consultarCep() {
  const cep = form.elements.cep.value;
  $("#e-cep").textContent = "";
  $("#buscar-cep").disabled = true;

  const resultado = await buscarCep(cep);
  $("#buscar-cep").disabled = false;

  if (resultado.erro) {
    $("#e-cep").textContent = resultado.erro;
    return;
  }
  form.elements.street.value = `${resultado.rua}, `; // o cliente completa com o número
  form.elements.district.value = resultado.bairro;
  form.elements.street.focus();
  avisar(`Endereço encontrado: ${resultado.cidade} - ${resultado.uf}.`, "info");
}

/* ---------- preenchimento da tela ---------- */
function preencherDadosDoCliente() {
  const cliente = clienteAtual();
  form.elements.name.value = cliente.name;
  form.elements.phone.value = cliente.phone;
  form.elements.street.value = cliente.street;
  form.elements.district.value = cliente.district;
  form.elements.complement.value = cliente.complement;
}

function montarPagamentos() {
  const opcoes = Object.entries(PAGAMENTOS).map(([valor, rotulo], i) =>
    el("label", { class: "rc" },
      el("input", { type: "radio", name: "payment", value: valor, checked: i === 0 }),
      el("span", {}, rotulo)));
  mount($("#pagamentos"), opcoes);
}

function montarResumo() {
  const itens = linhas.map((linha) =>
    el("li", {},
      el("span", {}, `${linha.qty}× ${linha.produto?.name ?? "Produto removido"}`),
      el("span", { class: "strong" }, brl(linha.total))));
  mount($("#resumo-itens"), itens);
  mount($("#resumo-totais"), blocoDeTotais({ subtotal: somarLinhas(linhas), taxa: empresa.fee }));

  const temIndisponivel = linhas.some((l) => l.indisponivel);
  $("#aviso-indisponivel").hidden = !temIndisponivel;
  $("#confirmar").disabled = temIndisponivel;
}

/* ---------- envio do pedido ---------- */
function aoEnviar(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(form));

  if (mostrarErros(validarCheckout(dados))) return;

  const contato = { name: dados.name.trim(), phone: dados.phone.trim() };
  const endereco = { cep: dados.cep.trim(), street: dados.street.trim(), district: dados.district.trim(), complement: dados.complement.trim() };

  const resultado = criarPedido({
    empresaId: empresa.id,
    linhas: linhas.map(({ productId, qty, note }) => ({ productId, qty, note })),
    contato, endereco, pagamento: dados.payment,
  });

  if (!resultado.ok) {
    $("#e-form").textContent = resultado.erro;
    avisar(resultado.erro, "err");
    return;
  }

  salvarDadosDoCliente({ contato, endereco });
  limparCarrinho();
  navegar(rotas.pedido(resultado.id, true));
}

/* ---------- inicialização ---------- */
function mostrarSemItens() {
  const slug = lerSessao().lastShop;
  const temLoja = Boolean(empresaPorSlug(slug));
  const acao = el("a", { class: "btn btn-primary", href: temLoja ? rotas.loja(slug) : rotas.inicio() }, temLoja ? "Ver cardápio" : "Informar link ou código");
  mount($("#checkout-vazio"), estadoVazio({ icone: "cart", titulo: "Não há itens para finalizar", texto: "Um pedido só pode ser criado com ao menos um produto no carrinho.", acao }));
  $("#checkout-vazio").hidden = false;
}

aplicarTemaSalvo();
carregarDados();
entrarComoCliente();
montarBarraDemo($("#demo"));

const carrinho = obterCarrinho();
if (!carrinho.items.length) {
  montarTopoDoCliente();
  mostrarSemItens();
} else {
  empresa = obterEmpresa(carrinho.companyId);
  linhas = linhasDoCarrinho();
  montarTopoDaLoja(empresa);

  preencherDadosDoCliente();
  montarPagamentos();
  montarResumo();

  form.elements.phone.addEventListener("input", (e) => { e.target.value = formatarTelefone(e.target.value); });
  form.elements.cep.addEventListener("input", (e) => { e.target.value = formatarCep(e.target.value); });
  form.elements.cep.addEventListener("blur", () => { if (form.elements.cep.value.length === 9) consultarCep(); });
  $("#buscar-cep").addEventListener("click", consultarCep);
  form.addEventListener("submit", aoEnviar);

  $("#checkout").hidden = false;
}

montarIcones();
