// src/utils/guard.js — protege as telas do perfil empresa. Sem perfil "admin", volta à tela inicial.
import { lerSessao } from "../services/storage.js";
import { rotas, navegar } from "./routes.js";

export function exigirEmpresa() {
  const sessao = lerSessao();
  if (sessao.role !== "admin") { navegar(rotas.inicio()); return null; }
  return sessao;
}
    