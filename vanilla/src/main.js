// Ponto de entrada e roteamento: lê a hash da URL (#/menu) e chama a função da tela correspondente.
import { renderHome } from "./pages/home.js";
import { renderMenu } from "./pages/menu.js";
import { renderCart } from "./pages/cart.js";
import { renderOrders } from "./pages/orders.js";
import { renderAdminMenu } from "./pages/admin-menu.js";
import { renderAdminOrders } from "./pages/admin-orders.js";
import { renderCourierAvailable } from "./pages/courier-available.js";
import { renderCourierTrip } from "./pages/courier-trip.js";

import "./styles/main.css";

const routes = {
  "#/": renderCourierAvailable, // Padrão aponta para a tela do entregador enquanto a home não é implementada
  "#/home": renderHome,
  "#/menu": renderMenu,
  "#/cart": renderCart,
  "#/orders": renderOrders,
  "#/admin/menu": renderAdminMenu,
  "#/admin/orders": renderAdminOrders,
  "#/courier/available": renderCourierAvailable,
  "#/courier/trip": renderCourierTrip,
};

function navigate() {
  const render = routes[location.hash || "#/"] ?? renderCourierAvailable;
  render(document.getElementById("app"));
}

window.addEventListener("hashchange", navigate);
navigate();
