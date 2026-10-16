// Cardápio do cliente: mostra produtos disponíveis agrupados por categoria.
import { iniciarDados, listarCategorias, listarProdutos } from "../services/storage.js";
import { createProductCard } from "../components/product-card.js";

export function renderMenu(root) {
  iniciarDados();

  const pagina = document.createElement("main");
  pagina.className = "pagina-cardapio";

  const cabecalho = document.createElement("header");
  cabecalho.className = "cabecalho-listagem";

  const titulo = document.createElement("h1");
  titulo.textContent = "Cardápio";
  cabecalho.append(titulo);
  pagina.append(cabecalho);

  const categorias = listarCategorias();
  const produtos = listarProdutos({ apenasDisponiveis: true });

  if (produtos.length === 0) {
    const aviso = document.createElement("p");
    aviso.className = "estado-vazio";
    aviso.textContent = "Ainda não há produtos disponíveis no cardápio.";
    pagina.append(aviso);
  } else {
    for (const categoria of categorias) {
      const produtosDaCategoria = produtos.filter(
        (produto) => produto.categoriaId === categoria.id,
      );
      if (produtosDaCategoria.length === 0) continue;

      const grupo = document.createElement("section");
      grupo.className = "grupo-cardapio";

      const tituloCategoria = document.createElement("h2");
      tituloCategoria.textContent = categoria.nome;

      const grade = document.createElement("div");
      grade.className = "grade-produtos";
      produtosDaCategoria.forEach((produto) => grade.append(createProductCard(produto)));

      grupo.append(tituloCategoria, grade);
      pagina.append(grupo);
    }
  }

  root.replaceChildren(pagina);
}
