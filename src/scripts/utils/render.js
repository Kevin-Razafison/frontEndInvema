import { views } from "../route/route.js";
import { activateCategorieButton, activateCategoryCard } from "../views/categories.views.js";
import { CommandePannelUpdate } from "../views/commandes.views.js";
import { activateFournisseursButton, addFournisseur } from "../views/fournisseurs.views.js";
import { addUsers, activeDeleteButton, filter, modifyButton } from "../views/gestionUtilisateur.views.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import {  activateAjouterProductButton, activateProductFilter, activateProductDeleteButton, activateProductSearch, activateProductCardEvent } from "../views/productList.views.js";
import { previousButton, modifierButton, SupprimerButton } from "./renderFournisseur.js";
import { modifierProductButton, SupprimerProductButton, previousProductButton } from "./renderProducInfo.js";

export function render(route, id = 0) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "#/login";
    return;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    console.error("Token invalide :", err);
    localStorage.removeItem("token");
    window.location.href = "#/login";
    return;
  }

  const main = document.getElementById("main");
  const view = views[route];

  if (!view) {
    main.innerHTML = `<h1>404</h1><p>Page non trouvée</p>`;
    return;
  }

  if (payload.role === "ADMIN") {
    if (route === "#/categories") {
      (async () => {
        main.innerHTML = await view();
        await activateCategorieButton();
        activateCategoryCard();
      })();
    } 
    else if (route === "#/dashboard" || route==="#/") {
      (async () => {
        main.innerHTML = await view(); 
        interactiveNavBar();
      })();
    }
    else if (route === "#/fournisseurs/pannel") {
      (async () => {
        main.innerHTML = await view(id);
        previousButton();
        await modifierButton();
        await SupprimerButton();
      })();
    } 
    else if(route === "#/utilisateur"){
      main.innerHTML = view();
      addUsers();
      modifyButton();
      activeDeleteButton();
      filter("ADMIN","admin-filter");
      filter("EMPLOYE","employe-filter");
      filter("ALL", "all-filter");
    }
    else if(route === "#/productList"){
      (async ()=> {
        main.innerHTML = await view();
        await activateProductSearch();
        activateAjouterProductButton();
        activateProductFilter();
        activateProductCardEvent()
        interactiveNavBar();
      })();
    }
    else if(route === "#/productList/Pannel"){
      (async ()=> {
        main.innerHTML = await view();
        modifierProductButton();
        SupprimerProductButton();
        previousProductButton();      
      })();
    }
    else if (route === "#/commandes") {
    (async () => {
        main.innerHTML = await view(); 
        CommandePannelUpdate();
      })();
    }
    else if(route === "#/fournisseurs") {
      (async ()=> {
        setTimeout(async()=>main.innerHTML = await view(),0);
        setTimeout(async()=> await addFournisseur(),0);
        setTimeout(()=>activateFournisseursButton()); 
        interactiveNavBar();
      })();
    }
    else{
      main.innerHTML = view();
    }
  } 
  else if (payload.role === "EMPLOYE") {
    if (route === "#/simpleUser") {
        (async ()=> {
        main.innerHTML = await view();
        activateAjouterProductButton();
        activateProductFilter();
        activateProductCardEvent()
        interactiveNavBar();
      })();
    }
      else if(route === "#/productList/Pannel"){
      (async ()=> {
        main.innerHTML = await view();
        SupprimerProductButton();
        previousProductButton();      
      })();
    }
  }
}

function getIdFromHash(hash) {
  const params = new URLSearchParams(hash.split("?")[1]);
  return parseInt(params.get("id") || 0);
}

export function initRouter() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "#/login";
    return;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    console.error("Token invalide :", err);
    localStorage.removeItem("token");
    window.location.href = "#/login";
    return;
  }

  function loadRoute() {
    let hash = window.location.hash;

    if (!hash) {
      hash = payload.role === "ADMIN" ? "#/dashboard" : "#/simpleUser";
      window.location.hash = hash;
    }

    const id = getIdFromHash(hash);
    render(hash, id);
  }

  // ✅ Initialise la nav bar une seule fois
  interactiveNavBar();

  window.addEventListener("hashchange", loadRoute);
  document.addEventListener("DOMContentLoaded", loadRoute);

  loadRoute();
}



export function renderSection(className = "", htmlElement = "") {
  return `
    <section ${className ? `class="${className}"` : ""}>
      ${htmlElement}
    </section>
  `;
}
