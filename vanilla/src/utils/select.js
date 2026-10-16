// src/utils/select.js — preenche um <select> com <option> criadas via createElement.
// opcoes = [[valor, texto], [valor, texto], ...]
export function preencherSelect(select, opcoes, selecionado = null) {
  select.replaceChildren();
  for (const [valor, texto] of opcoes) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = texto;
    opcao.selected = valor === selecionado;
    select.append(opcao);
  }
}
