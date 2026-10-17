// src/components/dom.js — helper el(): cria elementos com createElement/append (sem innerHTML).
// Textos entram como nós de texto, então dados do usuário nunca são interpretados como HTML.

// el("button", { class: "btn", onclick: fn, "aria-pressed": true }, "Texto", outroNo)
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null) continue;
    if (key.startsWith("aria-")) node.setAttribute(key, String(value)); // aceita true/false
    else if (value === false) continue;
    else if (key === "class") node.className = value;
    else if (key === "for") node.htmlFor = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key === "style" && typeof value === "object") Object.assign(node.style, value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node && typeof node[key] !== "object") node[key] = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  node.append(...limpar(children));
  return node;
}

// Troca todo o conteúdo do contêiner (ex.: #app) pelos nós informados.
export function mount(container, ...children) {
  container.replaceChildren(...limpar(children));
}

const limpar = (lista) => lista.flat(Infinity).filter((filho) => filho != null && filho !== false);
