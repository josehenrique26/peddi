import "../styles/main.css";
import "../styles/pages/admin.css";
import "../styles/pages/admin-products.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { lerPreco, precoParaCampo, brl } from "../utils/format.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { listarProdutosEmpresa, salvarProduto, definirDisponibilidadeProduto, excluirProduto } from "../services/produtos.js";
import { el, mount } from "../components/dom.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral, ligarMenuMovel } from "../components/admin-shell.js";
import { imagemDoProduto } from "../components/product-image.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
const MAX_IMAGEM_BYTES = 1_500_000;
const TIPOS_IMAGEM = ["image/png", "image/jpeg", "image/webp"];
let empresaId;
let produtoEditando = null;

function lerImagem(arquivo) {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) throw new Error("Escolha uma imagem PNG, JPEG ou WebP.");
  if (arquivo.size > MAX_IMAGEM_BYTES) throw new Error("A imagem deve ter no máximo 1,5 MB.");
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve({ src: leitor.result, emoji: "🍽️" });
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    leitor.readAsDataURL(arquivo);
  });
}

function mostrarErro(mensagem = "") {
  $("#erro-produto").textContent = mensagem;
}

function atualizarCategorias(produtos) {
  const categorias = [...new Set(produtos.map((produto) => produto.category).filter(Boolean))].sort();
  mount($("#categorias-produto"), categorias.map((categoria) => el("option", { value: categoria })));
}

