// src/utils/routes.js — endereços das telas (uma .html por tela). Só aqui os nomes dos arquivos aparecem.
const base = import.meta.env.BASE_URL; // "/" no dev, "/peddi/" no build

export const rotas = {
  inicio: () => base,
  loja: (slug) => `${base}loja.html?empresa=${encodeURIComponent(slug)}`,
  pedidos: () => `${base}pedidos.html`,
  admin: () => `${base}admin.html`,
  adminPedidos: () => `${base}admin-pedidos.html`,
  adminCardapio: () => `${base}admin-cardapio.html`,
  adminEntregadores: () => `${base}admin-entregadores.html`,
  adminConfig: () => `${base}admin-config.html`,
  entregador: () => `${base}entregador.html`,
};

export const rotaDoPerfil = {
  admin: rotas.admin,
  cliente: rotas.pedidos,
  entregador: rotas.entregador,
};

export const navegar = (url) => location.assign(url);
