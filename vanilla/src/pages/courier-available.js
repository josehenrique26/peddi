// src/pages/courier-available.js — pedidos prontos da empresa do entregador (entregador.html).
// Antes da retirada só aparecem bairro e itens; nome, telefone e endereço completo são liberados depois.
import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEntregador } from "../utils/guard.js";
import { brl, quando, plural } from "../utils/format.js";
import { rotas, navegar } from "../utils/routes.js";
import { MAX_PEDIDOS_VIAGEM } from "../data/order-rules.js";
import { carregarDados, escutarMudancas } from "../services/storage.js";
import { obterEmpresa } from "../services/companies.js";
import { resumoDosItens } from "../services/client-orders.js";
import {
  entregadorAtual,
  pedidosProntos,
  viagemAtiva,
  criarViagem,
  ultimoEvento,
  confirmarIdentidadeEntregador,
  identidadeEntregadorConfirmada,
} from "../services/courier-orders.js";
import { el, mount } from "../components/dom.js";
import { icone } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarCasca, avisoDeInativo, abrirJanela, botaoFechar } from "../components/courier-shell.js";
import { seloDeEstado } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);

const selecionados = new Set();
let barra = {}; // contador e botões da barra de ação, atualizados sem redesenhar a lista

/* ---------- barra de seleção ---------- */
function atualizarBarra() {
  const qtd = selecionados.size;
  barra.contador.textContent = String(qtd);
  barra.limpar.disabled = !qtd;
  barra.revisar.disabled = !qtd;
}

function alternar(pedidoId, caixa) {
  if (caixa.checked && selecionados.size >= MAX_PEDIDOS_VIAGEM) {
    caixa.checked = false;
    avisar(`Uma viagem aceita no máximo ${MAX_PEDIDOS_VIAGEM} pedidos.`, "err");
    return;
  }
  if (caixa.checked) selecionados.add(pedidoId); else selecionados.delete(pedidoId);
  atualizarBarra();
}

function limpar() {
  selecionados.clear();
  document.querySelectorAll(".selcard input").forEach((caixa) => { caixa.checked = false; });
  atualizarBarra();
}

/* ---------- revisar e confirmar a viagem ---------- */
function revisarViagem(entregador) {
  const pedidos = pedidosProntos(entregador.companyId).filter((p) => selecionados.has(p.id));
  if (!pedidos.length) { desenhar(); return; }

  abrirJanela({
    titulo: "Revisar viagem",
    subtitulo: `${pedidos.length} ${plural(pedidos.length, "pedido", "pedidos")} · ${obterEmpresa(entregador.companyId).name}`,
    corpo: el("div", { class: "stack" },
      pedidos.map((p) => el("div", { class: "card pad-sm" },
        el("div", { class: "row between" }, el("span", { class: "strong" }, p.id), el("span", { class: "muted small" }, p.address.district)),
        el("div", { class: "muted small" }, resumoDosItens(p.id)))),
      el("p", { class: "muted small" }, "Cada pedido continua independente, com cliente, endereço e código próprios. Os dados completos aparecem depois que você registrar a retirada.")),
    rodape: [botaoFechar(), el("button", { type: "submit", class: "btn btn-primary" }, "Confirmar viagem")],
    aoEnviar(janela) {
      const resultado = criarViagem(entregador.id, [...selecionados]);
      janela.close();
      if (resultado.ok) { selecionados.clear(); navegar(rotas.entregadorViagem(resultado.id)); return; }
      avisar(resultado.erro, "err");
      desenhar();
    },
  });
}

/* ---------- tela ---------- */
function cartaoDoPedido(pedido, travado) {
  const caixa = el("input", {
    type: "checkbox", checked: selecionados.has(pedido.id), disabled: travado,
    "aria-label": `Selecionar pedido ${pedido.id}`, onchange: () => alternar(pedido.id, caixa),
  });
  return el("label", { class: "selcard" }, caixa,
    el("div", { class: "grow" },
      el("div", { class: "row between" }, el("span", { class: "oid-d" }, pedido.id), seloDeEstado(pedido.state)),
      el("div", { class: "muted small" }, icone("pin", 13), ` ${pedido.address.district}`),
      el("div", { class: "small", style: { margin: "4px 0" } }, resumoDosItens(pedido.id)),
      el("div", { class: "muted small" }, `Pronto ${quando(ultimoEvento(pedido).at)} · valor informativo ${brl(pedido.total)}`)));
}

