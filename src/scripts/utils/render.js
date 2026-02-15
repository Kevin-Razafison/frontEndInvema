/**
 * ========================================
 * RENDER.JS - AVEC WAIT STATE
 * ========================================
 * 
 * Affiche un loader pendant la navigation
 */

import { views } from "../route/route.js";
import { activateCategorieButton, activateCategoryCard } from "../views/categories.views.js";
import { activateFournisseursButton, addFournisseur } from "../views/fournisseurs.views.js";
import { addUsers, activeDeleteButton, filter, modifyButton } from "../views/gestionUtilisateur.views.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { activateProductListEvents } from "../views/productList.views.js";
import { previousButton, modifierButton, SupprimerButton } from "./renderFournisseur.js";
import { modifierProductButton, SupprimerProductButton, previousProductButton } from "./renderProducInfo.js";

// État du routeur
let currentRoute = '';
let isRendering = false;

/**
 * Affiche un loader pendant le chargement
 */
function showLoadingState(main) {
    main.innerHTML = `
        <div class="wait-screen">
            <div class="loader-container">
                <div class="loader">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="loading-text">Chargement...</div>
            </div>
        </div>
    `;
}

/**
 * Rend une route dans le main
 */
export async function render(route, id = 0) {
    // Éviter les rechargements
    const fullRoute = id ? `${route}?id=${id}` : route;
    if (currentRoute === fullRoute && !isRendering) {
        console.log('🔄 Route déjà chargée:', fullRoute);
        return;
    }

    // Empêcher rendus concurrents
    if (isRendering) {
        console.log('⏳ Rendu en cours, skip...');
        return;
    }

    isRendering = true;
    currentRoute = fullRoute;

    // Vérifier token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/index.html";
        isRendering = false;
        return;
    }

    let payload;
    try {
        payload = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
        console.error("❌ Token invalide");
        localStorage.removeItem("token");
        window.location.href = "/index.html";
        isRendering = false;
        return;
    }

    const main = document.getElementById("main");
    if (!main) {
        isRendering = false;
        return;
    }

    // Afficher le loader
    showLoadingState(main);

    const view = views[route];
    if (!view) {
        main.innerHTML = `
            <div class="error-404">
                <h1>404</h1>
                <p>Page non trouvée</p>
                <button onclick="window.location.hash='#/dashboard'">Retour au dashboard</button>
            </div>
        `;
        isRendering = false;
        return;
    }

    try {
        // Routes selon rôle
        if (payload.role === "ADMIN" || payload.role === "MAGASINIER") {
            await renderAdminRoute(route, id, view, main);
        } else if (payload.role === "EMPLOYE") {
            await renderEmployeRoute(route, id, view, main);
        }
    } catch (error) {
        console.error("❌ Erreur rendu:", error);
        main.innerHTML = `
            <div class="error-state">
                <h2>❌ Erreur de chargement</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Recharger</button>
            </div>
        `;
    } finally {
        isRendering = false;
    }
}

/**
 * Routes ADMIN/MAGASINIER
 */
async function renderAdminRoute(route, id, view, main) {
    switch (route) {
        case "#/categories":
            main.innerHTML = await view();
            await activateCategorieButton();
            activateCategoryCard();
            break;

        case "#/dashboard":
        case "#/":
            main.innerHTML = await view();
            interactiveNavBar();
            break;

        case "#/fournisseurs/pannel":
            main.innerHTML = await view(id);
            previousButton();
            await modifierButton();
            await SupprimerButton();
            break;

        case "#/utilisateur":
            main.innerHTML = await view();
            addUsers();
            modifyButton();
            activeDeleteButton();
            filter("ADMIN", "admin-filter");
            filter("EMPLOYE", "employe-filter");
            filter("ALL", "all-filter");
            break;

        case "#/productList":
            main.innerHTML = await view();
            setTimeout(() => {
                activateProductListEvents();
            }, 100);
            break;

        case "#/productList/Pannel":
            main.innerHTML = await view(id);
            modifierProductButton();
            SupprimerProductButton();
            previousProductButton();
            break;

        case "#/commandes":
            main.innerHTML = await view();
            break;

        case "#/fournisseurs":
            main.innerHTML = await view();
            await addFournisseur();
            activateFournisseursButton();
            interactiveNavBar();
            break;

        default:
            main.innerHTML = view();
    }
}

/**
 * Routes EMPLOYE
 */
async function renderEmployeRoute(route, id, view, main) {
    switch (route) {
        case "#/simpleUser":
            main.innerHTML = await view();
            setTimeout(() => {
                activateProductListEvents();
            }, 100);
            break;

        case "#/productList/Pannel":
            main.innerHTML = await view(id);
            previousProductButton();
            break;

        default:
            main.innerHTML = view();
    }
}

/**
 * Extrait l'ID de l'URL
 */
function getIdFromHash(hash) {
    const params = new URLSearchParams(hash.split("?")[1]);
    return parseInt(params.get("id") || 0);
}

/**
 * Initialise le routeur
 */
export function initRouter() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/index.html";
        return;
    }

    let payload;
    try {
        payload = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
        console.error("❌ Token invalide");
        localStorage.removeItem("token");
        window.location.href = "/index.html";
        return;
    }

    async function loadRoute() {
        let hash = window.location.hash;

        // Route par défaut
        if (!hash || hash === '#/') {
            hash = payload.role === "ADMIN" || payload.role === "MAGASINIER" 
                ? "#/dashboard" 
                : "#/simpleUser";
            window.location.hash = hash;
            return;
        }

        // Extraire route et ID
        const routePart = hash.split('?')[0];
        const id = getIdFromHash(hash);

        console.log('📍 Navigation vers:', routePart, id ? `(ID: ${id})` : '');

        // Rendre
        await render(routePart, id);
    }

    // Init navbar
    interactiveNavBar();

    // Écouter changements
    window.addEventListener("hashchange", loadRoute);

    // Charger route initiale
    loadRoute();
}

export function renderSection(className = "", htmlElement = "") {
    return `
        <section ${className ? `class="${className}"` : ""}>
            ${htmlElement}
        </section>
    `;
}

export function resetRouter() {
    currentRoute = '';
    isRendering = false;
}