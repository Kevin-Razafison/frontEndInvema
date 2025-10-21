import { interactiveNavBar } from "./views/NavBar.views.js";
import { render} from "./utils/render.js";
import { initRouter } from "./utils/render.js";
import { logout } from "./logout/logout.js";
// plus tard


const token = localStorage.getItem("token");
render("#/dashboard");
initRouter();
interactiveNavBar();

const playload = JSON.parse(atob(token.split(".")[1]));

if(playload.role === "ADMIN"){
    window.addEventListener("popstate", ()=> render('#/'));
}
else if(playload.role === "EMPLOYE"){
    window.addEventListener("popstate", ()=> render('#/simpleUser'));
}

  const logoutBtn = document.querySelector(".logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }