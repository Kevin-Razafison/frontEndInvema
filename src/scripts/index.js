// index.js corrigé
import { interactiveNavBar } from "./views/NavBar.views.js";
import { initRouter } from "./utils/render.js";
import { logout } from "./logout/logout.js";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

// Redirection si non connecté
if (!token) {
  window.location.replace("./login.html");
} else {
  // Vérifier que l'utilisateur a le droit d'être sur cette page
  if (role !== "ADMIN" && role !== "MAGASINIER") {
    // Rediriger vers l'espace employé
    window.location.replace("./user.html");
  } else {
    // Lancer le routeur (il chargera la route en fonction du hash)
    initRouter();
    // Activer la navigation latérale
    interactiveNavBar();

    // Gestion du bouton de déconnexion
    const logoutBtn = document.querySelector(".logout-button");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  }
}