/**
 * ========================================
 * CONFIGURATION DE L'API
 * ========================================
 * 
 * Ce fichier contient les URLs de l'API backend
 * et les configurations associées.
 */

// URL de base de l'API
const API_BASE_URL = "https://backentinvema.onrender.com";

// URL de l'API
const API_URL = `${API_BASE_URL}/api`;

// URL pour les images
const API_URL_IMG = API_BASE_URL;

/**
 * Configuration des endpoints de l'API
 */
const API_ENDPOINTS = {
    // Authentification
    auth: {
        login: `${API_URL}/auth/login`,
        register: `${API_URL}/auth/register`,
        logout: `${API_URL}/auth/logout`,
        refresh: `${API_URL}/auth/refresh`,
        verifyToken: `${API_URL}/auth/verify`
    },

    // Utilisateurs
    users: {
        base: `${API_URL}/users`,
        byId: (id) => `${API_URL}/users/${id}`,
        current: `${API_URL}/users/me`,
        update: (id) => `${API_URL}/users/${id}`,
        delete: (id) => `${API_URL}/users/${id}`
    },

    // Produits
    products: {
        base: `${API_URL}/products`,
        byId: (id) => `${API_URL}/products/${id}`,
        create: `${API_URL}/products`,
        update: (id) => `${API_URL}/products/${id}`,
        delete: (id) => `${API_URL}/products/${id}`,
        search: `${API_URL}/products/search`,
        byCategory: (categoryId) => `${API_URL}/products/category/${categoryId}`
    },

    // Catégories
    categories: {
        base: `${API_URL}/categories`,
        byId: (id) => `${API_URL}/categories/${id}`,
        create: `${API_URL}/categories`,
        update: (id) => `${API_URL}/categories/${id}`,
        delete: (id) => `${API_URL}/categories/${id}`
    },

    // Fournisseurs
    suppliers: {
        base: `${API_URL}/supplier`,
        byId: (id) => `${API_URL}/supplier/${id}`,
        create: `${API_URL}/supplier`,
        update: (id) => `${API_URL}/supplier/${id}`,
        delete: (id) => `${API_URL}/supplier/${id}`
    },

    // Requêtes/Demandes
    requests: {
        base: `${API_URL}/requests`,
        byId: (id) => `${API_URL}/requests/${id}`,
        create: `${API_URL}/requests`,
        update: (id) => `${API_URL}/requests/${id}`,
        approve: (id) => `${API_URL}/requests/${id}/approve`,
        reject: (id) => `${API_URL}/requests/${id}/reject`,
        delete: (id) => `${API_URL}/requests/${id}`
    },

    // Commandes
    orders: {
        base: `${API_URL}/orders`,
        byId: (id) => `${API_URL}/orders/${id}`,
        create: `${API_URL}/orders`,
        update: (id) => `${API_URL}/orders/${id}`,
        delete: (id) => `${API_URL}/orders/${id}`,
        updateStatus: (id) => `${API_URL}/orders/${id}/status`
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
 * @returns {Object} Headers complétés avec le token si disponible
 */
function getAuthHeaders(additionalHeaders = {}) {
    const token = getAuthToken();
    const headers = { ...DEFAULT_HEADERS, ...additionalHeaders };

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
        return Date.now() < expiration;
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        return false;
    }
}

/**
 * Fonction pour déconnecter l'utilisateur
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = '/login.html';
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
    logout,
    buildUrlWithParams
};

// Export par défaut (pour compatibilité)
export default {
    API_URL,
    API_URLimg: API_URL_IMG,
    API_BASE_URL,
    ENDPOINTS: API_ENDPOINTS
};