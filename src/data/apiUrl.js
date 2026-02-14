/**
 * ========================================
 * CONFIGURATION DE L'API - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Mise à jour pour correspondre aux nouvelles routes backend
 */

// URL de base de l'API
const API_BASE_URL = "https://backentinvema.onrender.com";

// URL de l'API
const API_URL = `${API_BASE_URL}/api`;

// URL pour les images (Cloudinary maintenant)
const API_URL_IMG = API_BASE_URL;

/**
 * Configuration des endpoints de l'API (mis à jour)
 */
const API_ENDPOINTS = {
    // ========================================
    // AUTHENTIFICATION (routes améliorées)
    // ========================================
    auth: {
        login: `${API_URL}/auth/login`,
        me: `${API_URL}/auth/me`,              // ✅ NOUVEAU - Profil utilisateur
        logout: `${API_URL}/auth/logout`,      // ✅ NOUVEAU - Déconnexion
        refresh: `${API_URL}/auth/refresh`     // ✅ NOUVEAU - Rafraîchir token
    },

    // ========================================
    // UTILISATEURS
    // ========================================
    users: {
        base: `${API_URL}/users`,
        byId: (id) => `${API_URL}/users/${id}`,
        create: `${API_URL}/users`,
        update: (id) => `${API_URL}/users/${id}`,
        delete: (id) => `${API_URL}/users/${id}`
    },

    // ========================================
    // PRODUITS
    // ========================================
    products: {
        base: `${API_URL}/products`,
        byId: (id) => `${API_URL}/products/${id}`,
        create: `${API_URL}/products`,
        update: (id) => `${API_URL}/products/${id}`,
        delete: (id) => `${API_URL}/products/${id}`
    },

    // ========================================
    // CATÉGORIES
    // ========================================
    categories: {
        base: `${API_URL}/categories`,
        byId: (id) => `${API_URL}/categories/${id}`,
        create: `${API_URL}/categories`,
        update: (id) => `${API_URL}/categories/${id}`,
        delete: (id) => `${API_URL}/categories/${id}`
    },

    // ========================================
    // FOURNISSEURS
    // ========================================
    suppliers: {
        base: `${API_URL}/supplier`,
        byId: (id) => `${API_URL}/supplier/${id}`,
        create: `${API_URL}/supplier`,
        update: (id) => `${API_URL}/supplier/${id}`,
        delete: (id) => `${API_URL}/supplier/${id}`
    },

    // ========================================
    // REQUÊTES/DEMANDES (routes améliorées)
    // ========================================
    requests: {
        base: `${API_URL}/requests`,
        byId: (id) => `${API_URL}/requests/${id}`,
        create: `${API_URL}/requests`,
        update: (id) => `${API_URL}/requests/${id}`,
        updateStatus: (id) => `${API_URL}/requests/${id}/status`,  // ⚠️ CHANGÉ
        delete: (id) => `${API_URL}/requests/${id}`,
        stats: `${API_URL}/requests/stats`  // ✅ NOUVEAU - Statistiques
    },

    // ========================================
    // COMMANDES (routes améliorées)
    // ========================================
    orders: {
        base: `${API_URL}/orders`,
        byId: (id) => `${API_URL}/orders/${id}`,  // ✅ NOUVEAU
        create: `${API_URL}/orders`,
        update: (id) => `${API_URL}/orders/${id}`,
        updateStatus: (id) => `${API_URL}/orders/${id}/status`,
        delete: (id) => `${API_URL}/orders/${id}`,
        notifications: `${API_URL}/orders/notifications`
    }
};

/**
 * Configuration du timeout des requêtes (en millisecondes)
 */
const REQUEST_TIMEOUT = 30000; // 30 secondes

/**
 * Headers par défaut pour les requêtes
 */
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

/**
 * Fonction pour obtenir le token d'authentification
 * @returns {string|null} Le token JWT ou null si non connecté
 */
function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Fonction pour obtenir les headers avec authentification
 * @param {Object} additionalHeaders - Headers additionnels à ajouter
 * @param {boolean} isFormData - Si true, ne pas inclure Content-Type (pour FormData)
 * @returns {Object} Headers complétés avec le token si disponible
 */
function getAuthHeaders(additionalHeaders = {}, isFormData = false) {
    const token = getAuthToken();
    const headers = isFormData ? { ...additionalHeaders } : { ...DEFAULT_HEADERS, ...additionalHeaders };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Fonction pour vérifier si l'utilisateur est connecté
 * @returns {boolean} True si connecté, false sinon
 */
function isAuthenticated() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        // Vérifier si le token n'est pas expiré
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000; // Convertir en millisecondes
        
        if (Date.now() >= expiration) {
            console.warn('⏰ Token expiré');
            logout();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return false;
    }
}

/**
 * Fonction pour obtenir le rôle de l'utilisateur
 * @returns {string|null} Le rôle de l'utilisateur ou null
 */
function getUserRole() {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role;
    } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        return null;
    }
}

/**
 * Fonction pour obtenir l'ID de l'utilisateur
 * @returns {number|null} L'ID de l'utilisateur ou null
 */
function getUserId() {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ID:', error);
        return null;
    }
}

/**
 * Fonction pour déconnecter l'utilisateur
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = '/index.html';
}

/**
 * Fonction pour construire une URL avec des paramètres de requête
 * @param {string} baseUrl - URL de base
 * @param {Object} params - Paramètres de requête
 * @returns {string} URL complète avec paramètres
 */
function buildUrlWithParams(baseUrl, params = {}) {
    const url = new URL(baseUrl);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
}

/**
 * Fonction utilitaire pour faire des requêtes API avec gestion d'erreurs
 * @param {string} url - URL de la requête
 * @param {Object} options - Options fetch
 * @returns {Promise<Object>} Réponse JSON
 */
async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: getAuthHeaders(options.headers || {})
        });

        // Gérer les erreurs HTTP
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // ⚠️ NOUVEAU - Gérer les nouveaux codes d'erreur
            if (response.status === 401) {
                if (errorData.code === 'TOKEN_EXPIRED') {
                    console.warn('⏰ Session expirée');
                    logout();
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }
                if (errorData.code === 'TOKEN_INVALID') {
                    console.error('❌ Token invalide');
                    logout();
                    throw new Error('Authentification invalide.');
                }
            }

            if (response.status === 403) {
                throw new Error(errorData.error || 'Accès refusé. Permissions insuffisantes.');
            }

            throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('❌ Erreur API:', error);
        throw error;
    }
}

/**
 * Fonction pour rafraîchir le token
 * @returns {Promise<boolean>} True si succès, false sinon
 */
async function refreshToken() {
    try {
        const response = await fetch(API_ENDPOINTS.auth.refresh, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Impossible de rafraîchir le token');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('✅ Token rafraîchi avec succès');
        return true;

    } catch (error) {
        console.error('❌ Erreur rafraîchissement token:', error);
        logout();
        return false;
    }
}

// Export des constantes et fonctions
export {
    API_URL,
    API_URL_IMG,
    API_BASE_URL,
    API_ENDPOINTS,
    REQUEST_TIMEOUT,
    DEFAULT_HEADERS,
    getAuthToken,
    getAuthHeaders,
    isAuthenticated,
    getUserRole,
    getUserId,
    logout,
    buildUrlWithParams,
    apiFetch,
    refreshToken
};

// Export par défaut (pour compatibilité)
export default {
    API_URL,
    API_URLimg: API_URL_IMG,
    API_BASE_URL,
    ENDPOINTS: API_ENDPOINTS
};