// src/services/companies.js — regras sobre empresas, clientes e entregadores da demonstração.
import { obterDados } from "./storage.js";

export const listarEmpresas = () => obterDados().companies;
export const listarClientes = () => obterDados().customers;
export const listarEntregadores = () => obterDados().couriers;
export const obterEmpresa = (id) => listarEmpresas().find((c) => c.id === id) ?? null;

// Resolve o que o cliente digitou (link ou código) em uma empresa ativa.
export function resolverEmpresa(entrada, modo) {
  const texto = String(entrada ?? "").trim();
  if (!texto) return { erro: "Informe o link ou o código da empresa." };

  const slug = texto.toLowerCase()
    .replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop();
  const porSlug = () => listarEmpresas().find((c) => c.slug === slug);
  const porCodigo = () => listarEmpresas().find((c) => c.code.toLowerCase() === texto.toLowerCase());
  const empresa = modo === "code" ? porCodigo() || porSlug() : porSlug() || porCodigo();

  if (!empresa) return { erro: "Não encontramos nenhuma empresa com esse link ou código. Confira com o estabelecimento e tente de novo." };
  if (!empresa.active) return { erro: `${empresa.name} está inativa no momento e não recebe pedidos pelo Peddi.` };
  return { empresa };
}
