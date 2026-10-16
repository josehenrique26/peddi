// vite.config.js — configuração do Vite. Cada tela nova (.html) entra na lista "input".
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  // No GitHub Pages o site fica em /peddi/; no npm run dev fica na raiz.
  base: command === "build" ? "/peddi/" : "/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        entregador: resolve(import.meta.dirname, "entregador.html"),
        // loja: resolve(import.meta.dirname, "loja.html"),
        // pedidos: resolve(import.meta.dirname, "pedidos.html"),
      },
    },
  },
}));
