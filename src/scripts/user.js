/**
 * ========================================
 * INTERFACE UTILISATEUR - PAGE USER
 * ========================================
 * 
 * Ce fichier gère l'interface utilisateur pour les utilisateurs non-admin :
 * - Affichage de la liste des produits
 * - Création de demandes/requêtes
 * - Gestion du modal de requête
 */

import { API_URL, isAuthenticated, getImageUrl, getUserRole } from '../data/apiUrl.js';
import { fetchProducts } from '../data/product.js';
import { createRequest } from '../data/request.js';

// ========================================
// VÉRIFICATION DE L'AUTHENTIFICATION
// ========================================

/**
 * Vérifie l'authentification et redirige si nécessaire
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    
    if (!token || !isAuthenticated()) {
        console.warn('⚠️ Utilisateur non authentifié');
        window.location.replace('./login.html');
        return false;
    }

    const role = localStorage.getItem('role');
    
    // Si l'utilisateur est admin, le rediriger vers le dashboard admin
    if (role === 'ADMIN') {
        console.log('🔄 Redirection vers le dashboard admin');
        window.location.replace('./index.html#/');
        return false;
    }

    return true;
}

// Vérifier l'authentification au chargement
if (!checkAuthentication()) {
    throw new Error('Authentification requise');
}

// ========================================
// ÉLÉMENTS DOM
// ========================================

const addRequestBtn = document.querySelector('.add-request');
const mainContainer = document.getElementById('main');
const logoutButton = document.querySelector('.logout-button');

// ========================================
// GESTION DE LA DÉCONNEXION
// ========================================

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        const confirmed = confirm('Voulez-vous vraiment vous déconnecter ?');
        if (confirmed) {
            localStorage.clear();
            window.location.href = './login.html';
        }
    });
}

// ========================================
// AFFICHAGE DES PRODUITS
// ========================================

/**
 * Affiche la liste des produits dans l'interface utilisateur
 */
async function displayProducts() {
    if (!mainContainer) {
        console.error('❌ Container principal non trouvé');
        return;
    }

    try {
        // Afficher un indicateur de chargement
        showLoadingSpinner();

        // Récupérer les produits
        const products = await fetchProducts();

        if (!products || products.length === 0) {
            showEmptyState();
            return;
        }

        // Créer le HTML pour la liste des produits
        const html = `
            <div class="categorie-product-list-pannel">
                <h1 class="product-list-title-pannel">Catalogue des Produits</h1>
                
                <input 
                    type="search" 
                    class="search-bar" 
                    placeholder="🔍 Rechercher un produit..."
                    id="product-search"
                />
                
                <div class="categorie-product-list-filter">
                    <label>
                        <span>Catégorie</span>
                        <select id="category-filter">
                            <option value="">Toutes les catégories</option>
                        </select>
                    </label>
                    
                    <label>
                        <span>Disponibilité</span>
                        <select id="availability-filter">
                            <option value="">Tous</option>
                            <option value="available">Disponible</option>
                            <option value="low">Stock faible</option>
                            <option value="out">Indisponible</option>
                        </select>
                    </label>
                </div>
                
                <div class="product-list-container" id="products-container">
                    ${renderProductCards(products)}
                </div>
            </div>
        `;

        mainContainer.innerHTML = html;

        // Remplir les options de catégories
        await populateCategoryFilter();

        // Initialiser les filtres
        initializeFilters();

        // Attacher les événements
        attachProductCardEvents();

    } catch (error) {
        console.error('❌ Erreur lors de l\'affichage des produits:', error);
        showErrorState('Impossible de charger les produits');
    }
}

/**
 * Remplit le filtre de catégories
 */
async function populateCategoryFilter() {
    try {
        const { categorieList } = await import('../data/categoriesList.js');
        const categories = await categorieList();
        const select = document.getElementById('category-filter');
        if (select) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Erreur chargement catégories:', err);
    }
}

/**
 * Génère le HTML pour les cartes de produits
 * @param {Array} products - Liste des produits
 * @returns {string} HTML des cartes
 */