function montarProduto(produto) {
  const status = el("span", { class: produto.available ? "badge b-green" : "badge b-gray" }, produto.available ? "Disponível" : "Indisponível");
  const editar = el("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => editarProduto(produto) }, "Editar");
  const disponibilidade = el("button", {
    class: "btn btn-ghost btn-sm", type: "button",
    onclick: () => alterarDisponibilidade(produto),
  }, produto.available ? "Indisponibilizar" : "Disponibilizar");
  const excluir = el("button", { class: "btn btn-danger btn-sm", type: "button", onclick: () => removerProduto(produto) }, "Excluir");
  return el("article", { class: "product-row" },
    imagemDoProduto(produto, "product-admin-image"),
    el("div", { class: "product-details" },
      el("div", { class: "product-title-row" }, el("h3", {}, produto.name), status),
      el("p", { class: "muted small product-category" }, produto.category),
      produto.description && el("p", { class: "product-description-text" }, produto.description),
      el("strong", { class: "product-price" }, brl(produto.price)),
    ),
    el("div", { class: "product-actions" }, editar, disponibilidade, excluir),
  );
}

function carregarLista() {
  const resultado = listarProdutosEmpresa(empresaId);
  if (!resultado.ok) {
    $("#contagem-produtos").textContent = "";
    mount($("#lista-produtos"), estadoVazio({ icone: "alert", titulo: "Não foi possível carregar os produtos", texto: resultado.erro }));
    return;
  }
  const produtos = resultado.produtos.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  atualizarCategorias(produtos);
  $("#contagem-produtos").textContent = `${produtos.length} ${produtos.length === 1 ? "produto" : "produtos"}`;
  if (!produtos.length) {
    mount($("#lista-produtos"), estadoVazio({ icone: "book", titulo: "Seu cardápio está vazio", texto: "Cadastre um produto para ele aparecer para os clientes." }));
    return;
  }
  mount($("#lista-produtos"), produtos.map(montarProduto));
  montarIcones();
}

function abrirFormulario(produto = null) {
  produtoEditando = produto;
  const form = $("#form-produto");
  form.reset();
  mostrarErro();
  $("#titulo-form").textContent = produto ? "Editar produto" : "Novo produto";
  $("#salvar-produto").textContent = produto ? "Salvar alterações" : "Cadastrar produto";
  if (produto) {
    form.elements.name.value = produto.name;
    form.elements.category.value = produto.category;
    form.elements.price.value = precoParaCampo(produto.price);
    form.elements.description.value = produto.description ?? "";
    $("#imagem-ajuda").textContent = produto.img?.src ? "Selecione uma nova imagem ou deixe em branco para manter a atual." : "PNG, JPEG ou WebP, até 1,5 MB. Sem foto, o cardápio mostra um ícone.";
  } else {
    $("#imagem-ajuda").textContent = "PNG, JPEG ou WebP, até 1,5 MB. Sem foto, o cardápio mostra um ícone.";
  }
  form.hidden = false;
  $("#produto-nome").focus();
}

function fecharFormulario() {
  $("#form-produto").hidden = true;
  $("#form-produto").reset();
  produtoEditando = null;
  mostrarErro();
}

function editarProduto(produto) {
  abrirFormulario(produto);
}

function alterarDisponibilidade(produto) {
  const resultado = definirDisponibilidadeProduto(empresaId, produto.id, !produto.available);
  if (!resultado.ok) { avisar(resultado.erro, "err"); return; }
  avisar(produto.available ? "Produto indisponibilizado." : "Produto disponível no cardápio.");
  carregarLista();
}

async function removerProduto(produto) {
  const resposta = await confirmar({
    titulo: "Excluir produto?",
    texto: `“${produto.name}” deixará de aparecer no cardápio. Pedidos anteriores mantêm os dados registrados.`,
    textoConfirmar: "Excluir produto", perigo: true,
  });
  if (!resposta) return;
  const resultado = excluirProduto(empresaId, produto.id);
  if (!resultado.ok) { avisar(resultado.erro, "err"); return; }
  if (produtoEditando?.id === produto.id) fecharFormulario();
  avisar("Produto excluído.");
  carregarLista();
}

async function enviarProduto(evento) {
  evento.preventDefault();
  const botao = $("#salvar-produto");
  if (botao.disabled) return;
  const form = $("#form-produto");
  const dados = new FormData(form);
  const nome = String(dados.get("name") ?? "").trim();
  const categoria = String(dados.get("category") ?? "").trim();
  const preco = lerPreco(dados.get("price"));
  const descricao = String(dados.get("description") ?? "").trim();
  if (!nome) { mostrarErro("Informe o nome do produto."); form.elements.name.focus(); return; }
  if (!categoria) { mostrarErro("Informe uma categoria."); form.elements.category.focus(); return; }
  if (!Number.isInteger(preco) || preco <= 0) { mostrarErro("Informe um preço válido maior que zero."); form.elements.price.focus(); return; }
  if (descricao.length > 240) { mostrarErro("A descrição deve ter até 240 caracteres."); form.elements.description.focus(); return; }

  botao.disabled = true;
  mostrarErro();
  const estavaEditando = Boolean(produtoEditando);
  try {
    const arquivo = form.elements.image.files[0];
    const img = arquivo ? await lerImagem(arquivo) : produtoEditando?.img;
    const resultado = salvarProduto(empresaId, { name: nome, category: categoria, price: preco, description: descricao, img }, produtoEditando?.id);
    if (!resultado.ok) { mostrarErro(resultado.erro); return; }
    fecharFormulario();
    carregarLista();
    avisar(estavaEditando ? "Produto atualizado." : "Produto cadastrado.");
  } catch (erro) {
    mostrarErro(erro.message || "Não foi possível processar a imagem.");
  } finally {
    botao.disabled = false;
  }
}

aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  document.title = "Cardápio · Peddi";
  montarBarraDemo($("#demo"));
  montarMenuLateral("cardapio", empresaId);
  ligarMenuMovel();
  montarIcones();
  $("#novo-produto").addEventListener("click", () => abrirFormulario());
  $("#cancelar-edicao").addEventListener("click", fecharFormulario);
  $("#cancelar-form").addEventListener("click", fecharFormulario);
  $("#form-produto").addEventListener("submit", enviarProduto);
  carregarLista();
  escutarMudancas(carregarLista);
}