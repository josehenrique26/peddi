import "../styles/main.css";
import "../styles/pages/admin.css";
import "../styles/pages/admin-couriers.css";

import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEmpresa } from "../utils/guard.js";
import { formatarTelefone } from "../utils/validate.js";
import { carregarDados, normalizarSessao, escutarMudancas } from "../services/storage.js";
import { listarEntregadoresEmpresa, cadastrarEntregador, definirEntregadorAtivo, gerarCodigoConexao } from "../services/couriers.js";
import { obterEmpresa } from "../services/companies.js";
import { el, mount } from "../components/dom.js";
import { montarIcones } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarMenuLateral, ligarMenuMovel } from "../components/admin-shell.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
let empresaId;

// [INTEGRAÇÃO] Atualiza somente os dados da empresa da sessão; o serviço também
// verifica o perfil e o companyId para não confiar apenas no filtro da interface.
function carregarLista() {
  const resultado = listarEntregadoresEmpresa(empresaId);
  if (!resultado.ok) {
    $("#contagem-entregadores").textContent = "";
    mount($("#lista-entregadores"), estadoVazio({
      icone: "alert", titulo: "Não foi possível carregar os entregadores", texto: resultado.erro,
    }));
    return;
  }
  const entregadores = resultado.entregadores.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  $("#contagem-entregadores").textContent = `${entregadores.length} ${entregadores.length === 1 ? "entregador" : "entregadores"}`;
  if (!entregadores.length) {
    mount($("#lista-entregadores"), estadoVazio({
      icone: "bike", titulo: "Nenhum entregador cadastrado", texto: "Cadastre um entregador para iniciar o gerenciamento.",
    }));
    return;
  }

  mount($("#lista-entregadores"), entregadores.map((entregador) =>
    el("article", { class: "courier-row" },
      el("div", { class: "courier-details" },
        el("strong", {}, entregador.name),
        el("div", { class: "muted small" }, `${entregador.phone} · Código ${entregador.code}`),
        el("span", { class: entregador.active ? "badge b-green" : "badge b-gray" }, entregador.active ? "Ativo" : "Inativo")),
      el("div", { class: "courier-actions" },
        el("button", {
          type: "button", class: entregador.active ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm",
          onclick: () => alternarAtivo(entregador),
        }, entregador.active ? "Inativar" : "Reativar")))));
  montarIcones();
}

function alternarAtivo(entregador) {
  const resultado = definirEntregadorAtivo(empresaId, entregador.id, !entregador.active);
  if (!resultado.ok) { avisar(resultado.erro, "err"); return; }
  avisar(entregador.active ? "Entregador inativado." : "Entregador reativado.");
  carregarLista();
}

// [INTEGRAÇÃO] O formulário coleta os campos, delega validação/persistência ao
// serviço e só limpa os dados depois de receber uma confirmação de sucesso.
function enviarCadastro(evento) {
  evento.preventDefault();
  const form = $("#form-entregador");
  const dados = Object.fromEntries(new FormData(form));
  const resultado = cadastrarEntregador(empresaId, dados);
  $("#erro-entregador").textContent = resultado.ok ? "" : resultado.erro;
  if (!resultado.ok) {
    form.elements[resultado.erro.includes("telefone") ? "phone" : "name"].focus();
    return;
  }
  form.reset();
  avisar("Entregador cadastrado.");
  carregarLista();
}

// [RF-EMP-11] A página lê somente o código de conexão da empresa da sessão;
// o serviço continua responsável por validar o escopo e persistir a renovação.
function atualizarCodigoConexao() {
  const codigo = obterEmpresa(empresaId)?.connectionCode ?? "";
  $("#codigo-conexao").textContent = codigo || "Nenhum código gerado";
  $("#copiar-codigo").disabled = !codigo;
  $("#gerar-codigo").textContent = codigo ? "Renovar código" : "Gerar código";
}

// [RF-EMP-11] Renovar invalida qualquer cópia anterior, então pedimos confirmação
// antes de gravar. Um erro do serviço mantém visível o código que ainda vale.
async function gerarCodigoDeConexao() {
  $("#erro-codigo").textContent = "";
  $("#status-codigo").textContent = "";
  const codigoAtual = obterEmpresa(empresaId)?.connectionCode;
  if (codigoAtual) {
    const resposta = await confirmar({
      titulo: "Renovar código de conexão?",
      texto: "O código atual será invalidado imediatamente. Entregadores que ainda não o usaram precisarão do novo código.",
      textoConfirmar: "Renovar código",
    });
    if (!resposta) return;
  }

  const resultado = gerarCodigoConexao(empresaId);
  if (!resultado.ok) {
    $("#erro-codigo").textContent = resultado.erro;
    avisar(resultado.erro, "err");
    return;
  }
  $("#erro-codigo").textContent = "";
  $("#status-codigo").textContent = "Novo código gerado. O anterior foi invalidado.";
  atualizarCodigoConexao();
  avisar("Código de conexão gerado.");
}

async function copiarCodigoConexao() {
  const codigo = obterEmpresa(empresaId)?.connectionCode;
  if (!codigo) return;

  try {
    await navigator.clipboard.writeText(codigo);
    $("#status-codigo").textContent = "Código copiado.";
    avisar("Código copiado.");
  } catch {
    $("#status-codigo").textContent = `Não foi possível copiar automaticamente. Copie este código: ${codigo}`;
    avisar(`Copie manualmente: ${codigo}`, "info");
  }
}

aplicarTemaSalvo();
carregarDados();
if (exigirEmpresa()) {
  empresaId = normalizarSessao().companyId;
  montarBarraDemo($("#demo"));
  montarMenuLateral("entregadores", empresaId);
  ligarMenuMovel();
  montarIcones();
  atualizarCodigoConexao();
  carregarLista();
  $("#form-entregador").addEventListener("submit", enviarCadastro);
  $("#entregador-telefone").addEventListener("input", (evento) => {
    evento.target.value = formatarTelefone(evento.target.value);
  });
  $("#gerar-codigo").addEventListener("click", gerarCodigoDeConexao);
  $("#copiar-codigo").addEventListener("click", copiarCodigoConexao);
  escutarMudancas(() => {
    atualizarCodigoConexao();
    carregarLista();
  });
}
