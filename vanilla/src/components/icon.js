// src/components/icon.js — ícones SVG criados com createElementNS. Acrescente novos em ICONES.
const NS = "http://www.w3.org/2000/svg";

const ICONES = {
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  route: [["circle", { cx: 6, cy: 19, r: 2 }], ["circle", { cx: 18, cy: 5, r: 2 }], ["path", { d: "M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" }]],
  key: [["circle", { cx: 8, cy: 15, r: 4 }], ["path", { d: "m11 12 9-9M16 7l3 3" }]],
  bike: [["circle", { cx: 6, cy: 17, r: 3.5 }], ["circle", { cx: 18, cy: 17, r: 3.5 }], ["path", { d: "M6 17l4-8h5l3 8M10 9 8 6H6M14 9l-3 8" }]],
  pin: [["path", { d: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" }], ["circle", { cx: 12, cy: 9.5, r: 2.5 }]],
  store: [["path", { d: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 20v-5h4v5" }]],
  user: [["circle", { cx: 12, cy: 8, r: 4 }], ["path", { d: "M4 21a8 8 0 0 1 16 0" }]],
  moon: [["path", { d: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" }]],
  refresh: [["path", { d: "M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" }]],
};

function svg(tag, atributos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
  return el;
}

export function icone(nome, tamanho = 18) {
  const raiz = svg("svg", {
    class: "ico", width: tamanho, height: tamanho, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true",
  });
  for (const [tag, atributos] of ICONES[nome] ?? []) raiz.append(svg(tag, atributos));
  return raiz;
}

// Troca cada <span data-icon="nome" data-size="22"> do HTML pelo ícone correspondente.
export function montarIcones(raiz = document) {
  raiz.querySelectorAll("[data-icon]").forEach((marcador) => {
    marcador.replaceWith(icone(marcador.dataset.icon, Number(marcador.dataset.size) || 16));
  });
}
