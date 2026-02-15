
import { views } from "../route/route.js";
import { activateCategorieButton, activateCategoryCard } from "../views/categories.views.js";
import { activateFournisseursButton, addFournisseur } from "../views/fournisseurs.views.js";
import { addUsers, activeDeleteButton, filter, modifyButton } from "../views/gestionUtilisateur.views.js";
import { interactiveNavBar } from "../views/NavBar.views.js";
import { 
    activateAjouterProductButton, 
    activateProductFilter, 
    activateProductDeleteButton, 
    activateProductSearch, 
    activateProductCardEvent, 
    activateProductListEvents 
} from "../views/productList.views.js";
import { previousButton, modifierButton, SupprimerButton } from "./renderFournisseur.js";
import { modifierProductButton, SupprimerProductButton, previousProductButton } from "./renderProducInfo.js";

// État du routeur pour éviter les rechargements
let currentRoute = '';
let isRendering = false;

/**
 * Rend une route dans le main
 */
export async function render(route, id = 0) {
    // Éviter les rechargements de la même route
    const fullRoute = id ? `${route}?id=${id}` : route;
    if (currentRoute === fullRoute && !isRendering) {
        console.log('🔄 Route déjà chargée:', fullRoute);
        return;
    }

    // Empêcher les rendus concurrents
    if (isRendering) {
        console.log('⏳ Rendu en cours, annulation...');
        return;
    }

    isRendering = true;
    currentRoute = fullRoute;

    // Vérifier le token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "#/login";
        isRendering = false;
        return;
    }

    let payload;
    try {
        payload = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
        console.error("❌ Token invalide :", err);
        localStorage.removeItem("token");
        window.location.href = "#/login";
        isRendering = false;
        return;
    }

    const main = document.getElementById("main");
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
        // Routes ADMIN et MAGASINIER
        if (payload.role === "ADMIN" || payload.role === "MAGASINIER") {
            await renderAdminRoute(route, id, view, main);
        } 
        // Routes EMPLOYE
        else if (payload.role === "EMPLOYE") {
            await renderEmployeRoute(route, id, view, main);
        }
    } catch (error) {
        console.error("❌ Erreur lors du rendu:", error);
        main.innerHTML = `
            <div class="error-state">
                <h2>Erreur de chargement</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Recharger</button>
            </div>
        `;
    } finally {
        isRendering = false;
    }
}

/**
 * Rend les routes pour ADMIN/MAGASINIER
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
            // Attacher tous les événements des produits
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
 * Rend les routes pour EMPLOYE
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
        window.location.href = "#/login";
        return;
    }

    let payload;
    try {
        payload = JSON.parse(atob(token.split(".")[1]));
    } catch (err) {
        console.error("❌ Token invalide :", err);
        localStorage.removeItem("token");
        window.location.href = "#/login";
        return;
    }

    /**
     * Charge une route
     */
    async function loadRoute() {
        let hash = window.location.hash;

        // Route par défaut selon le rôle
        if (!hash || hash === '#/') {
            hash = payload.role === "ADMIN" || payload.role === "MAGASINIER" 
                ? "#/dashboard" 
                : "#/simpleUser";
            window.location.hash = hash;
            return; // Le hashchange va déclencher le chargement
        }

        // Extraire la route et l'ID
        const routePart = hash.split('?')[0];
        const id = getIdFromHash(hash);

        console.log('📍 Navigation vers:', routePart, id ? `(ID: ${id})` : '');

        // Rendre la route
        await render(routePart, id);
    }

    // Initialiser la navbar
    interactiveNavBar();

    // Écouter les changements de route
    window.addEventListener("hashchange", loadRoute);

    // Charger la route initiale
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