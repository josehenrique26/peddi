// src/pages/courier-trip.js — Viagem atual do entregador (RF-ENT-04)
import { obterViagemAtual, obterPedidos, salvarPedidos, finalizarViagem } from "../services/orders.js";

const ESTILOS_TRIP_ID = "peddi-courier-trip-styles";

function injetarEstilosTrip() {
  if (document.getElementById(ESTILOS_TRIP_ID)) return;

  const style = document.createElement("style");
  style.id = ESTILOS_TRIP_ID;
  style.innerHTML = `
    :root {
      --bg-color: #f7f6f2;
      --dark-bg: #1e1e24;
      --primary-color: #ff5a22;
      --text-main: #1a1a1a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      --green-bg: #dcfce7;
      --green-text: #166534;
      --orange-bg: #ffedd5;
      --orange-text: #c2410c;
      --font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-family); background-color: var(--bg-color); color: var(--text-main); }
    .topbar { background-color: var(--dark-bg); color: #fff; display: flex; justify-content: space-between; padding: 10px 20px; font-size: 0.85rem; align-items: center; flex-wrap: wrap; gap: 10px; }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .logo-icon-small { background: var(--primary-color); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; text-decoration: none; }
    .topbar-nav { display: flex; gap: 8px; }
    .btn-nav { background: transparent; color: #aaa; border: 1px solid #444; padding: 6px 12px; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.85rem; }
    .btn-nav:hover { color: #fff; border-color: #666; }
    .btn-nav.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
    
    .container { max-width: 640px; margin: 20px auto; padding: 0 16px 80px 16px; }
    
    /* Card de Progresso */
    .prog-card { background: #fff; border: 1px solid var(--border-color); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .track { height: 8px; border-radius: 8px; background: #e2e8f0; margin-bottom: 12px; overflow: hidden; }
    .track-bar { display: block; height: 100%; border-radius: 8px; background: #16a34a; transition: width 0.3s ease; }
    .prog-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; }
    .prog-row b { color: var(--text-main); font-size: 1.05rem; }
    .prog-row small { color: var(--text-muted); }

    /* Lista de Paradas */
    .stops { display: flex; flex-direction: column; gap: 16px; position: relative; }
    .stop { position: relative; display: grid; grid-template-columns: 36px 1fr; gap: 14px; }
    .stop:not(:last-child)::before {
      content: "";
      position: absolute;
      left: 17px;
      top: 40px;
      bottom: -18px;
      width: 2px;
      background: #cbd5e1;
      z-index: 1;
    }
    .stop-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      z-index: 2;
      box-shadow: 0 2px 6px rgba(255, 90, 34, 0.3);
    }
    .stop-number.entregue {
      background: #16a34a;
      box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3);
    }

    .stop-card {
      background: #fff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .stop-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .order-tag { font-weight: 700; font-size: 1.05rem; color: var(--text-main); }
    .status-badge-trip { background: var(--orange-bg); color: var(--orange-text); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge-trip.entregue { background: var(--green-bg); color: var(--green-text); }
    
    .stop-addr { font-size: 1.15rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .stop-subaddr { color: #64748b; font-size: 0.9rem; margin-bottom: 14px; }
    
    /* Dados do cliente liberados (RF-ENT-04) */
    .client-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .client-info b { font-size: 0.95rem; color: #1e293b; }
    .client-info small { color: #64748b; font-size: 0.85rem; display: block; margin-top: 2px; }
    .client-info a { color: var(--primary-color); text-decoration: none; font-weight: 600; }

    /* Ações da parada (Abrir mapa e código) */
    .stop-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
      align-items: center;
    }
    .btn-map {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 9px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-map:hover { background: #e2e8f0; color: #0f172a; }
    
    .client-code-badge {
      background: #fef3c7;
      border: 1px dashed #f59e0b;
      color: #92400e;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .client-code-badge span { font-weight: 700; font-size: 1.05rem; letter-spacing: 0.1em; color: #b45309; }

    /* Empty state para quando não há viagem ativa */
    .empty-trip { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 50px 20px; text-align: center; color: var(--text-muted); }
    .btn-action-primary { background: var(--primary-color); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; }
    .btn-action-primary:hover { opacity: 0.92; }

    /* Barra inferior da viagem */
    .trip-footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .btn-cancel-trip { background: transparent; border: 1px solid #cbd5e1; color: #64748b; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
    .btn-cancel-trip:hover { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }

    @media (max-width: 600px) {
      .stop-actions { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function obterIniciais(nome) {
  if (!nome) return "CL";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function renderCourierTrip(root) {
  injetarEstilosTrip();

  const viagem = obterViagemAtual();

  // Se não houver viagem ativa
  if (!viagem || !viagem.pedidosDetalhados || viagem.pedidosDetalhados.length === 0) {
    root.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <a href="#/courier/available" class="logo-icon-small">P</a>
          <span><b>Peddi</b> Viagem Atual</span>
        </div>
        <nav class="topbar-nav">
          <a href="#/courier/available" class="btn-nav">Pedidos Prontos</a>
          <a href="#/courier/trip" class="btn-nav active">Viagem</a>
        </nav>
      </header>

      <main class="container">
        <div class="empty-trip">
          <span style="font-size: 2.5rem;">🛵</span>
          <h2 style="margin: 12px 0 6px 0; color: #1e293b;">Nenhuma viagem em andamento</h2>
          <p>Você não possui nenhuma viagem ativa no momento. Vá para a tela de pedidos prontos para montar sua viagem.</p>
          <a href="#/courier/available" class="btn-action-primary">
            Ver pedidos disponíveis 📦
          </a>
        </div>
      </main>
    `;
    return;
  }

  const pedidos = viagem.pedidosDetalhados;
  const entregues = pedidos.filter((p) => p.status === "Entregue").length;
  const total = pedidos.length;
  const percentual = Math.round((entregues / total) * 100);

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <a href="#/courier/available" class="logo-icon-small">P</a>
        <span><b>Peddi</b> Viagem em andamento</span>
      </div>
      <nav class="topbar-nav">
        <a href="#/courier/available" class="btn-nav">Disponíveis</a>
        <a href="#/courier/trip" class="btn-nav active">Viagem atual</a>
      </nav>
      <div class="topbar-right">
        <span class="btn-nav" style="border:none; cursor:default;">Rafael Mota · Forno da Vila</span>
      </div>
    </header>

    <main class="container">
      <!-- RF-ENT-04: Critério 4 - Barra de progresso X de N entregues -->
      <section class="prog-card">
        <div class="track">
          <i class="track-bar" style="width: ${percentual}%;"></i>
        </div>
        <div class="prog-row">
          <b>${entregues} de ${total} entregues</b>
          <small>${entregues === total ? "Viagem concluída 🎉" : `Parada atual: 1 de ${total}`}</small>
        </div>
      </section>

      <!-- RF-ENT-04: Critério 4 - Paradas numeradas -->
      <div class="stops">
        ${pedidos
          .map((pedido, index) => {
            const numeroParada = index + 1;
            const enderecoEncoded = encodeURIComponent(
              `${pedido.endereco_completo}, ${pedido.bairro}, João Pessoa`
            );
            const isEntregue = pedido.status === "Entregue";

            return `
          <article class="stop">
            <span class="stop-number ${isEntregue ? "entregue" : ""}">${isEntregue ? "✓" : numeroParada}</span>
            <div class="stop-card">
              <div class="stop-header">
                <b class="order-tag">${pedido.id}</b>
                <span class="status-badge-trip ${isEntregue ? "entregue" : ""}">
                  ${pedido.status || "Saiu para entrega"}
                </span>
                <small style="color: #64748b;">Parada ${numeroParada} de ${total}</small>
              </div>

              <!-- RF-ENT-04: Critério 3 - Endereço completo e complemento liberados -->
              <h3 class="stop-addr">${pedido.endereco_completo}</h3>
              <p class="stop-subaddr">
                📍 <b>${pedido.bairro}</b>${pedido.complemento ? ` · ${pedido.complemento}` : ""}
              </p>

              <!-- RF-ENT-04: Critério 3 - Nome do cliente e telefone liberados -->
              <div class="client-box">
                <span class="client-avatar">${obterIniciais(pedido.cliente)}</span>
                <div class="client-info">
                  <b>${pedido.cliente || "Cliente"}</b>
                  <small>
                    📞 <a href="tel:${pedido.telefone}">${pedido.telefone || "Telefone não informado"}</a>
                  </small>
                </div>
              </div>

              <!-- RF-ENT-04: Critério 4 - Link para abrir no mapa -->
              <div class="stop-actions">
                <a
                  class="btn-map"
                  href="https://www.google.com/maps/search/?api=1&query=${enderecoEncoded}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                    <line x1="9" y1="3" x2="9" y2="18"></line>
                    <line x1="15" y1="6" x2="15" y2="21"></line>
                  </svg>
                  Abrir no Google Maps
                </a>

                <!-- RF-ENT-04: Critério 2 - Código de 4 dígitos gerado por pedido (exibido para visualização/teste do fluxo) -->
                <div class="client-code-badge" title="Este código foi gerado pelo sistema e aparece na tela do cliente para confirmação">
                  <small>Código do cliente (RF-ENT-04):</small>
                  <span>${pedido.codigo_entrega || "----"}</span>
                </div>
              </div>
            </div>
          </article>
        `;
          })
          .join("")}
      </div>

      <div class="trip-footer">
        <a href="#/courier/available" class="btn-nav" style="border-color: #cbd5e1; color: #334155;">
          ← Voltar para lista de pedidos
        </a>
        <button id="btn-finalizar-viagem" class="btn-cancel-trip" type="button">
          Concluir / Cancelar viagem (teste)
        </button>
      </div>
    </main>
  `;

  const btnFinalizar = document.getElementById("btn-finalizar-viagem");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
      finalizarViagem();
      alert("Viagem finalizada!");
      location.hash = "#/courier/available";
      location.reload();
    });
  }
}
