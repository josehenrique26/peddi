// src/utils/reports.js — cálculos do dashboard (puros: recebem pedidos e devolvem números).
// Nenhuma função aqui mexe em tela nem em LocalStorage, o que facilita testar e explicar.
import { inicioDoDia, dataCurta } from "./format.js";

const DIA = 864e5;

export const contarPorEstado = (pedidos, estado) => pedidos.filter((p) => p.state === estado).length;

// "Pedidos feitos" = todos que entraram no dia, inclusive os rejeitados e cancelados.
export const pedidosDeHoje = (pedidos) => pedidos.filter((p) => p.createdAt >= inicioDoDia());

// Momento em que o pedido foi entregue (último evento do histórico, se o estado final for "entregue").
const entregueEm = (p) => (p.state === "entregue" ? p.history[p.history.length - 1].at : null);

export const entreguesHoje = (pedidos) =>
  pedidos.filter((p) => entregueEm(p) !== null && entregueEm(p) >= inicioDoDia());

// Faturamento do dia = soma dos pedidos ENTREGUES hoje (dinheiro realmente recebido).
export const faturamentoDeHoje = (pedidos) => entreguesHoje(pedidos).reduce((t, p) => t + p.total, 0);

// Dinheiro ainda "no ar": pedidos válidos que não foram entregues.
export const aReceber = (pedidos) =>
  pedidos.filter((p) => ["recebido", "em_preparo", "pronto", "em_entrega"].includes(p.state)).reduce((t, p) => t + p.total, 0);

// Monta os "baldes" do gráfico. periodo: "dia" (24 horas), "semana" (7 dias) ou "mes" (30 dias).
// Cada balde: { rotulo, titulo, inicio, fim, pedidos } — pedidos = quantos foram feitos naquele intervalo.
export function serieDePedidos(pedidos, periodo) {
  const agora = Date.now();
  let baldes = [];
  if (periodo === "dia") {
    const zero = inicioDoDia();
    for (let i = 0; i < 24; i++) {
      const inicio = zero + i * 36e5;
      baldes.push({ inicio, fim: inicio + 36e5, rotulo: i % 3 === 0 ? `${i}h` : "", titulo: `${String(i).padStart(2, "0")}h às ${String((i + 1) % 24).padStart(2, "0")}h` });
    }
  } else {
    const n = periodo === "semana" ? 7 : 30;
    const hoje = inicioDoDia();
    for (let i = n - 1; i >= 0; i--) {
      const inicio = hoje - i * DIA;
      const d = new Date(inicio);
      const nome = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      baldes.push({
        inicio, fim: inicio + DIA,
        rotulo: n === 7 ? nome : (i % 5 === 0 || i === 0 ? dataCurta(inicio) : ""),
        titulo: `${nome}, ${dataCurta(inicio)}`,
      });
    }
  }
  for (const b of baldes) {
    b.pedidos = pedidos.filter((p) => p.createdAt >= b.inicio && p.createdAt < b.fim).length;
    b.futuro = b.inicio > agora;
  }
  return baldes;
}
