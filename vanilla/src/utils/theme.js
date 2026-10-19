// src/utils/theme.js — tema claro/escuro, guardado no LocalStorage.
const CHAVE = "peddi.theme";

export function obterTemaAtual() {
  return (
    document.documentElement.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

export function aplicarTemaSalvo() {
  try {
    const tema = localStorage.getItem(CHAVE);
    if (tema) document.documentElement.dataset.theme = tema;
  } catch {
    /* sem armazenamento: segue o tema do sistema */
  }
}

export function alternarTema() {
  const atual = obterTemaAtual();
  const novo = atual === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = novo;
  try {
    localStorage.setItem(CHAVE, novo);
  } catch {
    /* ignora */
  }
}
