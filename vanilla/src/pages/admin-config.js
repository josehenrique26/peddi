// src/pages/admin-config.js — configurações da empresa (admin-config.html).
// Os campos do formulário estão no HTML; o JS preenche os valores, cria as listas de opções, valida e salva.

import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { precoParaCampo } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { CATEGORIAS, CORES, ICONES } from "../data/company-options.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { obterEmpresa, validarConfiguracoes, salvarConfiguracoes } from "../services/companies.js";
import { el, mount } from "../components/dom.js";
import { preencherSelect } from "../utils/select.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral, ligarMenuMovel } from "../components/admin-shell.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
const form = $("#form-config");

const CAMPOS = ["name", "address", "slug", "code", "fee"]; // campos que mostram mensagem de erro
let empresaId;

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
    form.elements[campo]?.setAttribute("aria-invalid", "true");
  });
  if (campos.length && campos[0] !== "form") form.elements[campos[0]].focus();
  return campos.length > 0;
}

/* ---------- listas de opções (itens criados com createElement) ---------- */
function montarOpcoes() {
  preencherSelect(form.elements.category, CATEGORIAS.map((c) => [c, c]));

  mount($("#cores"), CORES.map(([valor, nome]) =>
    el("label", { class: "cor" },
      el("input", { type: "radio", name: "brandColor", value: valor, class: "sr" }),
      el("span", { class: "cor-amostra", style: { background: valor } }),
      el("span", { class: "sr" }, nome))));

  mount($("#icones"), ICONES.map((icone) =>
    el("label", {},
      el("input", { type: "radio", name: "brandEmoji", value: icone }),
      el("span", { "aria-hidden": true }, icone),
      el("span", { class: "sr" }, icone))));
}

/* ---------- preenchimento da tela ---------- */
function preencherFormulario(empresa) {
  form.elements.name.value = empresa.name;
  form.elements.category.value = empresa.category;
  form.elements.address.value = empresa.address;
  form.elements.description.value = empresa.description ?? "";
  form.elements.slug.value = empresa.slug;
  form.elements.code.value = empresa.code;
  form.elements.fee.value = precoParaCampo(empresa.fee);
  form.elements.active.checked = empresa.active;
  form.elements.brandColor.value = empresa.brandColor; // marca o botão de rádio com esse valor
  form.elements.brandEmoji.value = empresa.brandEmoji;
}

// O link mostra o identificador JÁ SALVO; só muda depois de salvar.
function atualizarLinks(empresa) {
  document.title = `Configurações · ${empresa.name} · Peddi`;
  $("#link-cliente").textContent = `peddi.app/${empresa.slug}`;
  $("#abrir-cardapio").href = rotas.loja(empresa.slug);
}

// Prévia da marca: acompanha o que está marcado no formulário, antes de salvar.
function atualizarPrevia() {
  $("#previa-marca").textContent = form.elements.brandEmoji.value;
  $("#previa-marca").style.background = form.elements.brandColor.value;
  $("#previa-nome").textContent = form.elements.name.value.trim() || "Seu estabelecimento";
}

function atualizarMenu() {
  montarMenuLateral("config", empresaId);
  montarIcones();
}

/* ---------- ações ---------- */
async function copiarLink() {
  const link = $("#link-cliente").textContent;
  try {
    await navigator.clipboard.writeText(link);
    avisar("Link copiado.");
  } catch {
    avisar(`Copie manualmente: ${link}`, "info");
  }
}

async function aoEnviar(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  dados.active = form.elements.active.checked; // checkbox desmarcado não vai no FormData

  if (mostrarErros(validarConfiguracoes(empresaId, dados))) return;

  // Desativar bloqueia novos pedidos: pede confirmação.
  if (obterEmpresa(empresaId).active && !dados.active) {
    const resposta = await confirmar({
      titulo: "Desativar a empresa?",
      texto: "Enquanto estiver inativa, os clientes não conseguem fazer novos pedidos. Os pedidos em andamento continuam normalmente.",
      textoConfirmar: "Desativar",
      perigo: true,
    });
    if (!resposta) return;
  }

  const resultado = salvarConfiguracoes(empresaId, dados);
  if (!resultado.ok) {
    mostrarErros(resultado.erros);
    avisar("Não foi possível salvar. Confira os campos.", "err");
    return;
  }

  avisar("Configurações salvas.");
  atualizarLinks(obterEmpresa(empresaId));
  atualizarMenu();
  montarBarraDemo($("#demo")); // o seletor de empresas mostra o nome e a situação atualizados
  montarIcones();
}

/* ---------- inicialização ---------- */
aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  const empresa = obterEmpresa(empresaId);

  montarBarraDemo($("#demo"));
  ligarMenuMovel();
  montarOpcoes();
  preencherFormulario(empresa);
  atualizarLinks(empresa);
  atualizarPrevia();
  atualizarMenu();
  montarIcones();

  form.addEventListener("input", atualizarPrevia); // vale para texto e para os botões de rádio
  form.addEventListener("submit", aoEnviar);
  $("#copiar-link").addEventListener("click", copiarLink);
  escutarMudancas(atualizarMenu); // outra aba mexeu nos dados: atualiza só o menu, sem apagar o que está sendo digitado
}
