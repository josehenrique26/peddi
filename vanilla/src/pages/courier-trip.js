// src/pages/courier-trip.js — uma viagem (entregador-viagem.html?id=VG-502): retirada e entregas, uma parada por vez.
// Antes da retirada só aparecem bairro e itens. Depois, cada parada mostra cliente, telefone e endereço completo.
import { aplicarTemaSalvo } from "../utils/theme.js";
import { exigirEntregador } from "../utils/guard.js";
import { brl, quando, hora, dataCurta, plural } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { PAGAMENTOS, MAX_TENTATIVAS, MOTIVOS_FALHA } from "../data/order-rules.js";
import { carregarDados, escutarMudancas } from "../services/storage.js";
import { resumoDosItens, enderecoEmTexto } from "../services/client-orders.js";
import {
  entregadorAtual, obterViagem, obterPedido, entregasDaViagem, paradaAtual, tentativasRestantes,
  desfazerViagem, registrarRetirada, confirmarEntrega, registrarFalha, liberarTentativas,
} from "../services/courier-orders.js";
import { el, mount } from "../components/dom.js";
import { icone } from "../components/icon.js";
import { montarBarraDemo } from "../components/demo-bar.js";
import { montarCasca, avisoDeInativo, abrirJanela, botaoFechar } from "../components/courier-shell.js";
import { seloDeEstado, seloDeViagem } from "../components/status-badge.js";
import { estadoVazio } from "../components/empty-state.js";
import { confirmar } from "../components/confirm-dialog.js";
import { avisar } from "../components/toast.js";

const $ = (seletor) => document.querySelector(seletor);
const viagemId = new URLSearchParams(location.search).get("id");

/* ---------- janelas ---------- */
// Código de 4 dígitos que o cliente vê no acompanhamento do pedido.
function abrirCodigo(pedido, entregador) {
  const erro = el("div", { class: "err", role: "alert" });
  const campo = el("input", { type: "text", id: "codigo", class: "code-in", inputmode: "numeric", maxlength: 4, placeholder: "0000", autocomplete: "off", autofocus: true });
  const demo = el("span", { class: "strong" });

  abrirJanela({
    titulo: `Entrega ${pedido.id}`,
    subtitulo: pedido.contact.name,
    corpo: [
      el("div", { class: "field" }, el("label", { for: "codigo" }, "Código informado pelo cliente"), campo, erro),
      el("p", { class: "small muted" },
        el("button", { type: "button", class: "linkish", onclick: () => { demo.textContent = pedido.code; } }, "Ver código (apenas demonstração)"), " ", demo),
    ],
    rodape: [botaoFechar("Cancelar"), el("button", { type: "submit", class: "btn btn-primary" }, "Confirmar entrega")],
    aoEnviar(janela) {
      const resultado = confirmarEntrega(pedido.id, campo.value, entregador.id);
      if (resultado.ok) {
        janela.close();
        avisar(`Entrega do pedido ${pedido.id} confirmada.`);
        desenhar();
      } else if (resultado.bloqueada) {
        janela.close();
        avisar(resultado.erro, "err");
        desenhar();
      } else {
        erro.textContent = resultado.erro;
        campo.setAttribute("aria-invalid", "true");
        campo.select();
        if (resultado.restam) desenhar(); // atualiza as tentativas na tela de trás
      }
    },
  });
}

// Entrega não concluída: o motivo fica salvo no pedido e a empresa o enxerga.
function abrirFalha(pedido, entregador) {
  const erro = el("div", { class: "err", role: "alert" });
  const detalhe = el("textarea", { id: "detalhe", rows: 3, maxlength: 200, placeholder: "Detalhe (obrigatório em “Outro motivo”)" });

  abrirJanela({
    titulo: "Entrega não concluída",
    subtitulo: `${pedido.id} · ${pedido.contact.name}`,
    corpo: [
      el("div", { class: "radio-cards", role: "radiogroup", "aria-label": "Motivo" }, MOTIVOS_FALHA.map((m) =>
        el("label", { class: "rc" }, el("input", { type: "radio", name: "motivo", value: m.id }), m.rotulo))),
      el("div", { class: "field" }, el("label", { for: "detalhe" }, "Detalhes"), detalhe, erro),
      el("p", { class: "small muted" }, "O pedido será encerrado como cancelado e o motivo ficará visível para o estabelecimento."),
    ],
    rodape: [botaoFechar(), el("button", { type: "submit", class: "btn btn-danger-solid" }, "Registrar")],
    aoEnviar(janela) {
      const escolhido = janela.querySelector('input[name="motivo"]:checked');
      const resultado = registrarFalha(pedido.id, escolhido?.value, detalhe.value, entregador.id);
      if (!resultado.ok) { erro.textContent = resultado.erro; return; }
      janela.close();
      avisar(`Pedido ${pedido.id} registrado como não concluído.`, "info");
      desenhar();
    },
  });
}

