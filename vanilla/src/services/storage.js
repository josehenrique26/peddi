// src/services/storage.js
// Camada de dados do Peddi (Projeto 1.1) usando LocalStorage.
// As páginas NUNCA chamam localStorage direto: só importam funções daqui.
// Na 1.2 este arquivo é substituído por chamadas ao Supabase, mantendo os nomes.

// ---------------------------------------------------------------- constantes
const KEYS = {
  settings: "peddi:settings",
  categories: "peddi:categories",
  products: "peddi:products",
  orders: "peddi:orders",
  trips: "peddi:trips",
};

export const STATUS = {
  RECEBIDO: "Recebido",
  PREPARO: "Em preparo",
  PRONTO: "Pronto",
  SAIU: "Saiu para entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

// Transições que a EMPRESA pode fazer (as demais são do fluxo do entregador).
const TRANSICOES_EMPRESA = {
  [STATUS.RECEBIDO]: [STATUS.PREPARO, STATUS.CANCELADO],
  [STATUS.PREPARO]: [STATUS.PRONTO, STATUS.CANCELADO],
  [STATUS.PRONTO]: [STATUS.CANCELADO],
};

const MAX_PEDIDOS_POR_VIAGEM = 3;
const MAX_TENTATIVAS_CODIGO = 3;

// ------------------------------------------------------------------ helpers
function ler(chave, padrao) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    return padrao; // JSON corrompido: volta ao padrão em vez de quebrar a tela
  }
}

function gravar(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function novoId() {
  return crypto.randomUUID();
}

function codigoDe4Digitos() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

// --------------------------------------------------------------------- seed
// Chame uma vez no main.js. Só popula se ainda não existir nada.
export function iniciarDados() {
  if (!localStorage.getItem(KEYS.settings)) {
    gravar(KEYS.settings, {
      nome: "Peddi Demo",
      segmento: "Restaurante",
      logo: "",
      corPrimaria: "#fe6e08",
      estiloCard: "padrao", // "padrao" | "compacto" | "foto-grande"
      taxaEntrega: 6,
    });
  }
  if (!localStorage.getItem(KEYS.categories)) {
    const cats = ["Pratos", "Bebidas", "Sobremesas"].map((nome) => ({
      id: novoId(),
      nome,
    }));
    gravar(KEYS.categories, cats);

    gravar(KEYS.products, [
      { nome: "Marmita Grande", descricao: "Arroz, feijão, bife e salada", preco: 25, cat: 0 },
      { nome: "Marmita Média", descricao: "Arroz, feijão e frango", preco: 20, cat: 0 },
      { nome: "Refrigerante Lata", descricao: "350 ml", preco: 6, cat: 1 },
      { nome: "Pudim", descricao: "Fatia individual", preco: 8, cat: 2 },
    ].map((p) => ({
      id: novoId(),
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      imagemUrl: "",
      categoriaId: cats[p.cat].id,
      disponivel: true,
    })));
  }
}

// ------------------------------------------------------- configurações (tema)
export function obterConfiguracoes() {
  return ler(KEYS.settings, {});
}

export function atualizarConfiguracoes(dados) {
  const novas = { ...obterConfiguracoes(), ...dados };
  gravar(KEYS.settings, novas);
  return novas;
}

// ---------------------------------------------------------------- categorias
export function listarCategorias() {
  return ler(KEYS.categories, []);
}

export function criarCategoria(nome) {
  const categoria = { id: novoId(), nome: nome.trim() };
  gravar(KEYS.categories, [...listarCategorias(), categoria]);
  return categoria;
}

export function atualizarCategoria(id, nome) {
  gravar(
    KEYS.categories,
    listarCategorias().map((c) => (c.id === id ? { ...c, nome: nome.trim() } : c)),
  );
}

export function removerCategoria(id) {
  if (listarProdutos().some((p) => p.categoriaId === id)) {
    throw new Error("Não é possível remover: existem produtos nesta categoria.");
  }
  gravar(KEYS.categories, listarCategorias().filter((c) => c.id !== id));
}

// ------------------------------------------------------------------ produtos
// filtros opcionais: { categoriaId, busca, apenasDisponiveis }
export function listarProdutos({ categoriaId, busca, apenasDisponiveis } = {}) {
  return ler(KEYS.products, [])
    .filter((p) => !categoriaId || p.categoriaId === categoriaId)
    .filter((p) => !apenasDisponiveis || p.disponivel)
    .filter((p) => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()));
}

