// src/components/confirm-dialog.js — janela de confirmação com o <dialog> nativo (foco e Esc já funcionam).
// Devolve uma Promise: { motivo } se o cliente confirmou, ou null se desistiu.
import { el } from "./dom.js";

export function confirmar({ titulo, texto, textoConfirmar = "Confirmar", perigo = false, pedirMotivo = false }) {
  return new Promise((resolve) => {
    const motivo = el("textarea", { id: "motivo", rows: 3, maxlength: 200, placeholder: "Conte rapidamente o motivo" });
    const janela = el("dialog", { class: "modal", "aria-labelledby": "dialogo-titulo" },
      el("form", { method: "dialog" },
        el("div", { class: "m-hd" }, el("h2", { id: "dialogo-titulo" }, titulo)),
        el("div", { class: "m-bd" },
          el("p", {}, texto),
          pedirMotivo && el("div", { class: "field" }, el("label", { for: "motivo" }, "Motivo (opcional)"), motivo),
        ),
        el("div", { class: "m-ft" },
          el("button", { type: "button", class: "btn btn-ghost", onclick: () => janela.close() }, "Voltar"),
          el("button", { type: "submit", class: perigo ? "btn btn-danger-solid" : "btn btn-primary", value: "confirmar" }, textoConfirmar),
        ),
      ),
    );

    // "close" dispara ao confirmar, ao voltar e ao apertar Esc.
    janela.addEventListener("close", () => {
      const confirmou = janela.returnValue === "confirmar";
      janela.remove();
      resolve(confirmou ? { motivo: motivo.value.trim() } : null);
    });

    document.body.append(janela);
    janela.showModal();
  });
}
