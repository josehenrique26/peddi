const btnAdicionar = document.querySelector("#btn-adicionar");
const formAdd = document.querySelector("#form-add");

const imagem = document.querySelector("#img-produto");
const nomeProduto = document.querySelector("#nome-produto");
const descricao = document.querySelector("#descricao");
const preco = document.querySelector("#preco");

const btnEnviar = document.querySelector("#btn-enviar");
const cardapio = document.querySelector("#cardapio");

let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let produtoEditando = null;

function salvarProdutos() {
    localStorage.setItem("produtos", JSON.stringify(produtos));
}

function converterImagem(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => reject(leitor.error);

        leitor.readAsDataURL(arquivo);
    });
}

btnAdicionar.addEventListener("click", () => {
    formAdd.reset();
    imagem.required = true;
    produtoEditando = null;
    btnEnviar.textContent = "Cadastrar produto";

    formAdd.classList.add("ativo");
});

function mostrarProdutos() {
    cardapio.innerHTML = "";

    produtos.forEach((produto) => {
        const novoLi = document.createElement("li");

        novoLi.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h2>${produto.nome}</h2>
            <h3>${produto.descricao}</h3>
            <p>R$ ${Number(produto.preco).toFixed(2)}</p>
            <button type="button" class="btn-editar">✏️ Editar</button>
        `;

        cardapio.appendChild(novoLi);

        const btnEditar = novoLi.querySelector(".btn-editar");

        btnEditar.addEventListener("click", () => {
            editarProduto(produto);
        });
    });
}

function editarProduto(produto) {
    produtoEditando = produto;

    imagem.required = false;
    nomeProduto.value = produto.nome;
    descricao.value = produto.descricao;
    preco.value = Number(produto.preco).toFixed(2);

    formAdd.classList.add("ativo");
    btnEnviar.textContent = "Salvar alterações";
}

formAdd.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = nomeProduto.value.trim();
    const textoDescricao = descricao.value.trim();
    const valorPreco = Number(preco.value);
    const arquivoImagem = imagem.files[0];

    if (
        nome === "" ||
        preco.value.trim() === "" ||
        !Number.isFinite(valorPreco) ||
        valorPreco <= 0
    ) {
        alert("Preencha o nome e um preço válido.");
        return;
    }

    if (produtoEditando === null && !arquivoImagem) {
        alert("Selecione uma imagem.");
        return;
    }

    btnEnviar.disabled = true;

    try {
        let imagemProduto = produtoEditando?.imagem || "";

        if (arquivoImagem) {
            imagemProduto = await converterImagem(arquivoImagem);
        }

        if (produtoEditando !== null) {
            produtoEditando.nome = nome;
            produtoEditando.descricao = textoDescricao;
            produtoEditando.preco = valorPreco;
            produtoEditando.imagem = imagemProduto;
        } else {
            const novoProduto = {
                imagem: imagemProduto,
                nome: nome,
                descricao: textoDescricao,
                preco: valorPreco
            };

            produtos.push(novoProduto);
        }

        salvarProdutos();

        mostrarProdutos();

        formAdd.reset();
        imagem.required = true;
        formAdd.classList.remove("ativo");

        produtoEditando = null;
        btnEnviar.textContent = "Cadastrar produto";
    } catch (erro) {
        alert("Não foi possível salvar. A imagem pode ser muito grande.");
        console.error(erro);
    } finally {
        btnEnviar.disabled = false;
    }
});

mostrarProdutos();
