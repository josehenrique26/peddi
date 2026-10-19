// src/utils/guard.js — protege as telas do perfil empresa. Sem perfil "admin", volta à tela inicial.
import { lerSessao, gravarSessao, normalizarSessao } from "../services/storage.js";
import { rotas, navegar } from "./routes.js";

export function exigirEmpresa() {
  const sessao = lerSessao();
  if (sessao.role !== "admin") { navegar(rotas.inicio()); return null; }
  return sessao;
}

// Telas do entregador: sem perfil "entregador", volta à tela inicial. Garante um entregador válido na sessão.
export function exigirEntregador() {
  if (lerSessao().role !== "entregador") { navegar(rotas.inicio()); return null; }
  return normalizarSessao();
}

// As telas do cliente são abertas por link, sem bloqueio: só garante o perfil "cliente" e um cliente de demonstração.
export function entrarComoCliente() {
  const sessao = normalizarSessao();
  if (sessao.role === "cliente") return sessao;
  const nova = { ...sessao, role: "cliente" };
  gravarSessao(nova);
  return nova;
}
