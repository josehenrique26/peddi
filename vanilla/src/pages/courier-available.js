// Tela: Pedidos 'Prontos' sem endereço completo (RF-ENT-01 e RF-ENT-02).

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
    .logo-icon-small { background: var(--primary-color); color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .topbar-nav { display: flex; gap: 8px; }
    .btn-nav { background: transparent; color: #aaa; border: 1px solid #444; padding: 6px 12px; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.85rem; }
    .btn-nav:hover { color: #fff; border-color: #666; }
    .btn-nav.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
    .topbar-right { display: flex; gap: 10px; }
    .container { max-width: 600px; margin: 20px auto; padding: 0 16px 140px 16px; }
    .hero-card { background-color: var(--dark-bg); color: #fff; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
    .hero-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .hero-brand { display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 1.1rem; }
    .status-badge { background: var(--green-bg); color: var(--green-text); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
    .hero-body { font-size: 0.9rem; color: #aaa; }
    .hero-body h2 { color: #fff; font-size: 1.8rem; margin: 5px 0; }
    .section-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
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

    /* RF-ENT-02: Barra de ação inferior fixa com contador */
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

    /* RF-ENT-02: Aviso flutuante para recusa do 4º pedido */
    .aviso-limite { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background-color: #dc2626; color: #fff; padding: 12px 22px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.35); z-index: 1000; display: flex; align-items: center; gap: 10px; animation: slideDown 0.25s ease; }
    @keyframes slideDown {
      from { opacity: 0; transform: translate(-50%, -12px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
  document.head.appendChild(style);
}

// Dados iniciais com pedidos fictícios respeitando o modelo de dados
const DADOS_INICIAIS = [
  {
    id: "#1046",
    status: "Pronto",
    entregador_id: null,
    bairro: "Saúde",
    itens: "2× Margherita",
    valor: "R$ 76,00",
    tempo: "há 21 min de espera",
    endereco_completo: "Rua São Sebastião, 342, Saúde",
    cliente: "Ana Beatriz Lima",
    telefone: "(11) 98765-4321"
  },
  {
    id: "#1050",
    status: "Pronto",
    entregador_id: null,
    bairro: "Paraíso",
    itens: "1× Calabresa especial",
    valor: "R$ 48,00",
    tempo: "há 8 min de espera",
    endereco_completo: "Av. Bernardino de Campos, 120, Paraíso",
    cliente: "Marcos Vinícius Rocha",
    telefone: "(11) 97654-3210"
  },
  {
    id: "#1051",
    status: "Pronto",
    entregador_id: null,
    bairro: "Ipiranga",
    itens: "2× Portuguesa, 1× Guaraná 2 L",
    valor: "R$ 95,00",
    tempo: "há 15 min de espera",
    endereco_completo: "Rua Bom Pastor, 800, Ipiranga",
    cliente: "Juliana Mendes",
    telefone: "(11) 96543-2109"
  },
  {
    id: "#1052",
    status: "Pronto",
    entregador_id: null,
    bairro: "Vila Mariana",
    itens: "1× Quatro Queijos, 1× Suco de laranja 400 ml",
    valor: "R$ 67,00",
    tempo: "há 33 min de espera",
    endereco_completo: "Rua Domingos de Morais, 1500, Vila Mariana",
    cliente: "Carlos Eduardo",
    telefone: "(11) 95432-1098"
  }
];

function obterPedidos() {
  const salvo = localStorage.getItem("peddi_pedidos");
  if (!salvo) {
    localStorage.setItem("peddi_pedidos", JSON.stringify(DADOS_INICIAIS));
    return DADOS_INICIAIS;
  }
  try {
    return JSON.parse(salvo);
  } catch {
    return DADOS_INICIAIS;
  }
}

export function renderCourierAvailable(root) {
  injetarEstilos();

  const todosPedidos = obterPedidos();

  // RF-ENT-01: Filtrar apenas pedidos com status "Pronto" e sem entregador atribuído
  const pedidosProntos = todosPedidos.filter(
    (pedido) => pedido.status === "Pronto" && !pedido.entregador_id
  );

  root.innerHTML = `
    <!-- Container para avisos visuais (ex: limite de pedidos atingido) -->
    <div id="container-aviso" style="display: none;"></div>

    <header class="topbar">
      <div class="topbar-left">
        <span class="logo-icon-small">P</span>
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
        <span class="badge-count">${pedidosProntos.length} prontos</span>
      </div>

      <div id="lista-pedidos">
        ${
          pedidosProntos.length === 0
            ? `
              <div class="empty-state">
                <span style="font-size: 2rem;">📦</span>
                <p>Nenhum pedido pronto no momento.</p>
                <small style="color: #999;">Novos pedidos prontos aparecerão aqui automaticamente.</small>
              </div>
            `
            : pedidosProntos
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
                  <!-- RF-ENT-01: Exibir apenas o bairro. Nome, telefone e endereço completo permanecem ocultos. -->
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
                .join("")
        }
      </div>
    </main>

    <!-- RF-ENT-02: Barra de ação fixa inferior com contador e botão de iniciar -->
    ${
      pedidosProntos.length > 0
        ? `
      <div class="fixed-bottom">
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
    `
        : ""
    }
  `;

  // Configurar interatividade de seleção (RF-ENT-02)
  if (pedidosProntos.length > 0) {
    configurarSelecao();
  }
}

// RF-ENT-02: Lógica de seleção, contador dinâmico, trava do 4º pedido e botão habilitado/desabilitado
function configurarSelecao() {
  const selecionados = new Set();
  const contadorEl = document.getElementById("contador-selecionados");
  const btnIniciar = document.getElementById("btn-iniciar");
  const btnLimpar = document.getElementById("btn-limpar");
  const containerAviso = document.getElementById("container-aviso");
  const cards = document.querySelectorAll(".order-card");

  let timeoutAviso = null;

  function mostrarAviso(msg) {
    if (timeoutAviso) clearTimeout(timeoutAviso);
    containerAviso.innerHTML = `
      <div class="aviso-limite">
        <span>⚠️</span>
        <span>${msg}</span>
      </div>
    `;
    containerAviso.style.display = "block";
    timeoutAviso = setTimeout(() => {
      containerAviso.style.display = "none";
    }, 3500);
  }

  function atualizarInterface() {
    const total = selecionados.size;

    // Critério: Contador dinâmico (X de 3 selecionados)
    if (contadorEl) {
      contadorEl.textContent = total;
    }

    // Critério: Iniciar viagem desabilitado sem seleção
    if (btnIniciar) {
      btnIniciar.disabled = total === 0;
    }

    // Atualiza estado visual de cada card e checkbox
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

    // Salva a seleção no localStorage para as próximas etapas (viagem)
    localStorage.setItem("peddi_pedidos_selecionados", JSON.stringify(Array.from(selecionados)));
  }

  cards.forEach((card) => {
    const id = card.getAttribute("data-id");
    const checkbox = card.querySelector('input[type="checkbox"]');

    // Ao clicar no card (ou diretamente no checkbox)
    card.addEventListener("click", (event) => {
      // Se clicou diretamente no input, o evento padrão já inverte o checked
      const clicouDiretamenteNoCheckbox = event.target === checkbox;

      if (selecionados.has(id)) {
        // Desmarcar
        selecionados.delete(id);
      } else {
        // Critério: Quarto pedido recusado com aviso
        if (selecionados.size >= 3) {
          if (clicouDiretamenteNoCheckbox) {
            checkbox.checked = false;
          }
          mostrarAviso("Limite atingido: você só pode selecionar até 3 pedidos por viagem!");
          return;
        }
        // Marcar
        selecionados.add(id);
      }

      atualizarInterface();
    });
  });

  // Botão Limpar seleção
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      selecionados.clear();
      atualizarInterface();
    });
  }

  // Botão Iniciar viagem (prepara navegação futura)
  if (btnIniciar) {
    btnIniciar.addEventListener("click", () => {
      if (selecionados.size === 0) return;
      location.hash = "#/courier/trip";
    });
  }

  // Executa uma vez para sincronizar
  atualizarInterface();
}
