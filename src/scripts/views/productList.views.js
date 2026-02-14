/**
 * ========================================
 * PRODUCT LIST VIEWS - AMÉLIORÉ
 * ========================================
 * 
 * Liste des produits avec :
 * - Filtres avancés (multi-critères)
 * - Tri personnalisable
 * - Vue grille/liste
 * - Export PDF/Excel
 * - Statistiques en temps réel
 */

import { fetchProducts, deleteMultipleProducts } from "../../data/product.js";
import { render, renderSection } from "../utils/render.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { form } from "../utils/renderForm.js";
import { API_URL, getImageUrl, getUserRole } from "../../data/apiUrl.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { exportToPDF, exportToExcel } from "../utils/export.js";

// Cache et état
let productsCache = [];
let currentView = 'grid'; // 'grid' ou 'list'
let currentSort = { field: 'name', order: 'asc' };
let currentFilters = {
    category: '',
    status: '',
    priceRange: { min: 0, max: Infinity },
    search: ''
};

/**
 * Génère la vue principale de la liste des produits
 */
export async function productList() {
    try {
        // Charger les données
        const [categories, products] = await Promise.all([
            categorieList(),
            fetchProducts()
        ]);

        productsCache = products;

        // Générer les options de catégories
        const categoryOptions = categories
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('');

        // Calculer les statistiques
        const stats = calculateProductStats(products);

        // Vérifier le rôle de l'utilisateur
        const userRole = getUserRole();
        const isAdminOrMagasinier = userRole === 'ADMIN' || userRole === 'MAGASINIER';

        // Générer le HTML
        const html = `
            ${renderHeader(isAdminOrMagasinier, stats)}
            ${renderFilters(categoryOptions, stats)}
            ${renderProductGrid(products)}
        `;

        return renderSection("categorie-product-list-pannel", html);

    } catch (error) {
        console.error('❌ Erreur lors du chargement des produits:', error);
        return renderErrorState();
    }
}

/**
 * Calcule les statistiques des produits
 */
function calculateProductStats(products) {
    return {
        total: products.length,
        lowStock: products.filter(p => p.quantity <= p.alertLevel).length,
        outOfStock: products.filter(p => p.quantity === 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.price * p.quantity || 0), 0),
        averagePrice: products.length > 0 
            ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
            : 0
    };
}

/**
 * Rendu de l'en-tête avec statistiques
 */
