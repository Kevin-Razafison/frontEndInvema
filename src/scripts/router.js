// ROUTER PRINCIPAL - CORRIGE LE PROBLÈME DU DASHBOARD QUI SE RECHARGE

let currentRoute = '';

export function initRouter() {
    // Fonction pour charger une route
    const loadRoute = async (route) => {
        // Éviter de recharger la même route
        if (currentRoute === route) {
            console.log('Route déjà chargée:', route);
            return;
        }

        console.log('Chargement de la route:', route);
        currentRoute = route;

        const main = document.querySelector('main');
        if (!main) return;

        // Afficher un loader
        main.innerHTML = '<div class="loading">Chargement...</div>';

        try {
            switch (route) {
                case '#/dashboard':
                case '#/':
                case '':
                    const { renderDashboard } = await import('./views/dashboard_views.js');
                    await renderDashboard();
                    break;

                case '#/categories':
                    const { categoriesPannel } = await import('./data/categoriesList.js');
                    await categoriesPannel();
                    break;

                case '#/productList':
                    const { ProductListPannel } = await import('./views/productList_views.js');
                    await ProductListPannel();
                    break;

                case '#/fournisseurs':
                    const { FournisseurPannel } = await import('./data/Fournisseurs.js');
                    await FournisseurPannel();
                    break;

                case '#/commandes':
                    const { CommandePannel } = await import('./views/commandes_views.js');
                    await CommandePannel();
                    break;

                case '#/utilisateur':
                    const { gestionUtilisateur } = await import('./views/gestionUtilisateur_views.js');
                    await gestionUtilisateur();
                    break;

                default:
                    if (route.startsWith('#/product/')) {
                        const productId = route.split('/')[2];
                        const { ProductInfoPannel } = await import('./data/product.js');
                        await ProductInfoPannel(productId);
                    } else {
                        main.innerHTML = '<h2>Page non trouvée</h2>';
                    }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la route:', error);
            main.innerHTML = '<h2>Erreur de chargement</h2>';
        }
    };

    // Charger la route initiale
    const initialRoute = window.location.hash || '#/dashboard';
    loadRoute(initialRoute);

    // Écouter les changements de route
    window.addEventListener('hashchange', () => {
        const newRoute = window.location.hash || '#/dashboard';
        loadRoute(newRoute);
    });
}