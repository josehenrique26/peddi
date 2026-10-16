// src/pages/courier-available.js — Pedidos 'Prontos' sem endereço completo (RF-ENT-01, RF-ENT-02, RF-ENT-03 e RF-ENT-04).
import {
  obterPedidos,
  listarPedidosProntos,
  iniciarViagem,
  obterViagemAtual,
  simularOutroEntregadorPegou,
  salvarPedidos,
  PEDIDOS_INICIAIS,
} from "../services/orders.js";
import { lerSessao } from "../services/storage.js";

const ESTILOS_ID = "peddi-courier-styles";

function injetarEstilos() {
  if (document.getElementById(ESTILOS_ID)) return;

  const style = document.createElement("style");
  style.id = ESTILOS_ID;
  style.innerHTML = `
    :root {
      --bg-color: #f7f6f2;
      --dark-bg: #1e1e24;
      --primary-color: #ff5a22;
      --text-main: #1a1a1a;
      --text-muted: #666;
      --border-color: #e5e5e5;
      --purple-bg: #f3e8ff;
      --purple-text: #7e22ce;
      --green-bg: #dcfce7;
      --green-text: #166534;
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
    .topbar-right { display: flex; gap: 10px; align-items: center; }
    .container { max-width: 600px; margin: 20px auto; padding: 0 16px 140px 16px; }
    .hero-card { background-color: var(--dark-bg); color: #fff; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
    .hero-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .hero-brand { display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 1.1rem; }
    .status-badge { background: var(--green-bg); color: var(--green-text); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .hero-body { font-size: 0.9rem; color: #aaa; }
    .hero-body h2 { color: #fff; font-size: 1.8rem; margin: 5px 0; }
    .section-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 10px; }
    .section-header h3 { font-size: 1.4rem; margin-bottom: 4px; color: var(--text-main); }
    .section-header p { color: var(--text-muted); font-size: 0.9rem; }
    .badge-count { background: #e2e8f0; color: #334155; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    
    /* Card do Pedido com estado selecionado */
    .order-card { background: #fff; border: 1.5px solid var(--border-color); border-radius: 12px; padding: 18px; display: flex; gap: 14px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.15s ease; cursor: pointer; }
    .order-card:hover { border-color: #cbd5e1; }
    .order-card.selected { border-color: var(--primary-color); background-color: #fff9f6; box-shadow: 0 2px 10px rgba(255, 90, 34, 0.12); }
    .checkbox-container input { width: 22px; height: 22px; cursor: pointer; accent-color: var(--primary-color); margin-top: 2px; }
    .order-content { flex: 1; }
    .order-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .order-id { font-weight: 700; font-size: 1rem; color: var(--text-main); }
    .tag-pronto { background: var(--purple-bg); color: var(--purple-text); font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; font-weight: 600; }
    .order-bairro { font-size: 1rem; font-weight: 600; color: #2d3748; margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
    .order-items { font-size: 0.88rem; color: #4a5568; margin-bottom: 10px; line-height: 1.4; }
    .order-footer { font-size: 0.85rem; color: #718096; display: flex; justify-content: space-between; border-top: 1px solid #edf2f7; padding-top: 8px; }
    .order-footer .price { font-weight: 700; color: var(--text-main); }
    .empty-state { background: #fff; border: 1px dashed var(--border-color); border-radius: 12px; padding: 40px 20px; text-align: center; color: var(--text-muted); }
    .empty-state p { font-size: 1rem; margin-top: 8px; }

    /* Barra de ação inferior fixa com contador (RF-ENT-02) */
    .fixed-bottom { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; flex-direction: column; align-items: center; pointer-events: none; z-index: 100; }
    .action-bar { background: var(--dark-bg); color: #fff; padding: 14px 20px; border-radius: 12px; width: calc(100% - 32px); max-width: 560px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; pointer-events: auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); }
    .action-bar-counter { font-size: 0.95rem; color: #cbd5e1; }
    .action-bar-counter b { color: #fff; font-size: 1.2rem; }
    .action-buttons { display: flex; gap: 10px; align-items: center; }
    .btn-clear { background: transparent; color: #cbd5e1; border: 1px solid #475569; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.15s ease; }
    .btn-clear:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
    .btn-start-trip { background: var(--primary-color); color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; }
    .btn-start-trip:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
    .btn-start-trip:disabled { opacity: 0.35; cursor: not-allowed; }

    /* Avisos flutuantes (RF-ENT-02, RF-ENT-03 e RF-ENT-04) */
    .aviso-flutuante { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; padding: 12px 22px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; z-index: 1000; display: flex; align-items: center; gap: 10px; animation: slideDown 0.25s ease; max-width: 90%; }
    .aviso-erro { background-color: #dc2626; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.35); }
    .aviso-sucesso { background-color: #16a34a; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.35); }
    
    /* Aviso de viagem em andamento (RF-ENT-04) */
    .banner-viagem-ativa { background: #ffedd5; border: 1.5px solid #fb923c; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .banner-viagem-ativa b { color: #9a3412; font-size: 0.95rem; }
    .banner-viagem-ativa small { color: #c2410c; display: block; font-size: 0.85rem; margin-top: 2px; }
    .btn-retomar { background: #ea580c; color: #fff; padding: 8px 14px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85rem; white-space: nowrap; }

    /* Barra de simulação / testes em modo demonstração */
    .demo-actions { margin-top: 10px; padding: 10px 14px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 0.82rem; color: #64748b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
    .btn-test { background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .btn-test:hover { background: #e2e8f0; }

    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -12px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.head.appendChild(style);
}

function gerarHtmlCards(pedidos) {
  if (pedidos.length === 0) {
    return `
      <div class="empty-state">
        <span style="font-size: 2rem;">📦</span>
        <p>Nenhum pedido pronto no momento.</p>
        <small style="color: #999;">Novos pedidos prontos aparecerão aqui automaticamente.</small>
      </div>
    `;
  }

  return pedidos
    .map(
      (pedido) => `
    <div class="order-card" data-id="${pedido.id}">
      <div class="checkbox-container">
        <input type="checkbox" data-order-id="${pedido.id}" aria-label="Selecionar pedido ${pedido.id}" />
      </div>
      <div class="order-content">
        <div class="order-top">
          <span class="order-id">${pedido.id}</span>
          <span class="tag-pronto">Pronto</span>
        </div>
        <!-- RF-ENT-01: Exibir apenas o bairro. Nome, telefone e endereço completo permanecem ocultos até o início da viagem. -->
        <div class="order-bairro">
          <span>📍</span>
          <span>${pedido.bairro}</span>
        </div>
        <div class="order-items">${pedido.itens}</div>
        <div class="order-footer">
          <span class="price">${pedido.valor}</span>
          <span>${pedido.tempo}</span>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

export function renderCourierAvailable(root) {
  injetarEstilos();

  const sessao = lerSessao();
  const courierId = sessao.courierId || "ct_1";
  const pedidosProntos = listarPedidosProntos();
  const viagemAtiva = obterViagemAtual();

  root.innerHTML = `
    <!-- Container para avisos flutuantes (RF-ENT-02, RF-ENT-03 e RF-ENT-04) -->
    <div id="container-aviso" style="display: none;"></div>

    <header class="topbar">
      <div class="topbar-left">
        <a href="#/" class="logo-icon-small">P</a>
        <span><b>Peddi</b> Modo demonstração: troca de perfil</span>
      </div>
      <nav class="topbar-nav">
        <a href="#/admin/orders" class="btn-nav">Estabelecimento</a>
        <a href="#/menu" class="btn-nav">Cliente</a>
        <a href="#/courier/available" class="btn-nav active">Entregador</a>
      </nav>
      <div class="topbar-right">
        <span class="btn-nav" style="border:none; cursor:default;">Rafael Mota · Forno da Vila</span>
      </div>
    </header>

    <main class="container">
      <!-- RF-ENT-04: Critério 5 - Se houver viagem ativa, exibe banner para retomar imediatamente -->
      ${
        viagemAtiva
          ? `
        <div class="banner-viagem-ativa">
          <div>
            <b>🛵 Você possui uma viagem em andamento!</b>
            <small>${viagemAtiva.pedidos.length} pedidos em rota de entrega</small>
          </div>
          <a href="#/courier/trip" class="btn-retomar">Ver viagem atual →</a>
        </div>
      `
          : ""
      }

      <div class="hero-card">
        <div class="hero-header">
          <div class="hero-brand">
            <span class="logo-icon-small">P</span> Peddi Entregas
          </div>
          <span class="status-badge">Ativo</span>
        </div>
        <div class="hero-body">
          <p>Vinculado a</p>
          <h2>Forno da Vila</h2>
          <p>Rafael Mota · E-00017</p>
        </div>
      </div>

      <div class="section-header">
        <div>
          <h3>Prontos para retirada</h3>
          <p>Selecione de 1 a 3 pedidos para montar sua viagem.</p>
        </div>
        <span id="badge-contador-prontos" class="badge-count">${pedidosProntos.length} prontos</span>
      </div>

      <!-- Demonstração do RF-ENT-03: Simular concorrência -->
      <div class="demo-actions">
        <span>🧪 <b>Teste RF-ENT-03:</b> Simular outro entregador pegando pedido</span>
        <button id="btn-simular-conflito" class="btn-test" type="button">
          Simular outro pegando #1050
        </button>
        <button id="btn-resetar-pedidos" class="btn-test" type="button">
          Resetar pedidos
        </button>
      </div>

      <div id="lista-pedidos" style="margin-top: 14px;">
        ${gerarHtmlCards(pedidosProntos)}
      </div>
    </main>

    <!-- RF-ENT-02: Barra de ação fixa inferior com contador e botão de iniciar -->
    <div id="dock-inferior" class="fixed-bottom" style="${pedidosProntos.length === 0 ? "display: none;" : ""}">
      <div class="action-bar">
        <span class="action-bar-counter">
          <b id="contador-selecionados">0</b> de 3 selecionados
        </span>
        <div class="action-buttons">
          <button id="btn-limpar" class="btn-clear" type="button">Limpar</button>
          <button id="btn-iniciar" class="btn-start-trip" type="button" disabled>
            Iniciar viagem 🛵
          </button>
        </div>
      </div>
    </div>
  `;

  // Configurar interatividade de seleção e trava atômica (RF-ENT-02, RF-ENT-03 e RF-ENT-04)
  configurarSelecaoEConcorrencia(courierId);
}

function configurarSelecaoEConcorrencia(courierId) {
  const selecionados = new Set();
  const contadorEl = document.getElementById("contador-selecionados");
  const btnIniciar = document.getElementById("btn-iniciar");
  const btnLimpar = document.getElementById("btn-limpar");
  const containerAviso = document.getElementById("container-aviso");
  const listaPedidosEl = document.getElementById("lista-pedidos");
  const badgeProntosEl = document.getElementById("badge-contador-prontos");
  const dockInferiorEl = document.getElementById("dock-inferior");
  const btnSimularConflito = document.getElementById("btn-simular-conflito");
  const btnResetar = document.getElementById("btn-resetar-pedidos");

  let timeoutAviso = null;

  function mostrarAviso(msg, tipo = "erro") {
    if (timeoutAviso) clearTimeout(timeoutAviso);
    const classeTipo = tipo === "sucesso" ? "aviso-sucesso" : "aviso-erro";
    const icone = tipo === "sucesso" ? "✅" : "⚠️";

    containerAviso.innerHTML = `
      <div class="aviso-flutuante ${classeTipo}">
        <span>${icone}</span>
        <span>${msg}</span>
      </div>
    `;
    containerAviso.style.display = "block";
    timeoutAviso = setTimeout(() => {
      containerAviso.style.display = "none";
    }, 4500);
  }

  function vincularEventosCards() {
    const cards = listaPedidosEl.querySelectorAll(".order-card");
    cards.forEach((card) => {
      const id = card.getAttribute("data-id");
      const checkbox = card.querySelector('input[type="checkbox"]');

      card.addEventListener("click", (event) => {
        const clicouDiretamenteNoCheckbox = event.target === checkbox;

        if (selecionados.has(id)) {
          selecionados.delete(id);
        } else {
          // RF-ENT-02: Limite máximo de 3 pedidos
          if (selecionados.size >= 3) {
            if (clicouDiretamenteNoCheckbox) {
              checkbox.checked = false;
            }
            mostrarAviso("Limite atingido: você só pode selecionar até 3 pedidos por viagem!");
            return;
          }
          selecionados.add(id);
        }

        atualizarInterface();
      });
    });
  }

  function atualizarListaPedidos() {
    const pedidosProntos = listarPedidosProntos();

    if (badgeProntosEl) {
      badgeProntosEl.textContent = `${pedidosProntos.length} prontos`;
    }

    if (dockInferiorEl) {
      dockInferiorEl.style.display = pedidosProntos.length === 0 ? "none" : "";
    }

    listaPedidosEl.innerHTML = gerarHtmlCards(pedidosProntos);
    vincularEventosCards();
    atualizarInterface();
  }

  function atualizarInterface() {
    const total = selecionados.size;

    if (contadorEl) {
      contadorEl.textContent = total;
    }

    if (btnIniciar) {
      btnIniciar.disabled = total === 0;
    }

    const cards = listaPedidosEl.querySelectorAll(".order-card");
    cards.forEach((card) => {
      const id = card.getAttribute("data-id");
      const checkbox = card.querySelector('input[type="checkbox"]');
      const isSelected = selecionados.has(id);

      if (checkbox) checkbox.checked = isSelected;
      if (isSelected) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

    localStorage.setItem("peddi_pedidos_selecionados", JSON.stringify(Array.from(selecionados)));
  }

  // RF-ENT-03 e RF-ENT-04: Botão Iniciar viagem com trava atômica e criação da viagem ativa
  if (btnIniciar) {
    btnIniciar.addEventListener("click", () => {
      if (selecionados.size === 0) return;

      const idsParaIniciar = Array.from(selecionados);

      // RF-ENT-04 Critério 1 e 2: Inicia a viagem, gera códigos de 4 dígitos e muda status para 'Saiu para entrega'
      const resultado = iniciarViagem(idsParaIniciar, courierId);

      if (!resultado.sucesso) {
        // RF-ENT-03 Critério 2: Se outro pegou, aparece aviso e o pedido sai da seleção
        const ocupados = resultado.ocupados || [];
        const plural = ocupados.length > 1;
        const mensagem = plural
          ? `Atenção: Os pedidos ${ocupados.join(", ")} já foram reservados por outro entregador e foram removidos da sua seleção!`
          : `Atenção: O pedido ${ocupados[0]} já foi reservado por outro entregador e foi removido da sua seleção!`;

        mostrarAviso(mensagem, "erro");

        // Remove da seleção os pedidos ocupados
        ocupados.forEach((id) => selecionados.delete(id));

        atualizarListaPedidos();
        return;
      }

      // RF-ENT-04: Sucesso ao iniciar a viagem!
      mostrarAviso("Viagem iniciada com sucesso! Liberando rota...", "sucesso");
      setTimeout(() => {
        location.hash = "#/courier/trip";
      }, 600);
    });
  }

  // Botão Limpar seleção
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      selecionados.clear();
      atualizarInterface();
    });
  }

  // Botão de simulação de concorrência
  if (btnSimularConflito) {
    btnSimularConflito.addEventListener("click", () => {
      simularOutroEntregadorPegou("#1050", "ct_2");
      mostrarAviso("Simulação: Outro entregador acabou de pegar o pedido #1050 no sistema!", "erro");
    });
  }

  // Botão de reset de pedidos para o estado inicial
  if (btnResetar) {
    btnResetar.addEventListener("click", () => {
      salvarPedidos(PEDIDOS_INICIAIS);
      selecionados.clear();
      mostrarAviso("Pedidos resetados para o estado inicial!", "sucesso");
      atualizarListaPedidos();
    });
  }

  // Sincronização automática
  window.addEventListener("peddi_pedidos_alterados", () => {
    const pedidos = obterPedidos();
    selecionados.forEach((id) => {
      const pedido = pedidos.find((p) => p.id === id);
      if (!pedido || pedido.status !== "Pronto" || (pedido.entregador_id && pedido.entregador_id !== courierId)) {
        selecionados.delete(id);
      }
    });
    atualizarListaPedidos();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "peddi_pedidos") {
      atualizarListaPedidos();
    }
  });

  vincularEventosCards();
  atualizarInterface();
}
