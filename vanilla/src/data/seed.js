// src/data/seed.js — dados iniciais de demonstração (criados na primeira execução).
// Valores em centavos. Mude DATA_VERSION quando o formato dos dados mudar: o storage.js recria os dados.
export const DATA_VERSION = 2;

export function criarDadosIniciais() {
  const agora = Date.now();
  const atras = (min) => agora - min * 60000;

  const companies = [
    { id: "co_forno", name: "Forno da Vila", category: "Pizzaria", address: "Rua das Oliveiras, 214 — Centro", slug: "forno-da-vila", code: "VILA482", fee: 600, active: true, brandColor: "#FF6A1A", brandEmoji: "🍕", description: "Pizzas de massa fermentada por 48 horas, assadas em forno a lenha." },
    { id: "co_burger", name: "Burger Quintal", category: "Hamburgueria", address: "Av. Beira Rio, 880 — Jardim Camélia", slug: "burger-quintal", code: "BURG731", fee: 500, active: true, brandColor: "#2E9E5B", brandEmoji: "🍔", description: "Hambúrgueres artesanais, batata rústica e milkshakes." },
    { id: "co_lia", name: "Marmitas da Dona Lia", category: "Marmitaria", address: "Rua do Comércio, 52 — Bairro Novo", slug: "marmitas-dona-lia", code: "LIA905", fee: 400, active: false, brandColor: "#C99700", brandEmoji: "🍛", description: "Comida caseira todos os dias." },
  ];

  const customers = [
    { id: "cu_1", name: "Ana Beatriz Lima", phone: "(83) 90000-0101", street: "Rua das Acácias, 120", district: "Jardim Camélia", complement: "Apto 302" },
    { id: "cu_2", name: "Marcos Vinícius Rocha", phone: "(83) 90000-0102", street: "Av. Central, 455", district: "Centro", complement: "" },
    { id: "cu_3", name: "Juliana Teixeira", phone: "(83) 90000-0103", street: "Rua do Sol, 78", district: "Bairro Novo", complement: "Casa 2" },
    { id: "cu_4", name: "Paulo Henrique Alves", phone: "(83) 90000-0104", street: "Rua das Palmeiras, 33", district: "Jardim Camélia", complement: "" },
    { id: "cu_5", name: "Larissa Gomes", phone: "(83) 90000-0105", street: "Travessa do Porto, 9", district: "Centro", complement: "Fundos" },
  ];

  const P = (id, co, name, description, category, price, emoji, available = true) =>
    ({ id, companyId: co, name, description, category, price, img: { emoji }, available });
  const products = [
    P("p1", "co_forno", "Pizza Margherita", "Molho de tomate artesanal, muçarela de búfala, manjericão fresco e azeite.", "Pizzas", 4200, "🍕"),
    P("p2", "co_forno", "Pizza Calabresa", "Calabresa artesanal fatiada, cebola roxa, azeitonas e orégano.", "Pizzas", 4600, "🍕"),
    P("p3", "co_forno", "Pizza Quatro Queijos", "Muçarela, provolone, gorgonzola e parmesão sobre molho branco.", "Pizzas", 5200, "🧀"),
    P("p4", "co_forno", "Pizza Portuguesa", "Presunto, ovo, cebola, pimentão, ervilha e azeitonas.", "Pizzas", 4900, "🍕"),
    P("p5", "co_forno", "Pizza de Camarão", "Camarão salteado no alho, catupiry e cebolinha.", "Pizzas", 6800, "🍤", false),
    P("p6", "co_forno", "Pizza Doce de Chocolate", "Chocolate ao leite derretido com morangos frescos.", "Sobremesas", 3800, "🍫"),
    P("p9", "co_forno", "Brownie com sorvete", "Brownie quente de chocolate meio amargo com bola de creme.", "Sobremesas", 1500, "🍰"),
    P("p7", "co_forno", "Guaraná 2 L", "Refrigerante gelado, garrafa de 2 litros.", "Bebidas", 1200, "🥤"),
    P("p8", "co_forno", "Suco de laranja 400 ml", "Laranja espremida na hora, sem açúcar.", "Bebidas", 900, "🧃"),
    P("b1", "co_burger", "Quintal Clássico", "Blend 160 g, queijo prato, alface, tomate e maionese da casa no pão brioche.", "Hambúrgueres", 2800, "🍔"),
    P("b2", "co_burger", "Duplo Cheddar", "Dois blends de 120 g, cheddar cremoso, cebola caramelizada e bacon.", "Hambúrgueres", 3600, "🍔"),
    P("b3", "co_burger", "Frango Crocante", "Sobrecoxa empanada, picles, alface e molho de mostarda e mel.", "Hambúrgueres", 3000, "🍗"),
    P("b4", "co_burger", "Veggie de Grão-de-Bico", "Hambúrguer de grão-de-bico, rúcula, tomate seco e maionese de ervas.", "Hambúrgueres", 2900, "🥗"),
    P("b5", "co_burger", "Batata Rústica", "Batatas com casca, alho e alecrim. Porção para duas pessoas.", "Acompanhamentos", 1600, "🍟"),
    P("b6", "co_burger", "Onion Rings", "Anéis de cebola empanados, com molho barbecue.", "Acompanhamentos", 1800, "🧅"),
    P("b7", "co_burger", "Limonada Suíça", "Limão, leite condensado e gelo. 500 ml.", "Bebidas", 1000, "🥤"),
    P("b8", "co_burger", "Milkshake de Chocolate", "Sorvete de creme, calda de chocolate e chantilly. 400 ml.", "Bebidas", 1900, "🥤", false),
    P("b9", "co_burger", "Cookie recheado", "Cookie macio com recheio de doce de leite.", "Sobremesas", 1100, "🍪"),
    P("l1", "co_lia", "Marmita do dia", "Arroz, feijão, proteína do dia e duas guarnições.", "Marmitas", 2200, "🍛"),
    P("l2", "co_lia", "Feijoada (sábado)", "Feijoada completa com farofa, couve e laranja.", "Marmitas", 3200, "🥘"),
  ];

  const C = (id, co, name, phone, active) =>
    ({ id, companyId: co, name, phone, code: "E-" + id.slice(3).padStart(5, "0") + "7", active });
  const couriers = [
    C("ct_1", "co_forno", "Rafael Mota", "(83) 98800-0011", true),
    C("ct_2", "co_forno", "Camila Duarte", "(83) 98800-0012", true),
    C("ct_3", "co_forno", "Tiago Leite", "(83) 98800-0013", false),
    C("ct_4", "co_burger", "Bruno Nery", "(83) 98800-0021", true),
    C("ct_5", "co_burger", "Elisa Prado", "(83) 98800-0022", true),
  ];

  const QUEM = { recebido: "Cliente", em_preparo: "Estabelecimento", pronto: "Estabelecimento", em_entrega: "Entregador", entregue: "Entregador", rejeitado: "Estabelecimento", cancelado: "Cliente" };
  const orders = [], orderItems = [], trips = [], deliveries = [];
  let seqItem = 1;

  // path = estados percorridos; criadoHa = minutos atrás; linhas = [[produtoId, quantidade], ...]
  const criarPedido = (num, coId, cuId, path, criadoHa, linhas, o = {}) => {
    const cliente = customers.find((c) => c.id === cuId), empresa = companies.find((c) => c.id === coId);
    const subtotal = linhas.reduce((t, [pid, q]) => t + products.find((p) => p.id === pid).price * q, 0);
    const fee = o.fee ?? empresa.fee;
    const n = path.length, fimHa = o.lastAgo ?? Math.max(1, criadoHa - 25 * (n - 1));
    const history = path.map((st, i) => ({
      state: st, by: QUEM[st], at: atras(n === 1 ? criadoHa : criadoHa - (criadoHa - fimHa) * i / (n - 1)),
      note: (i === n - 1 && o.reason) ? o.reason : "",
    }));
    const id = "PED-" + num;
    orders.push({
      id, companyId: coId, customerId: cuId, state: path[n - 1],
      address: { street: cliente.street, district: cliente.district, complement: cliente.complement },
      contact: { name: cliente.name, phone: cliente.phone }, payment: o.payment || "pix",
      subtotal, fee, total: subtotal + fee, code: o.code || String(1000 + (num * 7919) % 9000),
      createdAt: atras(criadoHa), history, reason: o.reason || "",
    });
    linhas.forEach(([pid, q]) => {
      const p = products.find((x) => x.id === pid);
      orderItems.push({ id: "it_" + seqItem++, orderId: id, productId: pid, name: p.name, qty: q, unitPrice: p.price });
    });
    return id;
  };

  const FIM = ["recebido", "em_preparo", "pronto", "em_entrega", "entregue"];
  // Forno da Vila
  criarPedido(1001, "co_forno", "cu_1", FIM, 3000, [["p1", 1], ["p7", 1]], { fee: 500, lastAgo: 2940 });
  criarPedido(1002, "co_forno", "cu_2", FIM, 2990, [["p2", 1], ["p3", 1]], { fee: 500, lastAgo: 2935, payment: "cartao" });
  criarPedido(1003, "co_forno", "cu_3", FIM.slice(0, 4), 100, [["p4", 2], ["p7", 1]], { lastAgo: 55 });
  criarPedido(1004, "co_forno", "cu_4", FIM.slice(0, 4), 95, [["p1", 1], ["p9", 1]], { lastAgo: 55, payment: "dinheiro" });
  criarPedido(1005, "co_forno", "cu_5", FIM, 90, [["p2", 1], ["p8", 2]], { lastAgo: 10 });
  criarPedido(1006, "co_forno", "cu_1", FIM.slice(0, 3), 50, [["p3", 1], ["p8", 1]], { lastAgo: 18 });
  criarPedido(1007, "co_forno", "cu_2", FIM.slice(0, 3), 46, [["p1", 2]], { lastAgo: 14, payment: "cartao" });
  criarPedido(1008, "co_forno", "cu_3", FIM.slice(0, 3), 40, [["p4", 1], ["p7", 1]], { lastAgo: 9 });
  criarPedido(1009, "co_forno", "cu_4", FIM.slice(0, 3), 34, [["p2", 1], ["p6", 1]], { lastAgo: 5 });
  criarPedido(1010, "co_forno", "cu_5", FIM.slice(0, 2), 16, [["p1", 1], ["p3", 1], ["p7", 1]], { lastAgo: 8 });
  criarPedido(1011, "co_forno", "cu_1", ["recebido"], 4, [["p2", 1], ["p9", 2]]);
  criarPedido(1012, "co_forno", "cu_2", ["recebido", "rejeitado"], 1500, [["p5", 1]], { lastAgo: 1490, reason: "Camarão em falta hoje. Pedimos desculpas, o item volta ao cardápio assim que chegar." });
  criarPedido(1013, "co_forno", "cu_3", ["recebido", "em_preparo", "cancelado"], 600, [["p1", 1]], { lastAgo: 585, reason: "Mudança de planos, não vou mais precisar." });
  // Burger Quintal
  criarPedido(2001, "co_burger", "cu_3", FIM, 1200, [["b1", 2], ["b5", 1]], { lastAgo: 1150 });
  criarPedido(2002, "co_burger", "cu_1", FIM.slice(0, 3), 45, [["b1", 2], ["b5", 1], ["b7", 2]], { lastAgo: 12 });
  criarPedido(2003, "co_burger", "cu_4", FIM.slice(0, 2), 20, [["b2", 1], ["b6", 1]], { lastAgo: 11 });
  criarPedido(2004, "co_burger", "cu_3", ["recebido"], 3, [["b3", 1], ["b7", 1]]);
  criarPedido(2005, "co_burger", "cu_1", ["recebido", "cancelado"], 300, [["b4", 1]], { lastAgo: 290, reason: "Pedi o item errado." });

  // Histórico dos últimos 30 dias, só para o gráfico do dashboard ter o que mostrar.
  // Gerador pseudoaleatório com semente fixa: os números são sempre os mesmos.
  let semente = 20261016;
  const aleatorio = () => (semente = (semente * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const sorteia = (n) => Math.floor(aleatorio() * n);
  const HORAS = [11, 12, 12, 13, 18, 19, 19, 20, 20, 20, 21, 22];
  let numHist = 200;
  for (const coId of ["co_forno", "co_burger"]) {
    const ids = products.filter((p) => p.companyId === coId && p.available).map((p) => p.id);
    for (let dia = 3; dia <= 29; dia++) {
      const d = new Date(agora); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - dia);
      const fimDeSemana = [0, 5, 6].includes(d.getDay());
      const base = (3 + (fimDeSemana ? 4 : 0) + sorteia(4)) * (coId === "co_forno" ? 1 : 0.5);
      for (let k = 0; k < Math.round(base); k++) {
        const quando = d.getTime() + (HORAS[sorteia(HORAS.length)] * 60 + sorteia(60)) * 60000;
        const criadoHa = Math.round((agora - quando) / 60000);
        const a = sorteia(ids.length), b = (a + 1 + sorteia(ids.length - 1)) % ids.length;
        const linhas = [[ids[a], 1 + sorteia(2)], [ids[b], 1 + sorteia(2)]].slice(0, 1 + sorteia(2));
        const cliente = "cu_" + (1 + sorteia(5));
        const cancelado = aleatorio() < 0.06;
        criarPedido(numHist++, coId, cliente, cancelado ? ["recebido", "cancelado"] : FIM, criadoHa, linhas,
          cancelado ? { lastAgo: criadoHa - 10, reason: "Cliente desistiu do pedido." } : { lastAgo: criadoHa - 45 });
      }
    }
  }

  // Viagens e entregas
  const viagem = (id, co, courier, orderIds, state, criadaHa, retiradaHa, fimHa) => {
    trips.push({ id, companyId: co, courierId: courier, orderIds, state, createdAt: atras(criadaHa), pickedUpAt: retiradaHa ? atras(retiradaHa) : null, finishedAt: fimHa ? atras(fimHa) : null });
    orderIds.forEach((oid) => {
      const o = orders.find((x) => x.id === oid), feita = o.state === "entregue";
      deliveries.push({ id: "DL-" + (800 + deliveries.length), tripId: id, orderId: oid, code: o.code, state: feita ? "entregue" : "em_entrega", completedAt: feita ? o.history[o.history.length - 1].at : null });
    });
  };
  viagem("VG-501", "co_forno", "ct_1", ["PED-1001", "PED-1002"], "concluida", 3000, 2965, 2935);
  viagem("VG-502", "co_forno", "ct_1", ["PED-1003", "PED-1004", "PED-1005"], "em_andamento", 62, 55, null);
  viagem("VG-503", "co_burger", "ct_4", ["PED-2001"], "concluida", 1190, 1170, 1150);

  return {
    version: DATA_VERSION, companies, customers, products, couriers, orders, orderItems, trips, deliveries,
    carts: {}, seq: { order: 3001, trip: 504, delivery: 900, item: 9000, product: 100, courier: 20 },
  };
}