function formularioDeConfirmacao() {
  const telefone = el("input", {
    id: "confirmar-telefone",
    name: "phone",
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    required: true,
    placeholder: "(83) 90000-0000",
    "aria-label": "Telefone cadastrado do entregador",
  });
  const codigo = el("input", {
    id: "confirmar-codigo",
    name: "connectionCode",
    type: "text",
    inputMode: "text",
    autoComplete: "off",
    autoCapitalize: "characters",
    maxLength: 8,
    required: true,
    placeholder: "Ex.: A1B2C3D4",
    "aria-label": "Código de conexão da empresa",
  });
  const formulario = el("form", { class: "card stack", onsubmit: (evento) => {
    evento.preventDefault();
    const resultado = confirmarIdentidadeEntregador(telefone.value, codigo.value);
    if (!resultado.ok) {
      avisar(resultado.erro, "err");
      return;
    }
    avisar(`Identidade confirmada. Olá, ${resultado.entregador.name}.`);
    montarBarraDemo($("#demo"));
    desenhar();
  } },
  el("div", {},
    el("h2", {}, "Confirme sua identidade"),
    el("p", { class: "muted small" }, "Informe o telefone cadastrado no estabelecimento e o código de conexão de 8 caracteres fornecido pela empresa. O código comercial usado pelos clientes não serve para esta confirmação.")),
  el("label", { for: "confirmar-telefone" }, "Telefone com DDD"),
  telefone,
  el("label", { for: "confirmar-codigo" }, "Código de conexão da empresa"),
  codigo,
  el("button", { type: "submit", class: "btn btn-primary" }, "Confirmar e ver pedidos"));
  return formulario;
}

function desenhar() {
  const entregador = entregadorAtual();
  // [INTEGRAÇÃO] A lista só é montada depois que o serviço confirma a identidade.
  if (!identidadeEntregadorConfirmada(entregador.id)) {
    montarCasca("disp", entregador);
    mount($("#main"), formularioDeConfirmacao());
    return;
  }

  const empresa = obterEmpresa(entregador.companyId);
  const prontos = pedidosProntos(entregador.companyId);
  const ativa = viagemAtiva(entregador.id);
  const travado = Boolean(ativa) || !entregador.active;

  for (const id of [...selecionados]) if (!prontos.some((p) => p.id === id)) selecionados.delete(id); // outro entregador pegou

  barra = {
    contador: el("strong", {}, "0"),
    limpar: el("button", { type: "button", class: "btn btn-sm btn-dark", onclick: limpar }, "Limpar"),
    revisar: el("button", { type: "button", class: "btn btn-sm btn-primary", onclick: () => revisarViagem(entregador) }, "Revisar viagem"),
  };

  montarCasca("disp", entregador);
  mount($("#main"),
    avisoDeInativo(entregador),
    ativa && el("div", { class: "banner bn-info", role: "status" }, icone("bike"),
      el("div", { class: "grow" }, el("strong", {}, "Você tem uma viagem em andamento. "), "Conclua as entregas antes de iniciar outra.",
        el("div", { style: { marginTop: "8px" } }, el("a", { class: "btn btn-dark btn-sm", href: rotas.entregadorViagem(ativa.id) }, "Ver viagem atual")))),
    el("div", {},
      el("h2", {}, "Pedidos prontos"),
      el("p", { class: "muted small" }, `Somente pedidos de ${empresa.name}. Selecione até ${MAX_PEDIDOS_VIAGEM} para uma viagem.`)),
    prontos.length
      ? prontos.map((p) => cartaoDoPedido(p, travado))
      : estadoVazio({ icone: "bag", titulo: "Nenhum pedido pronto agora", texto: "Quando o estabelecimento marcar pedidos como prontos, eles aparecem aqui." }),
    prontos.length > 0 && !travado && el("div", { class: "actbar", role: "region", "aria-label": "Seleção" },
      el("span", { "aria-live": "polite" }, barra.contador, ` de ${MAX_PEDIDOS_VIAGEM} selecionados`),
      el("span", { class: "row" }, barra.limpar, barra.revisar)),
  );
  if (barra.contador.isConnected) atualizarBarra();
}

aplicarTemaSalvo();
carregarDados();
if (exigirEntregador()) {
  montarBarraDemo($("#demo"));
  desenhar();
  escutarMudancas(desenhar); // empresa ou outro entregador mexeu nos pedidos: redesenha
  setInterval(() => { if (!document.querySelector("dialog[open]")) desenhar(); }, 60000);
}
