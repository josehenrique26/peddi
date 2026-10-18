// src/utils/cardapio.js — busca, filtro e agrupamento do cardápio (funções puras).
export const categoriasDe = (produtos) => [...new Set(produtos.map((p) => p.category))];

// categoria: "todos" ou o nome de uma categoria. busca: texto livre (nome ou descrição).
export function filtrarProdutos(produtos, { categoria = "todos", busca = "" } = {}) {
  const termo = busca.trim().toLowerCase();
  return produtos.filter((p) => {
    const naCategoria = categoria === "todos" || p.category === categoria;
    const naBusca = !termo || p.name.toLowerCase().includes(termo) || p.description.toLowerCase().includes(termo);
    return naCategoria && naBusca;
  });
}

// { Pizzas: [...], Bebidas: [...] } — a ordem das categorias segue a ordem dos produtos.
export const agruparPorCategoria = (produtos) =>
  produtos.reduce((grupos, produto) => {
    (grupos[produto.category] ||= []).push(produto);
    return grupos;
  }, {});
