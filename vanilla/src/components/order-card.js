// src/components/order-card.js — cartão de um pedido na lista "Meus pedidos".
import { el } from "./dom.js";
import { icone } from "./icon.js";
import { brl, quando } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { obterEmpresa } from "../services/companies.js";
import { resumoDosItens, podeCancelar } from "../services/client-orders.js";
import { seloDeEstado } from "./status-badge.js";

export function cartaoDoPedido(pedido, { aoCancelar }) {
  const empresa = obterEmpresa(pedido.companyId);
  const mostrarMotivo = pedido.reason && pedido.state !== "entregue";

  return el("article", { class: "card pad" },
    el("div", { class: "row between top" },
      el("div", {},
        el("a", { class: "order-id", href: rotas.pedido(pedido.id) }, pedido.id),
        el("div", { class: "muted small" }, `${empresa?.name ?? "Empresa"} · ${quando(pedido.createdAt)}`),
      ),
      seloDeEstado(pedido.state),
    ),
    el("p", { class: "order-items" }, resumoDosItens(pedido.id)),
    mostrarMotivo && el("p", { class: "small muted" }, `Motivo: ${pedido.reason}`),
    el("div", { class: "row between" },
      el("span", { class: "strong" }, brl(pedido.total)),
      el("span", { class: "row" },
        el("a", { class: "btn btn-ghost btn-sm", href: rotas.pedido(pedido.id) }, icone("eye", 15), "Detalhes"),
        podeCancelar(pedido) && el("button", { type: "button", class: "btn btn-danger btn-sm", onclick: () => aoCancelar(pedido) }, "Cancelar"),
      ),
    ),
  );
}
