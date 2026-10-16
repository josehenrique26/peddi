import { iniciarDados, listarCategorias, listarProdutos } from "../services/storage.js";

const formatarPreco = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function renderAdminMenu(root) {
  iniciarDados();

  const pagina = document.createElement("main");
  pagina.className = "pagina-gestao-produtos";

  const cabecalho = document.createElement("header");
  cabecalho.className = "cabecalho-listagem";

  const titulo = document.createElement("h1");
  titulo.textContent = "Produtos cadastrados";
  cabecalho.append(titulo);

  const tabela = document.createElement("table");
  tabela.className = "tabela-produtos";

  const cabecalhoTabela = document.createElement("thead");
  const linhaCabecalho = document.createElement("tr");
  ["Imagem", "Nome", "Descrição", "Categoria", "Preço"].forEach((texto) => {
    const celula = document.createElement("th");
    celula.scope = "col";
    celula.textContent = texto;
    linhaCabecalho.append(celula);
  });
  cabecalhoTabela.append(linhaCabecalho);

  const corpoTabela = document.createElement("tbody");
  const categorias = listarCategorias();
  const produtos = listarProdutos();

  if (produtos.length === 0) {
    const linhaVazia = document.createElement("tr");
    const celulaVazia = document.createElement("td");
    celulaVazia.colSpan = 5;
    celulaVazia.className = "estado-vazio";
    celulaVazia.textContent = "Nenhum produto cadastrado.";
    linhaVazia.append(celulaVazia);
    corpoTabela.append(linhaVazia);
  }

  for (const produto of produtos) {
    const linha = document.createElement("tr");
    const celulaImagem = document.createElement("td");

    if (produto.imagemUrl) {
      const imagem = document.createElement("img");
      imagem.className = "imagem-tabela-produto";
      imagem.src = produto.imagemUrl;
      imagem.alt = produto.nome;
      imagem.loading = "lazy";
      celulaImagem.append(imagem);
    } else {
      celulaImagem.textContent = "Sem imagem";
    }

    const celulaNome = document.createElement("td");
    celulaNome.textContent = produto.nome;

    const celulaDescricao = document.createElement("td");
    celulaDescricao.textContent = produto.descricao || "Sem descrição.";

    const celulaCategoria = document.createElement("td");
    celulaCategoria.textContent = categorias.find(
      (categoria) => categoria.id === produto.categoriaId,
    )?.nome ?? "Sem categoria";

    const celulaPreco = document.createElement("td");
    celulaPreco.textContent = formatarPreco.format(produto.preco);

    linha.append(celulaImagem, celulaNome, celulaDescricao, celulaCategoria, celulaPreco);
    corpoTabela.append(linha);
  }

  tabela.append(cabecalhoTabela, corpoTabela);

  const areaTabela = document.createElement("div");
  areaTabela.className = "area-tabela-produtos";
  areaTabela.append(tabela);
  pagina.append(cabecalho, areaTabela);
  root.replaceChildren(pagina);
}
