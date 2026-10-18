// src/services/menu.js — leitura do cardápio (empresas e produtos) para a tela do cliente.
import { obterDados } from "./storage.js";

export const empresaPorSlug = (slug) => obterDados().companies.find((c) => c.slug === slug) ?? null;
export const produtosDaEmpresa = (empresaId) => obterDados().products.filter((p) => p.companyId === empresaId);
export const obterProduto = (id) => obterDados().products.find((p) => p.id === id) ?? null;
