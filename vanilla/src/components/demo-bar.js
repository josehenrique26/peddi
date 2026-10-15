// src/components/demo-bar.js — barra de demonstração (troca de perfil, tema, reiniciar dados).
import { h } from "../utils/dom.js";
import { icone } from "./icon.js";
import { marcaLogo } from "./logo.js";
import { alternarTema } from "../utils/theme.js";
import { rotas, rotaDoPerfil, navegar } from "../utils/routes.js";
import { armazenamentoOk, lerSessao, gravarSessao, reiniciarDados } from "../services/storage.js";
import { listarEmpresas, listarClientes, listarEntregadores, obterEmpresa } from "../services/companies.js";

const PERFIS = [
  ["admin", "Estabelecimento", "store"],
  ["cliente", "Cliente", "user"],
  ["entregador", "Entregador", "bike"],
];

// Seletor da entidade em demonstração (empresa, cliente ou entregador), conforme o perfil atual.
function seletorDaEntidade(sessao) {
  const config = {
    admin: ["companyId", "Empresa em demonstração", listarEmpresas().map((c) => [c.id, c.name + (c.active ? "" : " (inativa)")])],
    cliente: ["customerId", "Cliente em demonstração", listarClientes().map((c) => [c.id, c.name])],
    entregador: ["courierId", "Entregador em demonstração", listarEntregadores().map((c) => [c.id, `${c.name} · ${obterEmpresa(c.companyId)?.name ?? ""}${c.active ? "" : " (inativo)"}`])],
  }[sessao.role];
  if (!config) return null;

  const [campo, rotulo, opcoes] = config;
  return h("select", {
    "aria-label": rotulo,
    onchange: (e) => gravarSessao({ ...lerSessao(), [campo]: e.target.value }),
  }, opcoes.map(([valor, texto]) => h("option", { value: valor, selected: valor === sessao[campo] }, texto)));
}

export function montarBarraDemo(container) {
  const sessao = lerSessao();

  const botoesPerfil = PERFIS.map(([perfil, rotulo, nomeIcone]) =>
    h("button", {
      type: "button",
      "aria-pressed": String(sessao.role === perfil),
      onclick: () => { gravarSessao({ ...lerSessao(), role: perfil }); navegar(rotaDoPerfil[perfil]()); },
    }, icone(nomeIcone, 16), rotulo));

  container.replaceChildren(
    h("div", { class: "demo-in" },
      h("a", { class: "home", href: rotas.inicio(), "aria-label": "Peddi — início" }, marcaLogo(24), " Peddi"),
      h("span", { class: "tag" }, "Modo demonstração: troca de perfil, sem autenticação real"),
      h("div", { class: "seg", role: "group", "aria-label": "Perfil de demonstração" }, botoesPerfil),
      seletorDaEntidade(sessao),
      h("button", { type: "button", class: "dbtn", onclick: alternarTema }, icone("moon", 15), "Tema"),
      h("button", {
        type: "button", class: "dbtn",
        onclick: () => {
          // Provisório: window.confirm. Será trocado pelo componente modal.js.
          if (confirm("Reiniciar dados de demonstração? Tudo o que foi feito neste navegador será substituído pelos dados iniciais.")) {
            reiniciarDados();
            location.assign(rotas.inicio());
          }
        },
      }, icone("refresh", 15), "Reiniciar dados"),
      armazenamentoOk ? null : h("span", { class: "badge b-amber" }, "Armazenamento do navegador indisponível: dados não serão mantidos"),
    ),
  );
}