/* ---------- ações da viagem ---------- */
function retirar(viagem, entregador) {
  const resultado = registrarRetirada(viagem.id, entregador.id);
  if (resultado.ok) avisar("Retirada registrada. Boas entregas!");
  else avisar(resultado.erro, "err");
  desenhar();
}

async function desfazer(viagem, entregador) {
  const resposta = await confirmar({
    titulo: `Desfazer a viagem ${viagem.id}?`,
    texto: "Os pedidos voltam para a lista de disponíveis.",
    textoConfirmar: "Desfazer viagem", perigo: true,
  });
  if (!resposta) return;
  const resultado = desfazerViagem(viagem.id, entregador.id);
  if (resultado.ok) { avisar("Viagem desfeita."); location.assign(rotas.entregador()); return; }
  avisar(resultado.erro, "err");
  desenhar();
}

/* ---------- parada ---------- */
function acoesDaParada(pedido, entrega, viagem, entregador) {
  const atual = paradaAtual(viagem);
  if (atual !== pedido.id) {
    const nAtual = viagem.orderIds.indexOf(atual) + 1;
    return el("div", { class: "banner bn-info" }, icone("clock"), `Conclua a parada ${nAtual} antes desta.`);
  }
  if (tentativasRestantes(entrega) <= 0) {
    return el("div", { class: "stack" },
      el("div", { class: "banner bn-err" }, icone("ban"),
        el("div", {}, el("strong", {}, "Entrega bloqueada. "), `Os ${MAX_TENTATIVAS} códigos informados estavam incorretos. Fale com o estabelecimento ou registre a entrega como não concluída.`)),
      el("div", { class: "row" },
        el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => abrirFalha(pedido, entregador) }, "Entrega não concluída"),
        el("button", { type: "button", class: "linkish small", onclick: () => { liberarTentativas(pedido.id, entregador.id); desenhar(); } }, "Liberar tentativas (demonstração)")));
  }
  const restam = tentativasRestantes(entrega);
  return el("div", { class: "stack" },
    restam < MAX_TENTATIVAS && el("div", { class: "small muted" }, `${restam} ${plural(restam, "tentativa restante", "tentativas restantes")}.`),
    el("div", { class: "row" },
      el("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => abrirCodigo(pedido, entregador) }, icone("key", 15), "Informar código"),
      el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => abrirFalha(pedido, entregador) }, "Não concluída")));
}

function situacaoDaParada(pedido, entrega, viagem, entregador) {
  if (entrega.state === "entregue") return el("div", { class: "banner bn-ok" }, icone("checkc"), `Entregue ${dataCurta(entrega.completedAt)} às ${hora(entrega.completedAt)}.`);
  if (entrega.state === "nao_concluida") return el("div", { class: "banner bn-warn" }, icone("alert"), `Não concluída: ${entrega.failReason}`);
  if (entrega.state === "cancelada") return el("div", { class: "muted small" }, `Removido da viagem (pedido ${pedido.state === "cancelado" ? "cancelado" : "indisponível"}).`);
  if (entrega.state === "em_entrega") return acoesDaParada(pedido, entrega, viagem, entregador);
  return null; // "aguardando": ainda não retirado
}

