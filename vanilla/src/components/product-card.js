// Cartão do cardápio: imagem, nome, descrição e preço do produto.
const formatarPreco = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function createProductCard(produto) {
	const cartao = document.createElement("article");
	cartao.className = "cartao-produto-cliente";

	if (produto.imagemUrl) {
		const imagem = document.createElement("img");
		imagem.src = produto.imagemUrl;
		imagem.alt = produto.nome;
		imagem.loading = "lazy";
		cartao.append(imagem);
	} else {
		const avisoImagem = document.createElement("div");
		avisoImagem.className = "imagem-vazia-cliente";
		avisoImagem.textContent = "Sem imagem";
		avisoImagem.setAttribute("aria-hidden", "true");
		cartao.append(avisoImagem);
	}

	const nome = document.createElement("h3");
	nome.textContent = produto.nome;

	const descricao = document.createElement("p");
	descricao.textContent = produto.descricao || "Sem descrição.";

	const preco = document.createElement("strong");
	preco.textContent = formatarPreco.format(produto.preco);

	cartao.append(nome, descricao, preco);
	return cartao;
}
