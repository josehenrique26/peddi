import assert from "node:assert/strict";
import test from "node:test";

const armazenamento = new Map();
globalThis.localStorage = {
  getItem: (chave) => armazenamento.get(chave) ?? null,
  setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
  removeItem: (chave) => armazenamento.delete(chave),
};

const storage = await import("../src/services/storage.js");
const courierService = await import("../src/services/couriers.js");

function comBytesRandomizados(valores, executar) {
  const descritorOriginal = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  let chamada = 0;
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        bytes.fill(valores[chamada] ?? 0);
        chamada += 1;
        return bytes;
      },
    },
  });
  try {
    executar(() => chamada);
  } finally {
    if (descritorOriginal) Object.defineProperty(globalThis, "crypto", descritorOriginal);
    else delete globalThis.crypto;
  }
}

function iniciarComoAdmin(companyId = "co_forno") {
  armazenamento.clear();
  storage.carregarDados();
  storage.gravarSessao({ role: "admin", companyId, customerId: "cu_1", courierId: "ct_1" });
}

test("RF-EMP-10 cadastra entregador válido e rejeita dados obrigatórios inválidos", () => {
  iniciarComoAdmin();
  const courierCount = storage.obterDados().couriers.length;

  assert.equal(courierService.cadastrarEntregador("co_forno", { name: "", phone: "" }).ok, false);
  assert.equal(courierService.cadastrarEntregador("co_forno", { name: "Joana", phone: "123" }).ok, false);

  const resultado = courierService.cadastrarEntregador("co_forno", {
    name: " Joana Alves ", phone: "83912345678",
  });
  assert.equal(resultado.ok, true);
  const criado = storage.obterDados().couriers.find((courier) => courier.id === resultado.id);
  assert.equal(criado.name, "Joana Alves");
  assert.equal(criado.phone, "(83) 91234-5678");
  assert.equal(criado.companyId, "co_forno");
  assert.equal(criado.code.length, 8);
  assert.equal(storage.obterDados().couriers.length, courierCount + 1);
  assert.ok(storage.obterDados().couriers.some((courier) => courier.id === "ct_1"));
});

test("RF-EMP-10 rejeita duplicidade e restringe o cadastro à empresa da sessão", () => {
  iniciarComoAdmin();

  const criado = courierService.cadastrarEntregador("co_forno", {
    name: "Joana Alves", phone: "83912345678",
  });
  assert.equal(criado.ok, true);
  assert.equal(courierService.cadastrarEntregador("co_forno", {
    name: "Outra Joana", phone: "(83) 91234-5678",
  }).ok, false);
  assert.equal(courierService.cadastrarEntregador("co_burger", {
    name: "Pessoa em outra empresa", phone: "83922223333",
  }).ok, false);
  assert.equal(courierService.listarEntregadoresEmpresa("co_forno").entregadores.length, 4);
  assert.equal(courierService.listarEntregadoresEmpresa("co_burger").ok, false);
});

test("RF-EMP-10 persiste os cadastros e mantém viagens e entregas existentes", () => {
  iniciarComoAdmin();
  const resultado = courierService.cadastrarEntregador("co_forno", {
    name: "Joana Alves", phone: "83912345678",
  });

  storage.carregarDados();
  assert.equal(courierService.listarEntregadoresEmpresa("co_forno").entregadores.some((courier) =>
    courier.id === resultado.id), true);
  assert.ok(storage.obterDados().trips.some((trip) => trip.id === "VG-501"));
  assert.ok(storage.obterDados().deliveries.length > 0);
});

test("RF-EMP-10 inativa sem apagar e impede inativação durante viagem ativa", () => {
  iniciarComoAdmin();
  assert.equal(courierService.definirEntregadorAtivo("co_forno", "ct_1", false).ok, false);
  assert.equal(courierService.definirEntregadorAtivo("co_forno", "ct_2", false).ok, true);
  assert.equal(courierService.definirEntregadorAtivo("co_forno", "ct_2", true).ok, true);
  assert.ok(storage.obterDados().couriers.some((courier) => courier.id === "ct_2"));
  assert.ok(storage.obterDados().trips.some((trip) => trip.courierId === "ct_1"));
});

test("códigos antigos de entregador são normalizados sem perda do histórico", () => {
  iniciarComoAdmin();
  const legado = structuredClone(storage.obterDados());
  const viagensAntes = JSON.stringify(legado.trips);
  legado.couriers.forEach((courier) => {
    courier.code = courier.code.replace(/^E-0(\d{5})$/, "E-$1");
  });
  armazenamento.set("peddi.v1.data", JSON.stringify(legado));

  const carregados = storage.carregarDados();

  assert.ok(carregados.couriers.every((courier) => courier.code.length === 8));
  assert.equal(JSON.stringify(carregados.trips), viagensAntes);
  assert.ok(JSON.parse(armazenamento.get("peddi.v1.data")).couriers.every((courier) => courier.code.length === 8));
});

