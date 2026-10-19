// src/components/demo-bar.js — barra de demonstração (troca de perfil, tema, reiniciar dados).
import { marcaLogo } from "./logo.js";
import { alternarTema } from "../utils/theme.js";
import { preencherSelect } from "../utils/select.js";
import { rotas, rotaDoPerfil, navegar } from "../utils/routes.js";
import { armazenamentoOk, lerSessao, gravarSessao, reiniciarDados } from "../services/storage.js";
import { listarEmpresas, listarClientes, listarEntregadores, obterEmpresa } from "../services/companies.js";

const PERFIS = [
  ["admin", "Estabelecimento", "store"],
  ["cliente", "Cliente", "user"],
  ["entregador", "Entregador", "bike"],
];

// Para cada perfil: qual campo da sessão guarda a escolha, o rótulo do select e as opções.
function configDoSeletor(perfil) {
  return {
    admin: ["companyId", "Empresa em demonstração", listarEmpresas().map((c) => [c.id, c.name + (c.active ? "" : " (inativa)")])],
    cliente: ["customerId", "Cliente em demonstração", listarClientes().map((c) => [c.id, c.name])],
    entregador: ["courierId", "Entregador em demonstração", listarEntregadores().map((c) => [c.id, `${c.name} · ${obterEmpresa(c.companyId)?.name ?? ""}${c.active ? "" : " (inativo)"}`])],
  }[perfil];
}

// No index (inicio: true) a barra aparece sempre no estado inicial: nenhum perfil marcado e sem seletor.
// Só a EXIBIÇÃO muda: a sessão continua no LocalStorage, e escolher um perfil de novo reaproveita as escolhas anteriores.
export function montarBarraDemo(container, { inicio = false } = {}) {
  const sessao = lerSessao();
  const perfilAtivo = inicio ? null : sessao.role;
  const config = configDoSeletor(perfilAtivo);

  const botoesPerfil = PERFIS.map(([perfil, rotulo, nomeIcone]) => `
    <button type="button" aria-pressed="${perfilAtivo === perfil}" data-perfil="${perfil}">
      <span data-icon="${nomeIcone}" data-size="16"></span> ${rotulo}
    </button>`).join("");

  // O <select> nasce vazio; as <option> são criadas com createElement logo abaixo.
  const seletorHTML = config ? `<select id="demo-seletor" aria-label="${config[1]}"></select>` : "";
  const aviso = armazenamentoOk ? "" : `<span class="badge b-amber">Armazenamento do navegador indisponível: dados não serão mantidos</span>`;

  container.innerHTML = `
    <div class="demo-in">
      <a class="home" href="${rotas.inicio()}" aria-label="Peddi — início">${marcaLogo(24)} Peddi</a>
      <span class="tag">Modo demonstração: troca de perfil, sem autenticação real</span>
      <div class="seg" role="group" aria-label="Perfil de demonstração">${botoesPerfil}</div>
      ${seletorHTML}
      <button type="button" class="dbtn" id="btn-tema"><span data-icon="moon" data-size="15"></span> Tema</button>
      <button type="button" class="dbtn" id="btn-reiniciar"><span data-icon="refresh" data-size="15"></span> Reiniciar dados</button>
      ${aviso}
    </div>`;

  // Select da empresa/cliente/entregador
  const seletor = container.querySelector("#demo-seletor");
  if (seletor) {
    const [campo, , opcoes] = config;
    preencherSelect(seletor, opcoes, sessao[campo]);
    seletor.addEventListener("change", () => {
      gravarSessao({ ...lerSessao(), [campo]: seletor.value });
      location.reload();
    });
  }

  // Botões de troca de perfil
  container.querySelectorAll("[data-perfil]").forEach((botao) => {
    botao.addEventListener("click", () => {
      gravarSessao({ ...lerSessao(), role: botao.dataset.perfil });
      navegar(rotaDoPerfil[botao.dataset.perfil]());
    });
  });

  container.querySelector("#btn-tema").addEventListener("click", alternarTema);

  container.querySelector("#btn-reiniciar").addEventListener("click", () => {
    if (confirm("Reiniciar dados de demonstração? Tudo o que foi feito neste navegador será substituído pelos dados iniciais.")) {
      reiniciarDados();
      location.assign(rotas.inicio());
    }
  });
}
