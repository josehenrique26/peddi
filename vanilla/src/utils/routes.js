// src/utils/routes.js — endereços das telas. Todas as .html ficam na raiz, então links relativos funcionam no dev e no build.
export const rotas = {
  inicio: () => "index.html",
  loja: (slug) => `loja.html?empresa=${encodeURIComponent(slug)}`,
  admin: () => "admin.html",
  pedidos: () => "pedidos.html",
  carrinho: () => "carrinho.html",
  checkout: () => "checkout.html",
  pedido: (id, recemCriado = false) => `pedido.html?id=${encodeURIComponent(id)}${recemCriado ? "&novo=1" : ""}`,
  entregador: () => "entregador.html",
};

export const rotaDoPerfil = {
  admin: rotas.admin,
  cliente: rotas.pedidos,
  entregador: rotas.entregador,
};

export const navegar = (url) => location.assign(url);
