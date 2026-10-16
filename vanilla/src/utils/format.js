// src/utils/format.js — formatação de dinheiro, datas e plural (tudo em português do Brasil).
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dois = (n) => String(n).padStart(2, "0");

export const brl = (centavos) => moeda.format((centavos || 0) / 100);
export const hora = (ts) => { const d = new Date(ts); return `${dois(d.getHours())}:${dois(d.getMinutes())}`; };
export const dataCurta = (ts) => { const d = new Date(ts); return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`; };
export const plural = (n, singular, pluralTxt) => (n === 1 ? singular : pluralTxt);

// "agora", "há 12 min", "hoje, 14:05", "ontem, 21:40" ou "03/10, 19:30".
export function quando(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const d = new Date(ts), hoje = new Date(), ontem = new Date(Date.now() - 864e5);
  if (d.toDateString() === hoje.toDateString()) return `hoje, ${hora(ts)}`;
  if (d.toDateString() === ontem.toDateString()) return `ontem, ${hora(ts)}`;
  return `${dataCurta(ts)}, ${hora(ts)}`;
}

export function inicioDoDia(ts = Date.now()) {
  const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime();
}

// Troca < > & " ' por códigos seguros. Use em todo texto digitado pelo usuário que for entrar num innerHTML.
export function escapar(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
