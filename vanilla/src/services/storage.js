// src/services/storage.js — única porta de acesso ao LocalStorage. As páginas nunca o usam direto.
import { criarDadosIniciais, DATA_VERSION } from "../data/seed.js";

const CHAVE_DADOS = "peddi.v1.data";
const CHAVE_SESSAO = "peddi.v1.session";

export let armazenamentoOk = true;

function ler(chave) {
  try { return localStorage.getItem(chave); }
  catch { armazenamentoOk = false; return null; }
}
function gravar(chave, valor) {
  try { localStorage.setItem(chave, valor); return true; }
  catch { armazenamentoOk = false; return false; }
}
function remover(chave) {
  try { localStorage.removeItem(chave); }
  catch { armazenamentoOk = false; }
}

let dados = null;

// Carrega os dados; se não existirem, forem de uma versão antiga ou estiverem corrompidos, cria os iniciais.
export function carregarDados() {
  const bruto = ler(CHAVE_DADOS);
  if (bruto) {
    try {
      const lido = JSON.parse(bruto);
      if (lido?.version === DATA_VERSION && Array.isArray(lido.companies)) return (dados = lido);
    } catch { /* corrompido: guarda cópia e recria */ }
    gravar(CHAVE_DADOS + ".backup", bruto);
  }
  dados = criarDadosIniciais();
  salvarDados();
  return dados;
}

export const obterDados = () => dados ?? carregarDados();
export const salvarDados = () => gravar(CHAVE_DADOS, JSON.stringify(dados));

export function reiniciarDados() {
  remover(CHAVE_DADOS);
  remover(CHAVE_SESSAO);
  dados = null;
  return carregarDados();
}

// Avisa a página quando OUTRA aba altera os dados (evento "storage"), para ela se atualizar.
export function escutarMudancas(aoMudar) {
  window.addEventListener("storage", (e) => {
    if (e.key !== CHAVE_DADOS || !e.newValue) return;
    try { dados = JSON.parse(e.newValue); aoMudar(); } catch { /* ignora */ }
  });
}

// ---- sessão de demonstração (perfil atual e entidades escolhidas)
const SESSAO_PADRAO = { role: null, companyId: null, customerId: null, courierId: null, lastShop: null };

export function lerSessao() {
  try { return { ...SESSAO_PADRAO, ...JSON.parse(ler(CHAVE_SESSAO) ?? "{}") }; }
  catch { return { ...SESSAO_PADRAO }; }
}
export const gravarSessao = (sessao) => gravar(CHAVE_SESSAO, JSON.stringify(sessao));

// Garante que empresa, cliente e entregador da sessão existam (usa o primeiro da lista se faltar).
export function normalizarSessao() {
  const d = obterDados(), s = lerSessao();
  if (!d.companies.some((c) => c.id === s.companyId)) s.companyId = d.companies[0].id;
  if (!d.customers.some((c) => c.id === s.customerId)) s.customerId = d.customers[0].id;
  if (!d.couriers.some((c) => c.id === s.courierId)) s.courierId = (d.couriers.find((c) => c.active) ?? d.couriers[0]).id;
  gravarSessao(s);
  return s;
}
