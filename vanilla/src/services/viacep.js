// src/services/viacep.js — consulta de CEP na API pública ViaCEP (https://viacep.com.br).
import { apenasDigitos } from "../utils/validate.js";

// Retorna { rua, bairro, cidade, uf } ou { erro }.
export async function buscarCep(cep) {
  const digitos = apenasDigitos(cep);
  if (digitos.length !== 8) return { erro: "O CEP deve ter 8 números." };

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (!resposta.ok) throw new Error("falha na consulta");
    const dados = await resposta.json();
    if (dados.erro) return { erro: "CEP não encontrado. Preencha o endereço manualmente." };
    return { rua: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, uf: dados.uf };
  } catch {
    return { erro: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." };
  }
}
