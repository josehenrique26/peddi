import assert from "node:assert/strict";
import test from "node:test";

const armazenamento = new Map();
globalThis.localStorage = {
  getItem: (chave) => armazenamento.get(chave) ?? null,
  setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
  removeItem: (chave) => armazenamento.delete(chave),
};

const storage = await import("../src/services/storage.js");
const produtos = await import("../src/services/produtos.js");
const menu = await import("../src/services/menu.js");
const cart = await import("../src/services/cart.js");
const pedidos = await import("../src/services/client-orders.js");

test("produtos persistem no catálogo central, respeitam empresa e preservam snapshots", () => {
  storage.carregarDados();
  storage.gravarSessao({ role: "admin", companyId: "co_forno", customerId: "cu_1", courierId: "ct_1" });
  armazenamento.set("produtos", JSON.stringify([{ nome: "registro legado" }]));

  assert.equal(produtos.salvarProduto("co_forno", { name: " ", category: "Pizzas", price: 1200 }).ok, false);
  assert.equal(produtos.salvarProduto("co_forno", { name: "Pizza", category: "Pizzas", price: 0 }).ok, false);
  assert.equal(produtos.salvarProduto("co_forno", { name: "Pizza", category: "", price: 1200 }).ok, false);
  assert.equal(produtos.salvarProduto("co_forno", { name: "Pizza", category: "Pizzas", price: 1200, img: { src: "data:image/svg+xml;base64,PHN2Zz4=" } }).ok, false);
  assert.equal(produtos.salvarProduto("co_forno", { name: "Pizza", category: "Pizzas", price: 1200, img: { src: `data:image/png;base64,${"A".repeat(2_100_000)}` } }).ok, false);

  const criado = produtos.salvarProduto("co_forno", {
    name: "Pizza de teste", category: "Pizzas", price: 1290, description: "Descrição inicial", img: { emoji: "🍕" },
  });
  assert.equal(criado.ok, true);
  const produtoId = criado.id;
  assert.equal(armazenamento.has("produtos"), true);

  storage.carregarDados();
  assert.equal(menu.obterProduto(produtoId).companyId, "co_forno");
  assert.equal(menu.produtosDaEmpresa("co_burger").some((produto) => produto.id === produtoId), false);
  assert.equal(produtos.definirDisponibilidadeProduto("co_burger", produtoId, false).ok, false);

  assert.equal(produtos.salvarProduto("co_forno", {
    name: "Pizza editada", category: "Pizzas", price: 1550, description: "Nova descrição",
  }, produtoId).ok, true);
  assert.equal(produtos.listarProdutosEmpresa("co_forno").produtos.filter((produto) => produto.id === produtoId).length, 1);
  assert.equal(menu.obterProduto(produtoId).img.emoji, "🍕");

  assert.equal(produtos.definirDisponibilidadeProduto("co_forno", produtoId, false).ok, true);
  assert.match(cart.adicionarAoCarrinho(produtoId).erro, /indisponível/);
  assert.equal(produtos.definirDisponibilidadeProduto("co_forno", produtoId, true).ok, true);
  assert.equal(cart.adicionarAoCarrinho(produtoId).ok, true);

  const pedido = pedidos.criarPedido({
    empresaId: "co_forno", linhas: [{ productId: produtoId, qty: 1 }],
    contato: { name: "Ana", phone: "000" },
    endereco: { street: "Rua", district: "Centro", complement: "" }, pagamento: "pix",
  });
  assert.equal(pedido.ok, true);
  assert.equal(pedidos.itensDoPedido(pedido.id)[0].name, "Pizza editada");
  assert.equal(produtos.salvarProduto("co_forno", {
    name: "Pizza renomeada", category: "Pizzas", price: 1800, description: "",
  }, produtoId).ok, true);
  assert.equal(pedidos.itensDoPedido(pedido.id)[0].name, "Pizza editada");
  assert.equal(pedidos.itensDoPedido(pedido.id)[0].unitPrice, 1550);

  assert.equal(produtos.excluirProduto("co_forno", produtoId).ok, true);
  assert.equal(menu.obterProduto(produtoId), null);
  assert.equal(pedidos.itensDoPedido(pedido.id)[0].name, "Pizza editada");
  storage.gravarSessao({ role: "cliente", companyId: "co_forno", customerId: "cu_1" });
  assert.equal(produtos.salvarProduto("co_forno", { name: "Negado", category: "Pizzas", price: 900 }).ok, false);
});

test("falha de armazenamento não confirma nem mantém mutação em memória", () => {
  storage.carregarDados();
  storage.gravarSessao({ role: "admin", companyId: "co_forno", customerId: "cu_1" });
  const antes = produtos.listarProdutosEmpresa("co_forno").produtos.length;
  const setItemOriginal = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = (chave, valor) => {
    if (chave === "peddi.v1.data") throw new Error("quota exceeded");
    setItemOriginal(chave, valor);
  };
  try {
    const resultado = produtos.salvarProduto("co_forno", { name: "Não persistido", category: "Pizzas", price: 999 });
    assert.equal(resultado.ok, false);
    assert.equal(produtos.listarProdutosEmpresa("co_forno").produtos.length, antes);
  } finally {
    globalThis.localStorage.setItem = setItemOriginal;
  }
});