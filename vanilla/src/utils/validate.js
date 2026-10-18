// src/utils/validate.js — máscaras e validação do checkout (funções puras).
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
