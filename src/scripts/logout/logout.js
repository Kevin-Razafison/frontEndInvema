/**
 * ========================================
 * MODULE DE DÉCONNEXION - AMÉLIORÉ
 * ========================================
 * 
 * Gestion sécurisée de la déconnexion avec :
 * - Confirmation utilisateur
 * - Nettoyage complet des données
 * - Animation de sortie
 * - Redirection sécurisée
 */

/**
 * Déconnecte l'utilisateur de l'application
 * @param {boolean} skipConfirmation - Sauter la confirmation (pour auto-logout)
 */
export function logout(skipConfirmation = false) {
    // Demander confirmation sauf si déconnexion automatique
    if (!skipConfirmation) {
        const confirmLogout = confirm("Voulez-vous vraiment vous déconnecter ?");
        if (!confirmLogout) return;
    }

    try {
        // Afficher un indicateur de chargement
        showLogoutLoader();

        // Nettoyer toutes les données de session
        clearAuthData();

        // Nettoyer le cache si disponible
        clearCacheData();

        // Afficher un message de succès
        showLogoutSuccess();

        // Rediriger après un court délai (pour l'UX)
        setTimeout(() => {
            redirectToLogin();
        }, 500);

    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        // Même en cas d'erreur, on déconnecte quand même
        redirectToLogin();
    }
}

/**
 * Nettoie toutes les données d'authentification
 */
function clearAuthData() {
    // Supprimer le token et les informations utilisateur
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    // Supprimer les données de session
    sessionStorage.clear();

    console.log('✅ Données d\'authentification supprimées');
}

/**
 * Nettoie les données en cache
 */
function clearCacheData() {
    try {
        // Supprimer les données en cache (produits, catégories, etc.)
        const keysToKeep = ['theme', 'language', 'viewPreference'];
        
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });

        console.log('✅ Cache nettoyé');
    } catch (error) {
        console.warn('⚠️ Impossible de nettoyer le cache:', error);
    }
}

/**
 * Affiche un loader pendant la déconnexion
 */
function showLogoutLoader() {
    const loader = document.createElement('div');
    loader.id = 'logout-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        z-index: 99999;
        gap: 20px;
    `;
    
    loader.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 4px solid #ecf0f1;
            border-top-color: #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="
            font-size: 16px;
            color: #2c3e50;
            font-weight: 600;
        ">Déconnexion en cours...</p>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(loader);
}

/**
 * Affiche un message de succès
 */
function showLogoutSuccess() {
    const loader = document.getElementById('logout-loader');
    if (loader) {
        loader.innerHTML = `
            <div style="
                width: 60px;
                height: 60px;
                background: #27ae60;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                color: white;
            ">✓</div>
            <p style="
                font-size: 16px;
                color: #27ae60;
                font-weight: 600;
            ">Déconnexion réussie !</p>
        `;
    }
}

/**
 * Redirige vers la page de connexion
 */
function redirectToLogin() {
    // Utiliser replace pour éviter le retour arrière
    window.location.replace("./login.html");
}

/**
 * Déconnexion automatique (expiration de session)
 * @param {string} reason - Raison de la déconnexion automatique
 */
export function autoLogout(reason = "Session expirée") {
    console.warn(`⚠️ Déconnexion automatique: ${reason}`);
    
    // Afficher une notification
    showNotification(reason, 'warning');
    
    // Déconnexion sans confirmation
    logout(true);
}

/**
 * Affiche une notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <style>
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
        ${getNotificationIcon(type)} ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Retourne la couleur selon le type de notification
 */
function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    return colors[type] || colors.info;
}

/**
 * Retourne l'icône selon le type de notification
 */
function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

/**
 * Vérifie et gère l'expiration du token
 */
export function checkTokenExpiration() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return false;
    }
    
    try {
        // Décoder le token JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000; // Convertir en millisecondes
        const now = Date.now();
        
        // Vérifier si le token est expiré
        if (now >= expiration) {
            autoLogout('Votre session a expiré');
            return false;
        }
        
        // Alerter si le token expire dans moins de 5 minutes
        const fiveMinutes = 5 * 60 * 1000;
        if (expiration - now < fiveMinutes) {
            showNotification('Votre session expire bientôt', 'warning');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du token:', error);
        autoLogout('Token invalide');
        return false;
    }
}

/**
 * Initialise la vérification périodique du token
 */
export function initTokenCheck() {
    // Vérifier toutes les minutes
    setInterval(checkTokenExpiration, 60000);
    
    // Vérification initiale
    checkTokenExpiration();
}

// Export par défaut
export default {
    logout,
    autoLogout,
    checkTokenExpiration,
    initTokenCheck
};