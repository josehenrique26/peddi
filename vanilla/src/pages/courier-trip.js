import {
  obterViagemAtual,
  obterPedidos,
  salvarPedidos,
  finalizarViagem,
  validarEConfirmarEntrega,
  resetarTentativasPedido,
  cancelarEntregaPedido,
} from "../services/orders.js";
import { lerSessao, gravarSessao } from "../services/storage.js";
import { rotas, rotaDoPerfil, navegar } from "../utils/routes.js";
import { listarEntregadores, obterEmpresa } from "../services/companies.js";

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
    .select-courier-topbar { background: #262930; color: #f2f1ee; border: 1px solid #383c45; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; outline: none; font-family: inherit; max-width: 280px; }
    .select-courier-topbar:hover, .select-courier-topbar:focus { border-color: #666; }
    .select-courier-topbar option { background: #1e1e24; color: #fff; }
    
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
    .stop-number.cancelado {
      background: #64748b;
      box-shadow: 0 2px 6px rgba(100, 116, 139, 0.3);
    }
    .stop-number.blocked-stop {
      background: #dc2626;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
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
    .status-badge-trip.cancelado { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .status-badge-trip.blocked { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    
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

    /* RF-ENT-05: Estilos de Validação do Código de 4 dígitos */
    .stop-number.locked { background: #94a3b8; box-shadow: none; }
    .stop-number.active-stop { background: var(--primary-color); animation: pulse-ring 2s infinite; }
    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(255, 90, 34, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(255, 90, 34, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 90, 34, 0); }
    }

    .delivery-confirm-section {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
    }
    
    .code-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .code-box.active {
      background: #fff;
      border: 1.5px solid #fed7aa;
      box-shadow: 0 2px 8px rgba(255, 90, 34, 0.06);
    }
    .code-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .code-box-header b { font-size: 0.95rem; color: #1e293b; display: flex; align-items: center; gap: 6px; }
    .code-box-header small { color: #64748b; font-size: 0.82rem; }
    .badge-attempts {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-attempts.critical {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
      animation: pulse-badge 1.5s infinite;
    }
    @keyframes pulse-badge {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(1.03); }
    }

    .code-input-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .input-delivery-code {
      width: 140px;
      height: 44px;
      text-align: center;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #1e293b;
      background: #fff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .input-delivery-code:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(255, 90, 34, 0.15);
    }
    .input-delivery-code.has-error {
      border-color: #dc2626;
      background: #fef2f2;
      animation: shake 0.3s ease;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    .btn-confirm-delivery {
      background: var(--primary-color);
      color: #fff;
      border: none;
      height: 44px;
      padding: 0 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-confirm-delivery:hover { opacity: 0.92; }
    .btn-confirm-delivery:active { transform: scale(0.98); }

    .code-error-msg {
      margin-top: 8px;
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .delivery-confirmed-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #166534;
    }
    .confirmed-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #16a34a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
    }
    .confirmed-text b { display: block; font-size: 0.95rem; color: #14532d; }
    .confirmed-text small { color: #166534; font-size: 0.82rem; }

    /* RF-ENT-08: Pedido cancelado */
    .delivery-cancelled-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #475569;
    }
    .cancelled-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #64748b;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
    }
    .cancelled-text b { display: block; font-size: 0.95rem; color: #334155; }
    .cancelled-text small { color: #64748b; font-size: 0.82rem; }

    .btn-cancel-stop {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #64748b;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-cancel-stop:hover {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }

    .locked-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 0.88rem;
    }

    .test-code-hint {
      margin-top: 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #92400e;
      background: #fef3c7;
      border: 1px dashed #f59e0b;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .test-code-hint b { letter-spacing: 0.1em; font-size: 0.95rem; }

    /* RF-ENT-07: Estilos de bloqueio por esgotamento de tentativas */
    .code-box.blocked {
      background: #fef2f2;
      border: 1.5px solid #f87171;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);
    }
    .blocked-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .blocked-icon {
      font-size: 2rem;
      line-height: 1;
    }
    .blocked-title {
      font-size: 1.05rem;
      color: #991b1b;
      display: block;
    }
    .blocked-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 2px;
    }
    .blocked-text {
      color: #7f1d1d;
      font-size: 0.88rem;
      line-height: 1.45;
      margin-bottom: 12px;
    }
    .blocked-contact-box {
      background: #fff;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .contact-header b {
      color: #1e293b;
      font-size: 0.92rem;
      display: block;
    }
    .contact-header span {
      color: #64748b;
      font-size: 0.82rem;
      display: block;
      margin-top: 2px;
      margin-bottom: 10px;
    }
    .contact-details {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      font-size: 0.88rem;
      color: #334155;
    }
    .btn-call-establishment {
      background: #b91c1c;
      color: #fff;
      border: none;
      padding: 9px 16px;
      border-radius: 6px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s ease;
    }
    .btn-call-establishment:hover {
      background: #991b1b;
      color: #fff;
    }
    .blocked-test-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .btn-reset-attempts {
      background: transparent;
      border: 1px dashed #94a3b8;
      color: #475569;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-reset-attempts:hover {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #64748b;
    }

    .toast-msg {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 1000;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      animation: toastIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toast-msg.sucesso { background: #166534; color: #fff; }
    .toast-msg.erro { background: #b91c1c; color: #fff; }
    @keyframes toastIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .trip-finished-card {
      background: #ecfdf5;
      border: 1.5px solid #6ee7b7;
      border-radius: 12px;
      padding: 24px 20px;
      margin-top: 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .trip-finished-card h3 { color: #065f46; font-size: 1.3rem; margin: 0; }
    .trip-finished-card p { color: #047857; font-size: 0.95rem; margin: 0; }

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

function vincularTrocaPerfil(root) {
  root.querySelectorAll("[data-perfil]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const perfil = el.dataset.perfil;
      gravarSessao({ ...lerSessao(), role: perfil });
      navegar(rotaDoPerfil[perfil]());
    });
  });

  const seletorEntregador = root.querySelector("#select-entregador-topbar");
  if (seletorEntregador) {
    seletorEntregador.addEventListener("change", (e) => {
      gravarSessao({ ...lerSessao(), courierId: e.target.value });
      location.reload();
    });
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "peddi.v1.session") {
      location.reload();
    }
  });
}

function exibirToast(mensagem, tipo = "sucesso") {
  const antigo = document.querySelector(".toast-msg");
  if (antigo) antigo.remove();

  const toast = document.createElement("div");
  toast.className = `toast-msg ${tipo}`;
  toast.innerHTML = `<span>${tipo === "sucesso" ? "✅" : "⚠️"}</span> <span>${mensagem}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export function renderCourierTrip(root) {
  injetarEstilosTrip();

  const sessao = lerSessao();
  const entregadores = listarEntregadores();
  const courierId = sessao.courierId || (entregadores.find((c) => c.active) ?? entregadores[0]).id;
  const entregadorAtual = entregadores.find((c) => c.id === courierId) || entregadores[0];
  const empresaAtual = obterEmpresa(entregadorAtual?.companyId) || {
    name: "Forno da Vila",
    phone: "(83) 3221-4040",
  };

  const opcoesEntregadores = entregadores
    .map((c) => {
      const emp = obterEmpresa(c.companyId);
      const label = `${c.name} · ${emp?.name ?? ""}${c.active ? "" : " (inativo)"}`;
      return `<option value="${c.id}" ${c.id === entregadorAtual.id ? "selected" : ""}>${label}</option>`;
    })
    .join("");

  const viagem = obterViagemAtual(courierId);

  // Se não houver viagem ativa
  if (!viagem || !viagem.pedidosDetalhados || viagem.pedidosDetalhados.length === 0) {
    root.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <a href="${rotas.inicio()}" class="logo-icon-small" title="Página Inicial">P</a>
          <span><b>Peddi</b> Modo demonstração: troca de perfil</span>
        </div>
        <nav class="topbar-nav">
          <a href="${rotas.admin()}" class="btn-nav" data-perfil="admin">Estabelecimento</a>
          <a href="${rotas.pedidos()}" class="btn-nav" data-perfil="cliente">Cliente</a>
          <a href="${rotas.entregador()}" class="btn-nav active" data-perfil="entregador">Entregador</a>
        </nav>
        <div class="topbar-right">
          <select id="select-entregador-topbar" class="select-courier-topbar" aria-label="Entregador em demonstração">
            ${opcoesEntregadores}
          </select>
        </div>
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
    vincularTrocaPerfil(root);
    return;
  }

  const pedidos = viagem.pedidosDetalhados;
  const entregues = pedidos.filter((p) => p.status === "Entregue").length;
  const cancelados = pedidos.filter((p) => p.status === "Cancelado").length;
  const concluidos = entregues + cancelados;
  const total = pedidos.length;
  const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const indiceParadaAtual = pedidos.findIndex((p) => p.status !== "Entregue" && p.status !== "Cancelado");
  const todosConcluidos = concluidos === total;

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <a href="${rotas.inicio()}" class="logo-icon-small" title="Página Inicial">P</a>
        <span><b>Peddi</b> Modo demonstração: troca de perfil</span>
      </div>
      <nav class="topbar-nav">
        <a href="${rotas.admin()}" class="btn-nav" data-perfil="admin">Estabelecimento</a>
        <a href="${rotas.pedidos()}" class="btn-nav" data-perfil="cliente">Cliente</a>
        <a href="${rotas.entregador()}" class="btn-nav active" data-perfil="entregador">Entregador</a>
      </nav>
      <div class="topbar-right">
        <select id="select-entregador-topbar" class="select-courier-topbar" aria-label="Entregador em demonstração">
          ${opcoesEntregadores}
        </select>
      </div>
    </header>

    <main class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <a href="#/courier/available" class="btn-nav" style="display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #334155; border: 1px solid #cbd5e1; font-weight: 600;">
          ← Ver pedidos disponíveis
        </a>
        <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">Viagem em andamento</span>
      </div>

      <!-- RF-ENT-04, RF-ENT-05, RF-ENT-06 & RF-ENT-08: Barra de progresso X de N paradas concluídas -->
      <section class="prog-card">
        <div class="track">
          <i class="track-bar" style="width: ${percentual}%;"></i>
        </div>
        <div class="prog-row">
          <b>${concluidos} de ${total} paradas concluídas (${percentual}%)${cancelados > 0 ? ` · <span style="font-size:0.85rem; font-weight:normal; color:#64748b;">(${entregues} entregue${entregues > 1 ? 's' : ''}, ${cancelados} cancelado${cancelados > 1 ? 's' : ''})</span>` : ''}</b>
          <small>${todosConcluidos ? "Viagem concluída 🎉" : `Parada atual: ${indiceParadaAtual + 1} de ${total}`}</small>
        </div>
      </section>

      <!-- RF-ENT-04, RF-ENT-05 & RF-ENT-06: Paradas numeradas com validação sequencial por código -->
      <div class="stops">
        ${pedidos
          .map((pedido, index) => {
            const numeroParada = index + 1;
            const enderecoEncoded = encodeURIComponent(
              `${pedido.endereco_completo}, ${pedido.bairro}, João Pessoa`
            );
            const isEntregue = pedido.status === "Entregue";
            const isCancelado = pedido.status === "Cancelado";
            const tentativasRestantes =
              typeof pedido.tentativas_restantes === "number"
                ? pedido.tentativas_restantes
                : 3;
            const isBloqueado = Boolean(pedido.bloqueado) || tentativasRestantes <= 0;
            const isAtual = index === indiceParadaAtual;
            const horaEntrega = pedido.entregue_em
              ? new Date(pedido.entregue_em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const horaCancelamento = pedido.cancelado_em
              ? new Date(pedido.cancelado_em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            const stopNumberClass = isEntregue
              ? "stop-number entregue"
              : isCancelado
              ? "stop-number cancelado"
              : isBloqueado && isAtual
              ? "stop-number blocked-stop"
              : isAtual
              ? "stop-number active-stop"
              : "stop-number locked";

            const statusBadgeClass = isEntregue
              ? "status-badge-trip entregue"
              : isCancelado
              ? "status-badge-trip cancelado"
              : isBloqueado && isAtual
              ? "status-badge-trip blocked"
              : "";

            const statusTexto = isEntregue
              ? "Entregue"
              : isCancelado
              ? "Cancelado"
              : isBloqueado && isAtual
              ? "Bloqueado"
              : pedido.status || "Saiu para entrega";

            return `
          <article class="stop" data-pedido-id="${pedido.id}">
            <span class="${stopNumberClass}">
              ${isEntregue ? "✓" : isCancelado ? "✕" : isBloqueado && isAtual ? "🚫" : numeroParada}
            </span>
            <div class="stop-card">
              <div class="stop-header">
                <b class="order-tag">${pedido.id}</b>
                <span class="status-badge-trip ${statusBadgeClass}">
                  ${statusTexto}
                </span>
                <small style="color: #64748b;">Parada ${numeroParada} de ${total}</small>
              </div>

              <!-- RF-ENT-04: Endereço completo e complemento -->
              <h3 class="stop-addr">${pedido.endereco_completo}</h3>
              <p class="stop-subaddr">
                📍 <b>${pedido.bairro}</b>${pedido.complemento ? ` · ${pedido.complemento}` : ""}
              </p>

              <!-- RF-ENT-04: Dados do cliente -->
              <div class="client-box">
                <span class="client-avatar">${obterIniciais(pedido.cliente)}</span>
                <div class="client-info">
                  <b>${pedido.cliente || "Cliente"}</b>
                  <small>
                    📞 <a href="tel:${pedido.telefone}">${pedido.telefone || "Telefone não informado"}</a>
                  </small>
                </div>
              </div>

              <!-- Abrir no Google Maps -->
              <div style="margin-bottom: 14px;">
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
              </div>

              <!-- RF-ENT-05, RF-ENT-06, RF-ENT-07 & RF-ENT-08: Validação por código, tentativas e finalização -->
              <div class="delivery-confirm-section">
                ${
                  isEntregue
                    ? `
                  <div class="delivery-confirmed-box">
                    <span class="confirmed-icon">✓</span>
                    <div class="confirmed-text">
                      <b>Entrega confirmada com sucesso!</b>
                      <small>Status: Entregue · Confirmado${horaEntrega ? ` às ${horaEntrega}` : ""}</small>
                    </div>
                  </div>
                  `
                    : isCancelado
                    ? `
                  <div class="delivery-cancelled-box">
                    <span class="cancelled-icon">✕</span>
                    <div class="cancelled-text">
                      <b>Entrega Cancelada</b>
                      <small>${pedido.motivo_cancelamento || "Cancelado"} · Registrado${horaCancelamento ? ` às ${horaCancelamento}` : ""}</small>
                    </div>
                  </div>
                  `
                    : isBloqueado && isAtual
                    ? `
                  <div class="code-box blocked">
                    <div class="blocked-header">
                      <span class="blocked-icon">🚫</span>
                      <div>
                        <b class="blocked-title">Entrega Bloqueada</b>
                        <span class="blocked-badge">Limite de 3 tentativas esgotado</span>
                      </div>
                    </div>
                    <p class="blocked-text">
                      O código de confirmação foi inserido incorretamente 3 vezes seguidas. Por motivos de segurança, esta parada foi bloqueada e não pode ser concluída pelo aplicativo.
                    </p>
                    <div class="blocked-contact-box">
                      <div class="contact-header">
                        <b>📞 Orientação ao entregador:</b>
                        <span>Entre em contato imediatamente com o estabelecimento parceiro para conferência ou liberação:</span>
                      </div>
                      <div class="contact-details">
                        <span class="company-name">🏪 Estabelecimento: <b>${empresaAtual?.name || "Estabelecimento"}</b></span>
                        <span class="company-phone">Telefone: <b>${empresaAtual?.phone || "(83) 3221-4040"}</b></span>
                      </div>
                      <a href="tel:${(empresaAtual?.phone || '').replace(/[^\d+]/g, '')}" class="btn-call-establishment">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        Ligar para ${empresaAtual?.name || "Estabelecimento"}
                      </a>
                    </div>
                    <div class="blocked-test-actions" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                      <button type="button" class="btn-cancel-stop" data-cancel-pedido-id="${pedido.id}">
                        ✕ Cancelar entrega deste pedido (insucesso)
                      </button>
                      <button type="button" class="btn-reset-attempts" data-reset-pedido-id="${pedido.id}">
                        🔄 Resetar tentativas (demonstração / teste)
                      </button>
                    </div>
                  </div>
                  `
                    : isAtual
                    ? `
                  <div class="code-box active">
                    <div class="code-box-header">
                      <b>🔑 Validação de entrega</b>
                      <span class="badge-attempts ${tentativasRestantes === 1 ? 'critical' : ''}" data-badge-pedido-id="${pedido.id}">
                        ${tentativasRestantes === 1 ? '⚠️ Última tentativa!' : `🎯 ${tentativasRestantes} de 3 tentativas restantes`}
                      </span>
                    </div>
                    <div class="code-input-row">
                      <input
                        type="text"
                        class="input-delivery-code"
                        data-pedido-id="${pedido.id}"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="0000"
                        autocomplete="off"
                        aria-label="Código de entrega de 4 dígitos para o pedido ${pedido.id}"
                      />
                      <button
                        type="button"
                        class="btn-confirm-delivery"
                        data-pedido-id="${pedido.id}"
                      >
                        Confirmar Entrega
                      </button>
                    </div>
                    <div class="code-error-msg" data-error-pedido-id="${pedido.id}" style="display: none;"></div>
                    <div class="test-code-hint">
                      <span>💡 Código do cliente para teste:</span>
                      <b>${pedido.codigo_entrega || "----"}</b>
                    </div>
                    <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                      <button type="button" class="btn-cancel-stop" data-cancel-pedido-id="${pedido.id}">
                        ✕ Cancelar entrega deste pedido (cliente ausente)
                      </button>
                    </div>
                  </div>
                  `
                    : `
                  <div class="locked-box">
                    <span style="font-size: 1.3rem;">🔒</span>
                    <div>
                      <b>Aguardando conclusão da Parada ${indiceParadaAtual + 1}</b>
                      <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                        Você deve concluir a Parada ${indiceParadaAtual + 1} (${pedidos[indiceParadaAtual]?.cliente || "anterior"}) antes desta entrega.
                      </div>
                    </div>
                  </div>
                  `
                }
              </div>
            </div>
          </article>
        `;
          })
          .join("")}
      </div>

      ${
        todosConcluidos
          ? `
        <div class="trip-finished-card">
          <div style="font-size: 2.5rem;">🎉</div>
          <h3>Todas as paradas foram concluídas!</h3>
          <p>Esta viagem foi finalizada com êxito (${entregues} entregue${entregues > 1 ? 's' : ''}${cancelados > 0 ? `, ${cancelados} cancelado${cancelados > 1 ? 's' : ''}` : ''}).</p>
          <button id="btn-concluir-viagem" class="btn-confirm-delivery" style="padding: 12px 28px; font-size: 1rem; cursor: pointer;" type="button">
            Encerrar Viagem e Voltar à Lista de Pedidos 📦
          </button>
        </div>
        `
          : `
        <div class="trip-footer">
          <a href="#/courier/available" class="btn-nav" style="border-color: #cbd5e1; color: #334155;">
            ← Voltar para lista de pedidos
          </a>
          <button id="btn-cancelar-viagem" class="btn-cancel-trip" type="button">
            Cancelar viagem inteira (teste)
          </button>
        </div>
        `
      }
    </main>
  `;

  // Critério 1 e 2: Filtrar apenas números no input e limpar erro na digitação
  root.querySelectorAll(".input-delivery-code").forEach((input) => {
    input.addEventListener("input", (e) => {
      const valorOriginal = e.target.value;
      const valorFiltrado = valorOriginal.replace(/\D/g, "").slice(0, 4);
      if (valorOriginal !== valorFiltrado) {
        e.target.value = valorFiltrado;
      }
      input.classList.remove("has-error");
      const pedidoId = input.dataset.pedidoId;
      const errorEl = root.querySelector(`.code-error-msg[data-error-pedido-id="${pedidoId}"]`);
      if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const pedidoId = input.dataset.pedidoId;
        const btn = root.querySelector(`.btn-confirm-delivery[data-pedido-id="${pedidoId}"]`);
        if (btn) btn.click();
      }
    });
  });

  // Foca automaticamente no input da parada ativa
  const activeInput = root.querySelector(".code-box.active .input-delivery-code");
  if (activeInput) {
    activeInput.focus();
  }

  // Critério 2, 3 e 4: Confirmar entrega
  root.querySelectorAll(".btn-confirm-delivery[data-pedido-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pedidoId = btn.dataset.pedidoId;
      const input = root.querySelector(`.input-delivery-code[data-pedido-id="${pedidoId}"]`);
      const errorEl = root.querySelector(`.code-error-msg[data-error-pedido-id="${pedidoId}"]`);
      const codigoDigitado = input ? input.value.trim() : "";

      const resultado = validarEConfirmarEntrega(pedidoId, codigoDigitado);

      if (!resultado.sucesso) {
        if (resultado.bloqueado) {
          exibirToast(resultado.erro, "erro");
          renderCourierTrip(root);
          return;
        }

        if (input) {
          input.classList.add("has-error");
          input.focus();
          input.select();
        }
        if (errorEl) {
          errorEl.textContent = `⚠️ ${resultado.erro}`;
          errorEl.style.display = "flex";
        }
        const badgeEl = root.querySelector(`.badge-attempts[data-badge-pedido-id="${pedidoId}"]`);
        if (badgeEl && typeof resultado.tentativasRestantes === "number") {
          const rest = resultado.tentativasRestantes;
          badgeEl.textContent = rest === 1 ? "⚠️ Última tentativa!" : `🎯 ${rest} de 3 tentativas restantes`;
          if (rest === 1) {
            badgeEl.classList.add("critical");
          } else {
            badgeEl.classList.remove("critical");
          }
        }
        exibirToast(resultado.erro, "erro");
        return;
      }

      // Sucesso
      exibirToast(resultado.mensagem, "sucesso");
      setTimeout(() => {
        renderCourierTrip(root);
      }, 500);
    });
  });

  // RF-ENT-07: Resetar tentativas para fins de teste/demonstração
  root.querySelectorAll(".btn-reset-attempts[data-reset-pedido-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pedidoId = btn.dataset.resetPedidoId;
      resetarTentativasPedido(pedidoId);
      exibirToast("Tentativas resetadas para 3. Você pode tentar novamente.", "sucesso");
      renderCourierTrip(root);
    });
  });

  // RF-ENT-08 (Critério 2): Cancelar entrega de parada individual (ex: cliente ausente/recusa)
  root.querySelectorAll(".btn-cancel-stop[data-cancel-pedido-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pedidoId = btn.dataset.cancelPedidoId;
      const motivo = prompt(
        `Informe o motivo do cancelamento da entrega do pedido ${pedidoId}:`,
        "Cliente ausente após tentativas de contato"
      );
      if (motivo !== null && motivo.trim() !== "") {
        cancelarEntregaPedido(pedidoId, motivo.trim());
        exibirToast(`Entrega do pedido ${pedidoId} registrada como cancelada.`, "sucesso");
        renderCourierTrip(root);
      }
    });
  });

  // RF-ENT-08 (Critério 3): Concluir viagem após todas as entregas (ou cancelamentos) e voltar à lista
  const btnConcluir = root.querySelector("#btn-concluir-viagem");
  if (btnConcluir) {
    btnConcluir.addEventListener("click", () => {
      finalizarViagem();
      exibirToast("Viagem encerrada com sucesso! Retornando à lista de pedidos...", "sucesso");
      setTimeout(() => {
        location.hash = "#/courier/available";
      }, 400);
    });
  }

  // Cancelar viagem em andamento
  const btnCancelar = root.querySelector("#btn-cancelar-viagem");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      if (confirm("Deseja realmente cancelar/encerrar esta viagem?")) {
        finalizarViagem();
        location.hash = "#/courier/available";
        location.reload();
      }
    });
  }

  vincularTrocaPerfil(root);
}