function renderHeader(isAdminOrMagasinier, stats) {
    return `
        <div class="products-header">
            <div class="header-top">
                <h1 class="product-list-title-pannel">📦 LISTE DES PRODUITS</h1>
                
                <div class="header-actions">
                    ${isAdminOrMagasinier ? `
                        <div class="button-container">
                            <button class="add-product button">
                                <span class="btn-icon">➕</span>
                                <span>Ajouter</span>
                            </button>
                            <button class="delete-product button">
                                <span class="btn-icon">🗑️</span>
                                <span>Supprimer</span>
                            </button>
                            <button class="real-delete" style="display:none;">
                                ❗ Confirmer suppression
                            </button>
                        </div>
                    ` : ''}
                    
                    <div class="export-actions">
                        <button class="export-pdf-btn" id="export-products-pdf">
                            <span class="btn-icon">📄</span>
                            <span>PDF</span>
                        </button>
                        <button class="export-excel-btn" id="export-products-excel">
                            <span class="btn-icon">📊</span>
                            <span>Excel</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="stats-bar">
                <div class="stat-item">
                    <span class="stat-value">${stats.total}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="stat-item warning">
                    <span class="stat-value">${stats.lowStock}</span>
                    <span class="stat-label">Stock faible</span>
                </div>
                <div class="stat-item danger">
                    <span class="stat-value">${stats.outOfStock}</span>
                    <span class="stat-label">Épuisé</span>
                </div>
                <div class="stat-item success">
                    <span class="stat-value">Ar ${formatNumber(stats.totalValue)}</span>
                    <span class="stat-label">Valeur totale</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Rendu des filtres avancés
 */
function renderFilters(categoryOptions, stats) {
    return `
        <div class="filters-section">
            <div class="search-container">
                <input 
                    type="text" 
                    placeholder="🔍 Rechercher un produit..." 
                    class="search-bar" 
                    id="product-search"
                />
            </div>
            
            <div class="filters-row">
                <div class="filter-group">
                    <label for="category-filter">Catégorie</label>
                    <select name="filter" id="category-filter" class="filter-select">
                        <option value="">Toutes</option>
                        ${categoryOptions}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="status-filter">Statut</label>
                    <select id="status-filter" class="filter-select">
                        <option value="">Tous</option>
                        <option value="available">Disponible</option>
                        <option value="low">Stock faible</option>
                        <option value="out">Épuisé</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="price-filter">Prix</label>
                    <select id="price-filter" class="filter-select">
                        <option value="">Tous</option>
                        <option value="0-1000">0 - 1000 Ar</option>
                        <option value="1000-5000">1000 - 5000 Ar</option>
                        <option value="5000-10000">5000 - 10000 Ar</option>
                        <option value="10000+">10000+ Ar</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="sort-filter">Trier par</label>
                    <select id="sort-filter" class="filter-select">
                        <option value="name-asc">Nom (A-Z)</option>
                        <option value="name-desc">Nom (Z-A)</option>
                        <option value="price-asc">Prix (croissant)</option>
                        <option value="price-desc">Prix (décroissant)</option>
                        <option value="quantity-asc">Stock (croissant)</option>
                        <option value="quantity-desc">Stock (décroissant)</option>
                    </select>
                </div>
                
                <div class="view-toggle">
                    <button class="view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid">
                        ⊞ Grille
                    </button>
                    <button class="view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list">
                        ☰ Liste
                    </button>
                </div>
                
                <button class="clear-filters-btn" id="clear-filters">
                    ✖ Réinitialiser
                </button>
            </div>
            
            <div class="active-filters" id="active-filters"></div>
        </div>
    `;
}

/**
 * Rendu de la grille de produits
 */
function renderProductGrid(products) {
    const filteredProducts = applyFilters(products);
    const sortedProducts = applySorting(filteredProducts);
    
    if (sortedProducts.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos filtres de recherche</p>
            </div>
        `;
    }

    const productCards = sortedProducts.map(p => 
        currentView === 'grid' ? renderProductCard(p) : renderProductRow(p)
    ).join('');

    return `
        <div class="product-list-container ${currentView}-view">
            ${currentView === 'list' ? renderTableHeader() : ''}
            ${productCards}
        </div>
    `;
}

/**
 * Rendu d'une carte de produit (vue grille)
 */
