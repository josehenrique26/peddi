// src/components/icon.js — ícones SVG criados com createElementNS. Acrescente novos em ICONES.
const NS = "http://www.w3.org/2000/svg";

const ICONES = {
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  route: [
    ["circle", { cx: 6, cy: 19, r: 2 }],
    ["circle", { cx: 18, cy: 5, r: 2 }],
    ["path", { d: "M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" }],
  ],
  key: [
    ["circle", { cx: 8, cy: 15, r: 4 }],
    ["path", { d: "m11 12 9-9M16 7l3 3" }],
  ],
  bike: [
    ["circle", { cx: 6, cy: 17, r: 3.5 }],
    ["circle", { cx: 18, cy: 17, r: 3.5 }],
    ["path", { d: "M6 17l4-8h5l3 8M10 9 8 6H6M14 9l-3 8" }],
  ],
  pin: [
    ["path", { d: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" }],
    ["circle", { cx: 12, cy: 9.5, r: 2.5 }],
  ],
  store: [
    [
      "path",
      {
        d: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M10 20v-5h4v5",
      },
    ],
  ],
  phone: [
    [
      "path",
      {
        d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
      },
    ],
  ],
  user: [
    ["circle", { cx: 12, cy: 8, r: 4 }],
    ["path", { d: "M4 21a8 8 0 0 1 16 0" }],
  ],
  moon: [["path", { d: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" }]],
  sun: [
    ["circle", { cx: 12, cy: 12, r: 5 }],
    [
      "path",
      {
        d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41",
      },
    ],
  ],
  inbox: [["path", { d: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" }]],
  clock: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "M12 7v5l3 2" }],
  ],
  checkc: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "m8 12 3 3 5-6" }],
  ],
  xc: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "m9 9 6 6M15 9l-6 6" }],
  ],
  ban: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "m5.6 5.6 12.8 12.8" }],
  ],
  grid: [
    ["rect", { x: 3, y: 3, width: 7, height: 9, rx: 1 }],
    ["rect", { x: 14, y: 3, width: 7, height: 5, rx: 1 }],
    ["rect", { x: 14, y: 12, width: 7, height: 9, rx: 1 }],
    ["rect", { x: 3, y: 16, width: 7, height: 5, rx: 1 }],
  ],
  receipt: [["path", { d: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" }]],
  book: [
    [
      "path",
      { d: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11" },
    ],
  ],
  sliders: [
    ["path", { d: "M4 7h9M17 7h3M4 17h3M11 17h9" }],
    ["circle", { cx: 15, cy: 7, r: 2 }],
    ["circle", { cx: 9, cy: 17, r: 2 }],
  ],
  eye: [
    ["path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" }],
    ["circle", { cx: 12, cy: 12, r: 3 }],
  ],
  menu: [["path", { d: "M4 6h16M4 12h16M4 18h16" }]],
  plus: [["path", { d: "M12 5v14M5 12h14" }]],
  bag: [["path", { d: "M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0" }]],
  cart: [
    ["circle", { cx: 9, cy: 20, r: 1.5 }],
    ["circle", { cx: 18, cy: 20, r: 1.5 }],
    ["path", { d: "M2 3h3l2.5 12h11L21 7H6" }],
  ],
  search: [
    ["circle", { cx: 11, cy: 11, r: 7 }],
    ["path", { d: "m20 20-3.5-3.5" }],
  ],
  trash: [
    ["path", { d: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6" }],
  ],
  back: [["path", { d: "M19 12H5M11 6l-6 6 6 6" }]],
  alert: [["path", { d: "M12 3 2 20h20zM12 10v5M12 18h.01" }]],
  info: [
    ["circle", { cx: 12, cy: 12, r: 9 }],
    ["path", { d: "M12 11v5M12 8h.01" }],
  ],
  refresh: [
    [
      "path",
      {
        d: "M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5",
      },
    ],
  ],
};

function svg(tag, atributos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
  return el;
}

export function icone(nome, tamanho = 18) {
  const raiz = svg("svg", {
    class: "ico",
    width: tamanho,
    height: tamanho,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  });
  for (const [tag, atributos] of ICONES[nome] ?? [])
    raiz.append(svg(tag, atributos));
  return raiz;
}

// Troca cada <span data-icon="nome" data-size="22"> do HTML pelo ícone correspondente.
export function montarIcones(raiz = document) {
  raiz.querySelectorAll("[data-icon]").forEach((marcador) => {
    marcador.replaceWith(
      icone(marcador.dataset.icon, Number(marcador.dataset.size) || 16),
    );
  });
}
