const btnAdicionar = document.querySelector("#btn-adicionar")
const formAdd = document.querySelector("#form-add")
const imagem = document.querySelector("#img-produto")
const nomeProduto = document.querySelector("#nome-produto")
const descricao = document.querySelector("#descricao")
const preco = document.querySelector("#preco")
const btnEnviar = document.querySelector("#btn-enviar")
const cardapio = document.querySelector("#cardapio")

btnAdicionar.addEventListener("click", () => {
    formAdd.classList.add("aparecendo");
})

btnEnviar.addEventListener("click", (evento) => {
    evento.preventDefault();
    novoLi = document.createElement("li")
    console.log(nomeProduto)
    const imagemProduto = imagem.files[0];
    novoLi.innerHTML = `
    <img src="${URL.createObjectURL(imagemProduto)}" alt="">
            <h2>${nomeProduto.value}</h2>
            <h3>${descricao.value}</h3>
            <p>${preco.value}</p>
    `;
    cardapio.appendChild(novoLi);
})