function renderProductCard(product) {
    const statusClass = getStatusClass(product);
    const statusLabel = getStatusLabel(product);
    const imageUrl = getImageUrl(product.imageUrl) || './src/images/placeholder.png';

    return `
        <div class="product-list-card" data-product-id="${product.id}">
            <input 
                type="checkbox" 
                data-product-id="${product.id}" 
                class="product-checkbox"
                aria-label="Sélectionner ${product.name}"
            />
            
            <div class="product-status-badge ${statusClass}">
                ${statusLabel}
            </div>
            
            <div class="image-container">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}"
                    loading="lazy"
                    onerror="this.src='./src/images/placeholder.png'"
                />
                <div class="image-overlay">
                    <button class="quick-view-btn" data-product-id="${product.id}">
                        👁️ Voir détails
                    </button>
                </div>
            </div>
            
            <div class="card-info">
                <div class="product-name" title="${product.name}">
                    ${product.name}
                </div>
                <div class="product-meta">
                    <span class="category-tag">
                        🏷️ ${product.category?.name || 'Sans catégorie'}
                    </span>
                </div>
                <div class="product-stats">
                    <div class="stat">
                        <span class="label">Stock:</span>
                        <span class="value ${product.quantity <= product.alertLevel ? 'low' : ''}"
                            >${product.quantity || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Prix:</span>
                        <span class="value price">Ar ${formatNumber(product.price || 0)}</span>
                    </div>
                </div>
                ${product.sku ? `
                    <div class="product-sku">
                        SKU: ${product.sku}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Rendu d'une ligne de produit (vue liste)
 */
function renderProductRow(product) {
    const statusClass = getStatusClass(product);
    const statusLabel = getStatusLabel(product);
    const imageUrl = getImageUrl(product.imageUrl) || './src/images/placeholder.png';

    return `
        <div class="product-list-row" data-product-id="${product.id}">
            <div class="row-cell checkbox-cell">
                <input 
                    type="checkbox" 
                    data-product-id="${product.id}" 
                    class="product-checkbox"
                />
            </div>
            <div class="row-cell image-cell">
                <img 
                    src="${imageUrl}" 
                    alt="${product.name}"
                    loading="lazy"
                    onerror="this.src='./src/images/placeholder.png'"
                />
            </div>
            <div class="row-cell name-cell">
                <div class="product-name">${product.name}</div>
                ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
            </div>
            <div class="row-cell category-cell">
                ${product.category?.name || '-'}
            </div>
            <div class="row-cell quantity-cell">
                <span class="${product.quantity <= product.alertLevel ? 'low' : ''}">
                    ${product.quantity || 0}
                </span>
            </div>
            <div class="row-cell price-cell">
                Ar ${formatNumber(product.price || 0)}
            </div>
            <div class="row-cell status-cell">
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="row-cell actions-cell">
                <button class="action-btn view-btn" data-product-id="${product.id}">
                    👁️
                </button>
            </div>
        </div>
    `;
}

/**
 * Rendu de l'en-tête du tableau (vue liste)
 */
function renderTableHeader() {
    return `
        <div class="product-list-header">
            <div class="header-cell checkbox-cell">
                <input type="checkbox" id="select-all-products" />
            </div>
            <div class="header-cell image-cell">Image</div>
            <div class="header-cell name-cell">Nom</div>
            <div class="header-cell category-cell">Catégorie</div>
            <div class="header-cell quantity-cell">Stock</div>
            <div class="header-cell price-cell">Prix</div>
            <div class="header-cell status-cell">Statut</div>
            <div class="header-cell actions-cell">Actions</div>
        </div>
    `;
}

/**
 * Applique les filtres aux produits
 */
function applyFilters(products) {
    return products.filter(p => {
        // Filtre de recherche
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            const matchName = p.name.toLowerCase().includes(searchLower);
            const matchCategory = p.category?.name?.toLowerCase().includes(searchLower);
            const matchSKU = p.sku?.toLowerCase().includes(searchLower);
            if (!matchName && !matchCategory && !matchSKU) return false;
        }

        // Filtre de catégorie
        if (currentFilters.category) {
            const catId = Number(currentFilters.category);
            if (p.categoryId !== catId && p.category?.id !== catId) return false;
        }

        // Filtre de statut
        if (currentFilters.status) {
            const status = getProductStatus(p);
            if (status !== currentFilters.status) return false;
        }

        // Filtre de prix
        const price = p.price || 0;
        const range = currentFilters.priceRange;
        if (price < range.min || price > range.max) return false;

        return true;
    });
}

/**
 * Applique le tri aux produits
 */
function applySorting(products) {
    const { field, order } = currentSort;
    
    return [...products].sort((a, b) => {
        let aVal, bVal;

        switch (field) {
            case 'name':
                aVal = a.name?.toLowerCase() || '';
                bVal = b.name?.toLowerCase() || '';
                break;
            case 'price':
                aVal = a.price || 0;
                bVal = b.price || 0;
                break;
            case 'quantity':
                aVal = a.quantity || 0;
                bVal = b.quantity || 0;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Détermine le statut d'un produit
 */
function getProductStatus(product) {
    if (product.quantity === 0) return 'out';
    if (product.quantity <= product.alertLevel) return 'low';
    return 'available';
}

/**
 * Retourne la classe CSS du statut
 */
function getStatusClass(product) {
    const status = getProductStatus(product);
    return {
        'out': 'status-out',
        'low': 'status-low',
        'available': 'status-available'
    }[status];
}

/**
 * Retourne le label du statut
 */
function getStatusLabel(product) {
    const status = getProductStatus(product);
    return {
        'out': 'Épuisé',
        'low': 'Stock faible',
        'available': 'Disponible'
    }[status];
}

/**
 * Formate un nombre
 */
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * État d'erreur
 */
function renderErrorState() {
    return `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Erreur de chargement</h3>
            <p>Impossible de charger les produits</p>
            <button onclick="location.reload()">Réessayer</button>
        </div>
    `;
}

/**
 * Rafraîchit la liste des produits
 */
async function refreshProductList() {
    productsCache = await fetchProducts();
    const container = document.querySelector(".product-list-container");
    if (container) {
        container.outerHTML = renderProductGrid(productsCache);
    }
    attachAllEvents();
}

/**
 * Attache tous les événements
 */
function attachAllEvents() {
    activateProductSearch();
    activateProductFilter();
    activateProductSort();
    activateViewToggle();
    activateClearFilters();
    activateProductCardEvent();
    activateAjouterProductButton();
    activateProductDeleteButton();
    activateExportButtons();
    activateSelectAll();
    interactiveNavBar();
}

// Fonctions d'activation (à implémenter selon vos besoins)
function activateProductSearch() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentFilters.search = e.target.value;
            refreshProductList();
        });
    }
}

function activateProductFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            refreshProductList();
        });
    }
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            refreshProductList();
        });
    }
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value === '') {
                currentFilters.priceRange = { min: 0, max: Infinity };
            } else if (value === '10000+') {
                currentFilters.priceRange = { min: 10000, max: Infinity };
            } else {
                const [min, max] = value.split('-').map(Number);
                currentFilters.priceRange = { min, max };
            }
            refreshProductList();
        });
    }
}

function activateProductSort() {
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            const [field, order] = e.target.value.split('-');
            currentSort = { field, order };
            refreshProductList();
        });
    }
}

function activateViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = btn.dataset.view;
            refreshProductList();
        });
    });
}

function activateClearFilters() {
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            currentFilters = { category: '', status: '', priceRange: { min: 0, max: Infinity }, search: '' };
            currentSort = { field: 'name', order: 'asc' };
            document.getElementById('product-search').value = '';
            document.getElementById('category-filter').value = '';
            document.getElementById('status-filter').value = '';
            document.getElementById('price-filter').value = '';
            document.getElementById('sort-filter').value = 'name-asc';
            refreshProductList();
        });
    }
}

function activateProductCardEvent() {
    document.querySelectorAll('.product-list-card, .product-list-row').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.product-checkbox') || e.target.closest('.action-btn')) return;
            const productId = el.dataset.productId;
            if (productId) {
                window.location.hash = `#/productList/Pannel?id=${productId}`;
            }
        });
    });
    document.querySelectorAll('.quick-view-btn, .view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            if (productId) {
                window.location.hash = `#/productList/Pannel?id=${productId}`;
            }
        });
    });
}

function activateAjouterProductButton() {
    const addBtn = document.querySelector('.add-product');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            // À implémenter : formulaire d'ajout de produit
            alert('Fonctionnalité d\'ajout de produit à implémenter');
        });
    }
}

function activateProductDeleteButton() {
    const deleteBtn = document.querySelector('.delete-product');
    const realDeleteBtn = document.querySelector('.real-delete');
    if (deleteBtn && realDeleteBtn) {
        deleteBtn.addEventListener('click', () => {
            realDeleteBtn.style.display = 'inline-block';
        });
        realDeleteBtn.addEventListener('click', async () => {
            const checkboxes = document.querySelectorAll('.product-checkbox:checked');
            const ids = Array.from(checkboxes).map(cb => cb.dataset.productId);
            if (ids.length === 0) {
                alert('Sélectionnez au moins un produit');
                return;
            }
            if (confirm(`Supprimer ${ids.length} produit(s) ?`)) {
                const result = await deleteMultipleProducts(ids);
                console.log(result);
                refreshProductList();
                realDeleteBtn.style.display = 'none';
            }
        });
    }
}

function activateExportButtons() {
    const pdfBtn = document.getElementById('export-products-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            exportToPDF({
                title: 'Liste des Produits',
                data: productsCache.map(p => ({
                    Nom: p.name,
                    Catégorie: p.category?.name || '-',
                    Stock: p.quantity,
                    Prix: p.price
                })),
                filename: 'produits.pdf'
            });
        });
    }
    const excelBtn = document.getElementById('export-products-excel');
    if (excelBtn) {
        excelBtn.addEventListener('click', () => {
            const csvData = productsCache.map(p => ({
                Nom: p.name,
                Catégorie: p.category?.name || '-',
                Stock: p.quantity,
                Prix: p.price
            }));
            exportToExcel(csvData, 'produits.csv');
        });
    }
}

function activateSelectAll() {
    const selectAll = document.getElementById('select-all-products');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.product-checkbox').forEach(cb => cb.checked = e.target.checked);
        });
    }
}

// Export
export { 
    productList as default,
    refreshProductList,
    activateProductSearch,
    activateProductFilter,
    activateProductSort,
    activateViewToggle,
    activateClearFilters,
    activateProductCardEvent,
    activateAjouterProductButton,
    activateProductDeleteButton,  
    activateExportButtons,
    activateSelectAll,
    attachAllEvents as activateProductListEvents
};