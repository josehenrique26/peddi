// src/components/bar-chart.js — gráfico de colunas em SVG (createElementNS), sem biblioteca.
// Uso: const g = graficoDeBarras(container, { rotuloY: "pedidos" }); g.atualizar(baldes);
// Cada balde: { rotulo, titulo, pedidos, futuro }. O gráfico se redesenha quando o container muda de largura.
import { h } from "../utils/dom.js";

const NS = "http://www.w3.org/2000/svg";
const svgEl = (tag, atributos = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, v);
  return e;
};

const ALTURA = 240;                       // inclui a faixa do eixo X
const M = { topo: 20, direita: 4, baixo: 26, esquerda: 30 };
const LARGURA_MAX_BARRA = 24, FOLGA = 2, RAIO = 4;

// Escolhe um teto "redondo" e 3 marcas no eixo Y (0, meio, teto), sempre inteiras.
function escalaY(maximo) {
  const teto = Math.max(4, Math.ceil(maximo / 4) * 4);
  return { teto, marcas: [0, teto / 2, teto] };
}

// Barra com cantos arredondados só no topo (a base fica reta, colada no eixo).
function caminhoBarra(x, y, w, alt) {
  const r = Math.min(RAIO, w / 2, alt);
  return `M${x},${y + alt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + alt}Z`;
}

export function graficoDeBarras(container, { descricao }) {
  let baldes = [];
  const tooltip = h("div", { class: "chart-tip", role: "status", hidden: true });
  const area = h("div", { class: "chart-area" });
  container.replaceChildren(area, tooltip);

  function mostrarTip(balde, x) {
    tooltip.replaceChildren(
      h("strong", {}, balde.titulo),
      h("span", {}, balde.futuro ? "Ainda não chegou" : `${balde.pedidos} ${balde.pedidos === 1 ? "pedido" : "pedidos"}`));
    tooltip.hidden = false;
    const meio = tooltip.offsetWidth / 2;
    const esq = Math.min(Math.max(x - meio, 0), container.clientWidth - tooltip.offsetWidth);
    tooltip.style.left = `${esq}px`;
  }

  function desenhar() {
    const largura = Math.floor(container.clientWidth);
    if (!largura || !baldes.length) return;
    const util = largura - M.esquerda - M.direita, altUtil = ALTURA - M.topo - M.baixo;
    const maximo = Math.max(...baldes.map((b) => b.pedidos));
    const { teto, marcas } = escalaY(maximo);
    const slot = util / baldes.length;
    const larguraBarra = Math.min(LARGURA_MAX_BARRA, slot - FOLGA);
    const yDe = (v) => M.topo + altUtil - (v / teto) * altUtil;

    const svg = svgEl("svg", { class: "chart-svg", width: largura, height: ALTURA, viewBox: `0 0 ${largura} ${ALTURA}`, role: "img", "aria-label": descricao });

    for (const v of marcas) {                                // grade e eixo Y
      svg.append(
        svgEl("line", { x1: M.esquerda, x2: largura - M.direita, y1: yDe(v), y2: yDe(v), class: v === 0 ? "chart-base" : "chart-grid" }),
      );
      const t = svgEl("text", { x: M.esquerda - 6, y: yDe(v) + 4, "text-anchor": "end", class: "chart-ax" });
      t.textContent = String(v);
      svg.append(t);
    }

    const indicePico = maximo > 0 ? baldes.findIndex((b) => b.pedidos === maximo) : -1;
    baldes.forEach((b, i) => {
      const cx = M.esquerda + slot * i + slot / 2;
      const alt = (b.pedidos / teto) * altUtil;
      if (alt > 0) svg.append(svgEl("path", { d: caminhoBarra(cx - larguraBarra / 2, M.topo + altUtil - alt, larguraBarra, alt), class: "chart-bar" }));
      if (b.rotulo) {
        const t = svgEl("text", { x: cx, y: ALTURA - 8, "text-anchor": "middle", class: "chart-ax" });
        t.textContent = b.rotulo;
        svg.append(t);
      }
      if (i === indicePico) {                                // rótulo direto só no ponto mais alto
        const t = svgEl("text", { x: cx, y: M.topo + altUtil - alt - 6, "text-anchor": "middle", class: "chart-peak" });
        t.textContent = String(b.pedidos);
        svg.append(t);
      }
      const alvo = svgEl("rect", { x: cx - slot / 2, y: M.topo, width: slot, height: altUtil + M.baixo, class: "chart-hit" });
      alvo.addEventListener("pointerenter", () => mostrarTip(b, cx));
      alvo.addEventListener("pointermove", () => mostrarTip(b, cx));
      alvo.addEventListener("pointerleave", () => { tooltip.hidden = true; });
      svg.append(alvo);
    });
    area.replaceChildren(svg);
  }

  new ResizeObserver(desenhar).observe(container);

  return { atualizar(novos) { baldes = novos; tooltip.hidden = true; desenhar(); } };
}