export function obterProduto(id) {
  return listarProdutos().find((p) => p.id === id) ?? null;
}

export function criarProduto({ nome, descricao = "", preco, imagemUrl = "", categoriaId }) {
  if (!nome?.trim()) throw new Error("Informe o nome do produto.");
  if (!(Number(preco) >= 0)) throw new Error("Preço inválido.");
  const produto = {
    id: novoId(),
    nome: nome.trim(),
    descricao,
    preco: Number(preco),
    imagemUrl,
    categoriaId,
    disponivel: true,
  };
  gravar(KEYS.products, [...listarProdutos(), produto]);
  return produto;
}

export function atualizarProduto(id, dados) {
  gravar(
    KEYS.products,
    listarProdutos().map((p) => (p.id === id ? { ...p, ...dados } : p)),
  );
}

export function removerProduto(id) {
  gravar(KEYS.products, listarProdutos().filter((p) => p.id !== id));
}

// ------------------------------------------------------------------- pedidos
export function listarPedidos({ status, clienteId } = {}) {
  return ler(KEYS.orders, [])
    .filter((o) => !status || o.status === status)
    .filter((o) => !clienteId || o.clienteId === clienteId);
}

export function obterPedido(id) {
  return listarPedidos().find((o) => o.id === id) ?? null;
}

function salvarPedido(pedidoAtualizado) {
  gravar(
    KEYS.orders,
    listarPedidos().map((o) => (o.id === pedidoAtualizado.id ? pedidoAtualizado : o)),
  );
}

// itens: [{ produtoId, quantidade, observacao }]
// O preço é copiado para o pedido: mudar o cardápio depois não altera pedidos antigos.
export function criarPedido({ clienteId, clienteNome, endereco, bairro, formaPagamento, itens }) {
  if (!itens?.length) throw new Error("O carrinho está vazio.");

  const itensDoPedido = itens.map(({ produtoId, quantidade, observacao = "" }) => {
    const produto = obterProduto(produtoId);
    if (!produto || !produto.disponivel) throw new Error("Produto indisponível.");
    return {
      produtoId,
      nome: produto.nome,
      precoUnitario: produto.preco,
      quantidade,
      observacao,
    };
  });

  const subtotal = itensDoPedido.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);
  const taxaEntrega = obterConfiguracoes().taxaEntrega ?? 0;

  const pedido = {
    id: novoId(),
    numero: listarPedidos().length + 1001,
    clienteId,
    clienteNome,
    endereco,
    bairro,
    formaPagamento,
    itens: itensDoPedido,
    subtotal,
    taxaEntrega,
    total: subtotal + taxaEntrega,
    status: STATUS.RECEBIDO,
    viagemId: null,
    codigoEntrega: null, // só existe depois que a viagem inicia
    tentativas: 0,
    criadoEm: new Date().toISOString(),
  };

  gravar(KEYS.orders, [...listarPedidos(), pedido]);
  return pedido;
}

