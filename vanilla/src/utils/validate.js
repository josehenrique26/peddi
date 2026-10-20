// src/utils/validate.js — máscaras e validação do checkout e das configurações da empresa (funções puras).
import { lerPreco } from "./format.js";

export const apenasDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

// "58000000" -> "58000-000"
export function formatarCep(texto) {
  const d = apenasDigitos(texto).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

// "83900000101" -> "(83) 90000-0101"
export function formatarTelefone(texto) {
  const d = apenasDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = d.slice(0, 2), resto = d.slice(2);
  const corte = d.length > 10 ? 5 : 4; // celular (9 dígitos) ou fixo (8 dígitos)
  return resto.length <= corte ? `(${ddd}) ${resto}` : `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

const TELEFONE = /^\d{2}9?\d{8}$/; // DDD + 8 ou 9 dígitos
const CEP = /^\d{8}$/;

// Devolve { campo: "mensagem" }. Objeto vazio = tudo certo.
export function validarCheckout({ name, phone, cep, street, district }) {
  const erros = {};
  if (String(name).trim().length < 2) erros.name = "Informe seu nome.";
  if (!TELEFONE.test(apenasDigitos(phone))) erros.phone = "Informe um telefone com DDD. Ex.: (83) 90000-0000.";
  if (cep && !CEP.test(apenasDigitos(cep))) erros.cep = "O CEP deve ter 8 números.";
  if (String(street).trim().length < 5) erros.street = "Informe a rua e o número.";
  if (String(district).trim().length < 2) erros.district = "Informe o bairro.";
  return erros;
}

// [VALIDAÇÃO] Usa o mesmo formato de telefone já adotado no checkout para manter
// os contatos consistentes e permitir comparar cadastros sem depender da máscara.
export function validarEntregador({ name, phone }) {
  const erros = {};
  const nome = String(name ?? "").trim();
  if (nome.length < 2) erros.name = "Informe o nome do entregador.";
  else if (nome.length > 100) erros.name = "O nome deve ter até 100 caracteres.";
  if (!TELEFONE.test(apenasDigitos(phone))) erros.phone = "Informe um telefone com DDD. Ex.: (83) 90000-0000.";
  return erros;
}

// ---- configurações da empresa
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/; // letras minúsculas, números e hífen: "forno-da-vila"
const CODIGO = /^[A-Z0-9]{4,10}$/;       // "VILA482"

export const normalizarSlug = (texto) => String(texto ?? "").trim().toLowerCase();
export const normalizarCodigo = (texto) => String(texto ?? "").trim().toUpperCase();

// Devolve { campo: "mensagem" }. Objeto vazio = tudo certo. (Slug e código repetidos são checados em services/companies.js.)
export function validarEmpresa({ name, address, slug, code, fee }) {
  const erros = {};
  if (String(name).trim().length < 2) erros.name = "Informe o nome do estabelecimento.";
  if (String(address).trim().length < 5) erros.address = "Informe o endereço.";
  if (!SLUG.test(normalizarSlug(slug)) || normalizarSlug(slug).length < 3) erros.slug = "Use ao menos 3 caracteres: letras minúsculas, números e hífen.";
  if (!CODIGO.test(normalizarCodigo(code))) erros.code = "Use de 4 a 10 letras ou números, sem espaços.";
  if (Number.isNaN(lerPreco(fee))) erros.fee = "Informe um valor válido, como 6,00 (use 0 para entrega grátis).";
  return erros;
}
