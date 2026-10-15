// src/utils/dom.js — helper h() para criar elementos com createElement (sem innerHTML).
// h("button", { class: "btn", onclick: fn, "aria-pressed": "true" }, "Texto", outroElemento)
export function h(tag, atributos = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos ?? {})) {
    if (valor == null || valor === false) continue;
    if (nome.startsWith("on") && typeof valor === "function") {
      el.addEventListener(nome.slice(2).toLowerCase(), valor);
    } else if (nome === "dataset") {
      Object.assign(el.dataset, valor);
    } else if (nome === "class") {
      el.className = valor;
    } else {
      el.setAttribute(nome, valor === true ? "" : valor);
    }
  }
  el.append(...filhos.flat().filter((f) => f != null && f !== false));
  return el;
}
