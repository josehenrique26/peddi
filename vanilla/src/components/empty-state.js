// src/components/empty-state.js — bloco "nada por aqui". Devolve um elemento.
import { icone } from "./icon.js";

export function estadoVazio({ icone: nomeIcone = "receipt", titulo, texto }) {
  const caixa = document.createElement("div");
  caixa.className = "empty";

  const circulo = document.createElement("span");
  circulo.className = "ico-wrap";
  circulo.append(icone(nomeIcone, 24));

  const h3 = document.createElement("h3");
  h3.textContent = titulo;
  caixa.append(circulo, h3);

  if (texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    caixa.append(p);
  }
  return caixa;
}

