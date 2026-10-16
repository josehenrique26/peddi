// src/components/logo.js — marca do Peddi. As funções devolvem TEXTO HTML, para usar dentro de outros textos.
const base = import.meta.env.BASE_URL; // "/" no dev, "/peddi/" no build
const LOGO = `${base}img/logo.svg`;

export function marcaLogo(tamanho = 30) {
  return `<img src="${LOGO}" alt="" height="${tamanho}" aria-hidden="true" />`;
}

export function logoCompleto(tamanho = 30) {
  return `<span class="logo">${marcaLogo(tamanho)}<span>Peddi</span></span>`;
}

// Substitui cada <span data-logo> do HTML pelo logo.
export function montarLogos() {
  document.querySelectorAll("[data-logo]").forEach((marcador) => {
    marcador.outerHTML = logoCompleto();
  });
}