function cartaoDaParada(pedido, entrega, viagem, entregador, indice) {
  const retirado = viagem.state !== "aguardando_retirada";
  const aberta = entrega.state === "em_entrega";
  const detalhes = retirado && entrega.state !== "cancelada" ? [
    el("div", {}, pedido.contact.name, " · ", el("a", { href: `tel:${pedido.contact.phone.replace(/[^\d+]/g, "")}` }, pedido.contact.phone)),
    el("div", { class: "addr" }, icone("pin", 14), ` ${enderecoEmTexto(pedido)}`),
    el("a", { class: "small", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pedido.address.street}, ${pedido.address.district}`)}`, target: "_blank", rel: "noopener noreferrer" }, "Abrir no mapa"),
  ] : [el("div", { class: "muted small" }, icone("pin", 13), ` ${pedido.address.district}`)];

  return el("article", { class: `card pad-sm stack stop${aberta && paradaAtual(viagem) === pedido.id ? " atual" : ""}${entrega.state === "entregue" ? " done" : ""}` },
    el("div", { class: "row between" },
      el("span", { class: "row" }, el("span", { class: "stop-n" }, String(indice + 1)), el("span", { class: "oid-d" }, pedido.id)),
      seloDeEstado(pedido.state)),
    ...detalhes,
    el("div", { class: "small" }, resumoDosItens(pedido.id)),
    retirado && entrega.state !== "cancelada" && el("div", { class: "muted small" }, `${PAGAMENTOS[pedido.payment]} · valor informativo ${brl(pedido.total)}`),
    situacaoDaParada(pedido, entrega, viagem, entregador));
}

/* ---------- tela ---------- */
function desenhar() {
  const entregador = entregadorAtual();
  const viagem = viagemId ? obterViagem(viagemId) : null;
  montarCasca("viagens", entregador);

  if (!viagem || viagem.courierId !== entregador.id) {
    mount($("#main"), estadoVazio({
      icone: "search", titulo: "Viagem não encontrada",
      texto: "Ela não existe ou pertence a outro entregador.",
      acao: el("a", { class: "btn btn-primary", href: rotas.entregadorViagens() }, "Minhas viagens"),
    }));
    return;
  }

  const entregas = entregasDaViagem(viagem.id);
  const paradas = viagem.orderIds.map((id, i) => ({ pedido: obterPedido(id), entrega: entregas.find((e) => e.orderId === id), indice: i }));
  const ativas = paradas.filter((p) => p.entrega.state !== "cancelada");
  const fechadas = ativas.filter((p) => !["aguardando", "em_entrega"].includes(p.entrega.state)).length;
  const aguardando = entregas.filter((e) => e.state === "aguardando").length;
  const pendentes = entregas.filter((e) => e.state === "em_entrega").length;

  mount($("#main"),
    avisoDeInativo(entregador),
    el("a", { class: "btn btn-ghost btn-sm", href: rotas.entregadorViagens(), style: { alignSelf: "flex-start" } }, icone("back", 15), "Viagens"),
    el("div", { class: "row between" },
      el("div", {}, el("h2", {}, viagem.id),
        el("p", { class: "muted small" }, viagem.pickedUpAt ? `Retirada ${quando(viagem.pickedUpAt)}` : `Criada ${quando(viagem.createdAt)}`)),
      seloDeViagem(viagem.state)),

    viagem.state === "aguardando_retirada" && [
      el("div", { class: "banner bn-info" }, icone("info"), "Confira os pedidos com o estabelecimento e registre a retirada. Todos saem juntos para “Em entrega”."),
      el("button", { type: "button", class: "btn btn-primary btn-lg btn-block", onclick: () => retirar(viagem, entregador) }, `Registrar retirada ${plural(aguardando, "do pedido", `dos ${aguardando} pedidos`)}`),
      el("button", { type: "button", class: "btn btn-ghost btn-block", onclick: () => desfazer(viagem, entregador) }, "Desfazer viagem"),
    ],
    viagem.state === "em_andamento" && el("section", { class: "card pad-sm", "aria-label": "Progresso" },
      el("div", { class: "strong" }, `${fechadas} de ${ativas.length} ${plural(ativas.length, "parada concluída", "paradas concluídas")}`),
      el("div", { class: "cr-prog", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": ativas.length, "aria-valuenow": fechadas }, el("i", { style: { width: `${ativas.length ? (fechadas / ativas.length) * 100 : 0}%` } })),
      el("div", { class: "muted small" }, `${pendentes} ${plural(pendentes, "entrega pendente", "entregas pendentes")}. Cada pedido só é concluído com o código informado pelo cliente.`)),
    paradas.map((p) => cartaoDaParada(p.pedido, p.entrega, viagem, entregador, p.indice)));
}

aplicarTemaSalvo();
carregarDados();
if (exigirEntregador()) {
  montarBarraDemo($("#demo"));
  desenhar();
  escutarMudancas(desenhar);
}