// Empresa: Recebido -> Em preparo -> Pronto (ou Cancelado).
export function alterarStatusPedido(pedidoId, novoStatus) {
  const pedido = obterPedido(pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");
  const permitidos = TRANSICOES_EMPRESA[pedido.status] ?? [];
  if (!permitidos.includes(novoStatus)) {
    throw new Error(`Não é possível ir de "${pedido.status}" para "${novoStatus}".`);
  }
  salvarPedido({ ...pedido, status: novoStatus });
}

// Cliente só pode cancelar antes de sair para entrega.
export function cancelarPedido(pedidoId) {
  const pedido = obterPedido(pedidoId);
  if (!pedido) throw new Error("Pedido não encontrado.");
  if ([STATUS.SAIU, STATUS.ENTREGUE, STATUS.CANCELADO].includes(pedido.status)) {
    throw new Error("Este pedido não pode mais ser cancelado.");
  }
  salvarPedido({ ...pedido, status: STATUS.CANCELADO });
}

// Visão do cliente: inclui o código de entrega (só ele o vê).
export function listarPedidosDoCliente(clienteId) {
  return listarPedidos({ clienteId });
}

// ------------------------------------------------------------- entregador
// Pedidos prontos, SEM endereço completo (só bairro, itens e valor).
export function listarPedidosDisponiveis() {
  return listarPedidos({ status: STATUS.PRONTO }).map(
    ({ id, numero, bairro, itens, total }) => ({ id, numero, bairro, itens, total }),
  );
}

function listarViagens() {
  return ler(KEYS.trips, []);
}

export function obterViagemAtiva(entregadorId) {
  return (
    listarViagens().find((v) => v.entregadorId === entregadorId && v.status === "em_andamento") ??
    null
  );
}

// Reserva até 3 pedidos e inicia a viagem de uma vez.
export function iniciarViagem(entregadorId, pedidoIds) {
  if (obterViagemAtiva(entregadorId)) {
    throw new Error("Finalize a viagem atual antes de iniciar outra.");
  }
  const ids = [...new Set(pedidoIds)];
  if (ids.length === 0) throw new Error("Selecione ao menos um pedido.");
  if (ids.length > MAX_PEDIDOS_POR_VIAGEM) {
    throw new Error(`Máximo de ${MAX_PEDIDOS_POR_VIAGEM} pedidos por viagem.`);
  }

  const pedidos = ids.map(obterPedido);
  if (pedidos.some((p) => !p || p.status !== STATUS.PRONTO || p.viagemId)) {
    throw new Error("Algum pedido não está mais disponível.");
  }

  const viagem = {
    id: novoId(),
    entregadorId,
    status: "em_andamento",
    iniciadaEm: new Date().toISOString(),
    finalizadaEm: null,
  };
  gravar(KEYS.trips, [...listarViagens(), viagem]);

  ids.forEach((id) => {
    salvarPedido({
      ...obterPedido(id),
      status: STATUS.SAIU,
      viagemId: viagem.id,
      codigoEntrega: codigoDe4Digitos(),
      tentativas: 0,
    });
  });
  return viagem;
}

// Pedidos da viagem COM endereço completo, mas SEM o código.
export function listarPedidosDaViagem(viagemId) {
  return listarPedidos()
    .filter((o) => o.viagemId === viagemId)
    .map(({ codigoEntrega, ...semCodigo }) => semCodigo);
}

// Valida o código informado pelo cliente.
export function confirmarEntrega(pedidoId, codigoDigitado) {
  const pedido = obterPedido(pedidoId);
  if (!pedido || pedido.status !== STATUS.SAIU) {
    throw new Error("Pedido não está em rota.");
  }
  if (pedido.tentativas >= MAX_TENTATIVAS_CODIGO) {
    throw new Error("Limite de tentativas atingido. Contate a empresa.");
  }

  if (String(codigoDigitado).trim() !== pedido.codigoEntrega) {
    const tentativas = pedido.tentativas + 1;
    salvarPedido({ ...pedido, tentativas });
    const restantes = MAX_TENTATIVAS_CODIGO - tentativas;
    throw new Error(`Código incorreto. Tentativas restantes: ${restantes}.`);
  }

  salvarPedido({ ...pedido, status: STATUS.ENTREGUE });
  finalizarViagemSeConcluida(pedido.viagemId);
  return true;
}

function finalizarViagemSeConcluida(viagemId) {
  const pendentes = listarPedidos().filter(
    (o) => o.viagemId === viagemId && o.status === STATUS.SAIU,
  );
  if (pendentes.length > 0) return;
  gravar(
    KEYS.trips,
    listarViagens().map((v) =>
      v.id === viagemId
        ? { ...v, status: "finalizada", finalizadaEm: new Date().toISOString() }
        : v,
    ),
  );
}

// ----------------------------------------------------------- painel (reduce)
export function resumoDaEmpresa() {
  const pedidos = listarPedidos();
  return {
    faturamento: pedidos
      .filter((o) => o.status === STATUS.ENTREGUE)
      .reduce((soma, o) => soma + o.total, 0),
    porStatus: pedidos.reduce((mapa, o) => {
      mapa[o.status] = (mapa[o.status] ?? 0) + 1;
      return mapa;
    }, {}),
  };
}