test("RF-EMP-11 gera código de conexão exclusivo e o persiste na empresa autorizada", () => {
  iniciarComoAdmin();
  const dados = storage.obterDados();
  dados.companies.find((company) => company.id === "co_forno").code = "00000000";
  dados.companies.find((company) => company.id === "co_burger").connectionCode = "11111111";
  let numeroDeChamadas;

  comBytesRandomizados([0, 1, 2], (chamadas) => {
    const resultado = courierService.gerarCodigoConexao("co_forno");
    assert.equal(resultado.ok, true, resultado.erro);
    assert.match(resultado.codigo, /^[A-Z0-9]{8}$/);
    assert.equal(resultado.codigo, "22222222");
    assert.equal(dados.companies.find((company) => company.id === "co_forno").connectionCode, resultado.codigo);
    assert.equal(dados.companies.find((company) => company.id === "co_burger").connectionCode, "11111111");
    numeroDeChamadas = chamadas();
  });
  assert.equal(numeroDeChamadas, 3);
  assert.equal(dados.companies.find((company) => company.id === "co_forno").code, "00000000");

  storage.carregarDados();
  assert.equal(storage.obterDados().companies.find((company) => company.id === "co_forno").connectionCode, "22222222");
});

test("RF-EMP-11 restringe geração à empresa da sessão e devolve novo código ao renovar", () => {
  iniciarComoAdmin("co_forno");
  comBytesRandomizados([2, 3], () => {
    const primeiro = courierService.gerarCodigoConexao("co_forno");
    assert.equal(primeiro.ok, true, primeiro.erro);

    const acessoNegado = courierService.gerarCodigoConexao("co_burger");
    assert.equal(acessoNegado.ok, false);

    const renovado = courierService.gerarCodigoConexao("co_forno");
    assert.equal(renovado.ok, true, renovado.erro);
    assert.notEqual(renovado.codigo, primeiro.codigo);
    assert.equal(storage.obterDados().companies.find((company) => company.id === "co_forno").connectionCode, renovado.codigo);
    assert.notEqual(storage.obterDados().companies.find((company) => company.id === "co_forno").connectionCode, primeiro.codigo);
  });
});

test("RF-EMP-11 informa falha de armazenamento e preserva código anterior", () => {
  iniciarComoAdmin();
  const empresa = storage.obterDados().companies.find((company) => company.id === "co_forno");
  empresa.connectionCode = "ABCDEFGH";
  storage.salvarDados();
  const setItemOriginal = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = (chave, valor) => {
    if (chave === "peddi.v1.data") throw new Error("quota exceeded");
    setItemOriginal(chave, valor);
  };

  try {
    comBytesRandomizados([3], () => {
      const resultado = courierService.gerarCodigoConexao("co_forno");
      assert.equal(resultado.ok, false);
      assert.equal(empresa.connectionCode, "ABCDEFGH");
    });
  } finally {
    globalThis.localStorage.setItem = setItemOriginal;
  }
});

test("RF-EMP-11 informa falha se a fonte segura de aleatoriedade não existir", () => {
  iniciarComoAdmin();
  const descritorOriginal = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: undefined });
  try {
    const resultado = courierService.gerarCodigoConexao("co_forno");
    assert.equal(resultado.ok, false);
    assert.match(resultado.erro, /geração aleatória segura/);
    assert.equal(storage.obterDados().companies.find((company) => company.id === "co_forno").connectionCode, undefined);
  } finally {
    if (descritorOriginal) Object.defineProperty(globalThis, "crypto", descritorOriginal);
    else delete globalThis.crypto;
  }
});

test("RF-EMP-11 para após 20 colisões sem substituir o código vigente", () => {
  iniciarComoAdmin();
  const empresa = storage.obterDados().companies.find((company) => company.id === "co_forno");
  storage.obterDados().companies.find((company) => company.id === "co_burger").connectionCode = "11111111";
  empresa.connectionCode = "ABCDEFGH";
  const descritorOriginal = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  let chamadas = 0;
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues(bytes) {
        bytes.fill(1);
        chamadas += 1;
        return bytes;
      },
    },
  });
  try {
    const resultado = courierService.gerarCodigoConexao("co_forno");
    assert.equal(resultado.ok, false);
    assert.match(resultado.erro, /código exclusivo/);
    assert.equal(chamadas, 20);
    assert.equal(empresa.connectionCode, "ABCDEFGH");
  } finally {
    if (descritorOriginal) Object.defineProperty(globalThis, "crypto", descritorOriginal);
    else delete globalThis.crypto;
  }
});
