// src/components/toast.js — aviso rápido no topo da tela. tipo: "ok" | "info" | "err".
import { el } from "./dom.js";
import { icone } from "./icon.js";

const ICONE = { ok: "checkc", info: "info", err: "alert" };
const DURACAO_MS = { ok: 3800, info: 3800, err: 6000 };

function caixaDeAvisos() {
  let caixa = document.getElementById("toasts");
  if (!caixa) {
    caixa = el("div", { class: "toasts", id: "toasts" });
    document.body.append(caixa);
  }
  return caixa;
}

export function avisar(mensagem, tipo = "ok") {
  const aviso = el("div", { class: tipo === "ok" ? "toast" : `toast ${tipo}`, role: tipo === "err" ? "alert" : "status" },
    icone(ICONE[tipo], 20), el("div", {}, mensagem));
  caixaDeAvisos().append(aviso);
  setTimeout(() => aviso.remove(), DURACAO_MS[tipo]);
}