function renderProductCards(products) {
    return products.map(product => {
        const availability = getProductAvailability(product);
        const imageUrl = getImageUrl(product.imageUrl) || './src/images/placeholder.png';

        return `
            <div class="product-list-card" data-product-id="${product.id}">
                <div class="availability-badge ${availability.class}">
                    ${availability.label}
                </div>
                
                <div class="image-container">
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.src='./src/images/placeholder.png'">
                    <div class="request-overlay">Demander</div>
                </div>
                
                <div class="card-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-details">
                        <div class="detail-row">
                            <span class="label">Catégorie</span>
                            <span class="value">${product.category?.name || 'N/A'}</span>
                        </div>
                        <div class="detail-row price">
                            <span class="label">Prix</span>
                            <span class="value">Ar ${formatPrice(product.price)}</span>
                        </div>
                        <div class="detail-row quantity">
                            <span class="label">En stock</span>
                            <span class="value">${product.quantity || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Détermine la disponibilité d'un produit
 * @param {Object} product - Produit
 * @returns {Object} Informations de disponibilité
 */
function getProductAvailability(product) {
    const quantity = product.quantity || 0;
    const threshold = product.alertLevel || 10;

    if (quantity === 0) {
        return { class: 'unavailable', label: 'Indisponible' };
    } else if (quantity <= threshold) {
        return { class: 'low', label: 'Stock faible' };
    } else {
        return { class: 'available', label: 'Disponible' };
    }
}

/**
 * Formate un prix
 * @param {number} price - Prix à formater
 * @returns {string} Prix formaté
 */
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price || 0);
}

// ========================================
// GESTION DU MODAL DE REQUÊTE
// ========================================

/**
 * Ouvre le modal pour créer une requête
 * @param {number} [productId] - ID du produit pré-sélectionné (optionnel)
 */
async function openRequestModal(productId = null) {
    // Supprimer un modal existant s'il y en a un
    closeRequestModal();

    try {
        // Récupérer la liste des produits
        const products = await fetchProducts();

        // Créer le modal
        const modal = document.createElement('div');
        modal.classList.add('request-popup');
        
        modal.innerHTML = `
            <div class="popup-content">
                <h3>📝 Nouvelle Demande</h3>
                
                <label>
                    <span>Produit *</span>
                    <select id="request-productId" required>
                        <option value="">-- Sélectionner un produit --</option>
                        ${products.map(p => `
                            <option value="${p.id}" ${p.id === productId ? 'selected' : ''}>
                                ${p.name} (Stock: ${p.quantity})
                            </option>
                        `).join('')}
                    </select>
                </label>
                
                <label>
                    <span>Quantité *</span>
                    <input 
                        type="number" 
                        id="request-quantity" 
                        min="1" 
                        placeholder="Quantité demandée"
                        required
                    />
                </label>
                
                <label>
                    <span>Raison de la demande *</span>
                    <textarea 
                        id="request-reason" 
                        placeholder="Expliquez pourquoi vous avez besoin de ce produit..."
                        rows="4"
                        required
                    ></textarea>
                </label>
                
                <div class="popup-buttons">
                    <button id="request-submit" type="submit">
                        ✓ Envoyer la demande
                    </button>
                    <button id="request-cancel" type="button">
                        ✗ Annuler
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Attacher les événements
        document.getElementById('request-cancel').addEventListener('click', closeRequestModal);
        document.getElementById('request-submit').addEventListener('click', handleRequestSubmit);

        // Fermer le modal en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRequestModal();
            }
        });

        // Animation d'entrée
        setTimeout(() => modal.classList.add('visible'), 10);

    } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture du modal:', error);
        alert('Impossible d\'ouvrir le formulaire de demande');
    }
}

/**
 * Ferme le modal de requête
 */
