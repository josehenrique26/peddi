// src/components/admin-shell.js — menu lateral das telas do perfil empresa.
// O esqueleto (<aside id="menu-lateral">, #scrim, botão #abrir-menu) está no HTML de cada tela.
import { logoCompleto } from "./logo.js";
import { escapar } from "../utils/format.js";
import { rotas } from "../utils/routes.js";
import { obterEmpresa } from "../services/companies.js";
import { pedidosDaEmpresa } from "../services/orders.js";

const NAV = [
  ["dashboard", "grid", "Dashboard", "admin.html"],
  ["pedidos", "receipt", "Pedidos", "admin-pedidos.html"],
  ["cardapio", "book", "Cardápio", "admin-cardapio.html"],
  ["entregadores", "bike", "Entregadores", rotas.adminEntregadores()],
  ["config", "sliders", "Configurações", "admin-config.html"],
];

// Preenche o menu. Pode ser chamada de novo quando os dados mudam.
export function montarMenuLateral(ativo, empresaId) {
  const empresa = obterEmpresa(empresaId);
  const novos = pedidosDaEmpresa(empresaId).filter((p) => p.state === "recebido").length;

  const selo = empresa.active
    ? `<span class="badge b-green"><span data-icon="check" data-size="13"></span> Recebendo pedidos</span>`
    : `<span class="badge b-red"><span data-icon="ban" data-size="13"></span> Empresa inativa</span>`;

  const links = NAV.map(([chave, nomeIcone, rotulo, destino]) => {
    const atual = chave === ativo ? 'aria-current="page"' : "";
    const contador = chave === "pedidos" && novos ? `<span class="cnt" aria-label="${novos} novos">${novos}</span>` : "";
    return `<a class="nl" href="${destino}" ${atual}><span data-icon="${nomeIcone}" data-size="19"></span> ${rotulo} ${contador}</a>`;
  }).join("");

  // Nome, categoria e código vêm dos dados (podem ser digitados): passam por escapar().
  document.getElementById("menu-lateral").innerHTML = `
    <span class="side-logo">${logoCompleto()}</span>
    <div class="co">
      <div class="strong">${escapar(empresa.name)}</div>
      <div class="small co-sub">${escapar(empresa.category)} · código ${escapar(empresa.code)}</div>
      <div class="co-badge">${selo}</div>
    </div>
    <nav>${links}</nav>
    <span class="sp"></span>
    <a class="nl" href="${rotas.loja(empresa.slug)}"><span data-icon="eye" data-size="19"></span> Ver como cliente</a>
  `;
}

// Em telas estreitas o menu vira uma gaveta. Chame UMA vez, na inicialização da página.
export function ligarMenuMovel() {
  const menu = document.getElementById("menu-lateral");
  const fundo = document.getElementById("scrim");
  const botao = document.getElementById("abrir-menu");

  const definir = (aberto) => {
    menu.classList.toggle("open", aberto);
    fundo.classList.toggle("on", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
  };

  botao.addEventListener("click", () => definir(true));
  fundo.addEventListener("click", () => definir(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") definir(false); });
}
