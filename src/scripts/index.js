import { interactiveNavBar } from "./views/NavBar.views.js";
import { render} from "./utils/render.js";
import { initRouter } from "./utils/render.js";
import { logout } from "./logout/logout.js";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) {
  // Pas connecté → redirige vers login
  window.location.replace("./login.html");
} else {
  // Déjà connecté → selon le rôle
  if (role === "ADMIN") {
    // Laisse le sur index.html (dashboard admin)
    console.log("Bienvenue Admin");
  } else {
    // Autre rôle → redirige vers user.html
    window.location.replace("./user.html");
  }
}

render("#/dashboard");
initRouter();
interactiveNavBar();

const payload = JSON.parse(atob(token.split(".")[1]));

if(payload.role === "ADMIN"){
    window.addEventListener("popstate", ()=> render('#/'));
}
else if(payload.role === "EMPLOYE"){
    window.addEventListener("popstate", ()=> render('#/simpleUser'));
}

const logoutBtn = document.querySelector(".logout-button");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}