function closeRequestModal() {
    const modal = document.querySelector('.request-popup');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Gère la soumission d'une requête
 */
async function handleRequestSubmit() {
    try {
        // Récupérer les valeurs du formulaire
        const productId = parseInt(document.getElementById('request-productId').value);
        const quantity = parseInt(document.getElementById('request-quantity').value);
        const reason = document.getElementById('request-reason').value.trim();

        // Validation
        if (!productId) {
            alert('⚠️ Veuillez sélectionner un produit');
            return;
        }

        if (!quantity || quantity <= 0) {
            alert('⚠️ Veuillez entrer une quantité valide');
            return;
        }

        if (!reason) {
            alert('⚠️ Veuillez fournir une raison pour votre demande');
            return;
        }

        // Désactiver le bouton pendant l'envoi
        const submitBtn = document.getElementById('request-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Envoi en cours...';

        // Récupérer l'ID de l'utilisateur
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        // Créer la requête
        const requestData = {
            productId,
            quantity,
            reason,
            userId
        };

        const result = await createRequest(requestData);

        if (result) {
            alert('✅ Votre demande a été envoyée avec succès !');
            closeRequestModal();
        } else {
            throw new Error('Échec de la création de la demande');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la soumission de la requête:', error);
        alert('❌ Erreur : ' + error.message);
        
        // Réactiver le bouton
        const submitBtn = document.getElementById('request-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '✓ Envoyer la demande';
        }
    }
}

// ========================================
// GESTION DES ÉVÉNEMENTS
// ========================================

/**
 * Attache les événements aux cartes de produits
 */
function attachProductCardEvents() {
    const productCards = document.querySelectorAll('.product-list-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', () => {
            const productId = parseInt(card.dataset.productId);
            openRequestModal(productId);
        });
    });
}

/**
 * Initialise les filtres de recherche
 */
function initializeFilters() {
    const searchInput = document.getElementById('product-search');
    const categoryFilter = document.getElementById('category-filter');
    const availabilityFilter = document.getElementById('availability-filter');

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (availabilityFilter) {
        availabilityFilter.addEventListener('change', filterProducts);
    }
}

/**
 * Filtre les produits selon les critères
 */
function filterProducts() {
    const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || '';
    const availability = document.getElementById('availability-filter')?.value || '';

    const productCards = document.querySelectorAll('.product-list-card');

    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productCategory = card.querySelector('.detail-row .value')?.textContent || '';
        const productAvailabilityClass = card.querySelector('.availability-badge').className;

        const matchesSearch = productName.includes(searchTerm);
        const matchesCategory = !category || productCategory.includes(category) || productCategory === category;
        let matchesAvailability = true;
        if (availability) {
            if (availability === 'available') matchesAvailability = productAvailabilityClass.includes('available');
            else if (availability === 'low') matchesAvailability = productAvailabilityClass.includes('low');
            else if (availability === 'out') matchesAvailability = productAvailabilityClass.includes('unavailable');
        }

        if (matchesSearch && matchesCategory && matchesAvailability) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// ========================================
// GESTION DU BOUTON DE REQUÊTE PRINCIPAL
// ========================================

if (addRequestBtn) {
    addRequestBtn.addEventListener('click', () => openRequestModal());
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function showLoadingSpinner() {
    mainContainer.innerHTML = `
        <div class="loading-container">
            <div class="loader"></div>
            <p>Chargement des produits...</p>
        </div>
    `;
}

function showEmptyState() {
    mainContainer.innerHTML = `
        <div class="empty-state">
            <h2>Aucun produit disponible</h2>
            <p>Il n'y a actuellement aucun produit à afficher.</p>
        </div>
    `;
}

function showErrorState(message) {
    mainContainer.innerHTML = `
        <div class="error-state">
            <h2>❌ Erreur</h2>
            <p>${message}</p>
            <button onclick="location.reload()">Réessayer</button>
        </div>
    `;
}

// ========================================
// INITIALISATION
// ========================================

// Charger les produits au démarrage
document.addEventListener('DOMContentLoaded', () => {
    displayProducts();
});

console.log('✅ Interface utilisateur initialisée');