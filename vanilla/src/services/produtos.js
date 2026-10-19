import { obterDados, salvarDados, lerSessao } from "./storage.js";
import { obterEmpresa } from "./companies.js";

const falha = (erro) => ({ ok: false, erro });
const MAX_IMAGEM_BYTES = 1_500_000;

function empresaAdministrada(empresaId) {
    const sessao = lerSessao();
    if (sessao.role !== "admin") return { erro: "Acesso restrito ao perfil do estabelecimento." };
    if (!empresaId || sessao.companyId !== empresaId) return { erro: "O estabelecimento da sessão não corresponde a esta operação." };
    if (!obterEmpresa(empresaId)) return { erro: "Estabelecimento não encontrado." };
    return {};
}

function validarCampos(campos) {
    const nome = String(campos.name ?? "").trim();
    const categoria = String(campos.category ?? "").trim();
    if (!nome) return "Informe o nome do produto.";
    if (nome.length > 100) return "O nome deve ter até 100 caracteres.";
    if (!categoria) return "Informe uma categoria.";
    if (categoria.length > 50) return "A categoria deve ter até 50 caracteres.";
    if (!Number.isInteger(campos.price) || campos.price <= 0) return "Informe um preço válido maior que zero.";
    if (String(campos.description ?? "").length > 240) return "A descrição deve ter até 240 caracteres.";
    const src = campos.img?.src;
    if (src) {
        const imagem = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+=*)$/.exec(src);
        if (!imagem || Math.floor(imagem[1].length * 3 / 4) > MAX_IMAGEM_BYTES) return "Use uma imagem PNG, JPEG ou WebP de até 1,5 MB.";
    }
    return "";
}

function gravarProdutos(dados, produtos, seq = dados.seq) {
    const produtosAnteriores = dados.products;
    const seqAnterior = dados.seq;
    dados.products = produtos;
    dados.seq = seq;
    if (salvarDados()) return { ok: true };
    dados.products = produtosAnteriores;
    dados.seq = seqAnterior;
    return falha("Não foi possível gravar no armazenamento deste navegador.");
}

export function listarProdutosEmpresa(empresaId) {
    const acesso = empresaAdministrada(empresaId);
    if (acesso.erro) return falha(acesso.erro);
    const produtos = obterDados().products;
    if (!Array.isArray(produtos)) return falha("A coleção de produtos está indisponível.");
    return { ok: true, produtos: produtos.filter((produto) => produto.companyId === empresaId) };
}

export function salvarProduto(empresaId, campos, produtoId = null) {
    const acesso = empresaAdministrada(empresaId);
    if (acesso.erro) return falha(acesso.erro);
    const erro = validarCampos(campos);
    if (erro) return falha(erro);

    const dados = obterDados();
    const produtos = Array.isArray(dados.products) ? [...dados.products] : [];
    if (produtoId) {
        const indice = produtos.findIndex((produto) => produto.id === produtoId && produto.companyId === empresaId);
        if (indice < 0) return falha("Produto não encontrado neste estabelecimento.");
        produtos[indice] = {
            ...produtos[indice], name: campos.name.trim(), description: String(campos.description ?? "").trim(),
            category: campos.category.trim(), price: campos.price,
            img: campos.img ?? produtos[indice].img ?? { emoji: "🍽️" },
        };
        return gravarProdutos(dados, produtos);
    }

    const seq = { ...dados.seq };
    let id;
    do { id = `p${seq.product++}`; } while (produtos.some((produto) => produto.id === id));
    produtos.push({
        id, companyId: empresaId, name: campos.name.trim(), description: String(campos.description ?? "").trim(),
        category: campos.category.trim(), price: campos.price, img: campos.img ?? { emoji: "🍽️" }, available: true,
    });
    return { ...gravarProdutos(dados, produtos, seq), id };
}

export function definirDisponibilidadeProduto(empresaId, produtoId, available) {
    const acesso = empresaAdministrada(empresaId);
    if (acesso.erro) return falha(acesso.erro);
    const dados = obterDados();
    const produtos = Array.isArray(dados.products) ? [...dados.products] : [];
    const indice = produtos.findIndex((produto) => produto.id === produtoId && produto.companyId === empresaId);
    if (indice < 0) return falha("Produto não encontrado neste estabelecimento.");
    produtos[indice] = { ...produtos[indice], available: Boolean(available) };
    return gravarProdutos(dados, produtos);
}

export function excluirProduto(empresaId, produtoId) {
    const acesso = empresaAdministrada(empresaId);
    if (acesso.erro) return falha(acesso.erro);
    const dados = obterDados();
    const produtos = Array.isArray(dados.products) ? dados.products : [];
    if (!produtos.some((produto) => produto.id === produtoId && produto.companyId === empresaId)) return falha("Produto não encontrado neste estabelecimento.");
    return gravarProdutos(dados, produtos.filter((produto) => produto.id !== produtoId));
}
