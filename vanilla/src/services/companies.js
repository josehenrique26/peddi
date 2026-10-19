// src/services/companies.js — regras sobre empresas, clientes e entregadores da demonstração.
import { obterDados, salvarDados } from "./storage.js";
import { lerPreco } from "../utils/format.js";
import { validarEmpresa, normalizarSlug, normalizarCodigo } from "../utils/validate.js";

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

// Erros de formato + identificador/código que OUTRA empresa já usa. Devolve { campo: "mensagem" }.
export function validarConfiguracoes(empresaId, dados) {
  const erros = validarEmpresa(dados);
  const outras = listarEmpresas().filter((c) => c.id !== empresaId);
  if (!erros.slug && outras.some((c) => c.slug === normalizarSlug(dados.slug))) erros.slug = "Este identificador já está em uso por outra empresa.";
  if (!erros.code && outras.some((c) => c.code === normalizarCodigo(dados.code))) erros.code = "Este código já está em uso por outra empresa.";
  return erros;
}

// Grava as configurações da empresa. A taxa nova vale só para novos pedidos: os antigos guardam a taxa da época.
export function salvarConfiguracoes(empresaId, dados) {
  const empresa = obterEmpresa(empresaId);
  if (!empresa) return { ok: false, erros: { form: "Empresa não encontrada." } };

  const erros = validarConfiguracoes(empresaId, dados);
  if (Object.keys(erros).length) return { ok: false, erros };

  Object.assign(empresa, {
    name: dados.name.trim(),
    category: dados.category,
    address: dados.address.trim(),
    description: (dados.description ?? "").trim(),
    slug: normalizarSlug(dados.slug),
    code: normalizarCodigo(dados.code),
    fee: lerPreco(dados.fee),
    active: Boolean(dados.active),
    brandColor: dados.brandColor || empresa.brandColor,
    brandEmoji: dados.brandEmoji || empresa.brandEmoji,
  });
  salvarDados();
  return { ok: true };
}
