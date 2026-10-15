// Dados iniciais: produtos e categorias fictícios usados quando o LocalStorage está vazio.
// src/data/seed.js — dados iniciais de demonstração (criados na primeira execução).
// Nas próximas telas, acrescente aqui produtos, pedidos, viagens e entregas.
export function criarDadosIniciais() {
  return {
    companies: [
      { id: "co_forno", name: "Forno da Vila", category: "Pizzaria", address: "Rua das Oliveiras, 214 — Centro", slug: "forno-da-vila", code: "VILA482", fee: 600, active: true, brandColor: "#FF6A1A", brandEmoji: "🍕", description: "Pizzas de massa fermentada por 48 horas, assadas em forno a lenha." },
      { id: "co_burger", name: "Burger Quintal", category: "Hamburgueria", address: "Av. Beira Rio, 880 — Jardim Camélia", slug: "burger-quintal", code: "BURG731", fee: 500, active: true, brandColor: "#2E9E5B", brandEmoji: "🍔", description: "Hambúrgueres artesanais, batata rústica e milkshakes." },
      { id: "co_lia", name: "Marmitas da Dona Lia", category: "Marmitaria", address: "Rua do Comércio, 52 — Bairro Novo", slug: "marmitas-dona-lia", code: "LIA905", fee: 400, active: false, brandColor: "#C99700", brandEmoji: "🍛", description: "Comida caseira todos os dias." },
    ],
    customers: [
      { id: "cu_1", name: "Ana Beatriz Lima", phone: "(83) 90000-0101", street: "Rua das Acácias, 120", district: "Jardim Camélia", complement: "Apto 302" },
      { id: "cu_2", name: "Marcos Vinícius Rocha", phone: "(83) 90000-0102", street: "Av. Central, 455", district: "Centro", complement: "" },
      { id: "cu_3", name: "Juliana Teixeira", phone: "(83) 90000-0103", street: "Rua do Sol, 78", district: "Bairro Novo", complement: "Casa 2" },
    ],
    couriers: [
      { id: "ct_1", companyId: "co_forno", name: "Rafael Mota", phone: "(83) 98800-0011", active: true },
      { id: "ct_2", companyId: "co_forno", name: "Camila Duarte", phone: "(83) 98800-0012", active: true },
      { id: "ct_3", companyId: "co_forno", name: "Tiago Leite", phone: "(83) 98800-0013", active: false },
      { id: "ct_4", companyId: "co_burger", name: "Bruno Nery", phone: "(83) 98800-0021", active: true },
      { id: "ct_5", companyId: "co_burger", name: "Elisa Prado", phone: "(83) 98800-0022", active: true },
    ],
  };
}
