/**
 * ========================================
 * PRODUCT LIST VIEWS - VERSION COMPLÈTE
 * ========================================
 * 
 * Liste des produits avec :
 * - Ajout de produit avec formulaire modal
 * - Filtres avancés
 * - Export PDF/Excel (sans duplication)
 * - Gestion complète
 */

import { fetchProducts, deleteMultipleProducts, createProduct } from "../../data/product.js";
import { renderSection } from "../utils/render.js";
import { categorieList } from "../../data/categoriesList.js";
import { fournisseursCards } from "../../data/Fournisseurs.js";
import { API_URL, getImageUrl, getUserRole } from "../../data/apiUrl.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { exportToPDF, exportToExcel } from "../utils/export.js";

// Cache et état
let productsCache = [];
let currentView = 'grid';
let currentSort = { field: 'name', order: 'asc' };
let currentFilters = {
    category: '',
    status: '',
    priceRange: { min: 0, max: Infinity },
    search: ''
};

// Flag pour éviter les événements dupliqués
let eventsAttached = false;

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

        // Générer les options
        const categoryOptions = categories
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('');

        // Calculer les stats
        const stats = calculateProductStats(products);

        // Vérifier le rôle
        const userRole = getUserRole();
        const isAdminOrMagasinier = userRole === 'ADMIN' || userRole === 'MAGASINIER';

        // Générer le HTML
        const html = `
            ${renderHeader(isAdminOrMagasinier, stats)}
            ${renderFilters(categoryOptions, stats)}
            ${renderProductGrid(products)}
            ${isAdminOrMagasinier ? renderAddProductModal(categories) : ''}
        `;

        // Réinitialiser les événements
        eventsAttached = false;

        return renderSection("categorie-product-list-pannel", html);

    } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
        return renderErrorState();
    }
}

/**
 * Calcule les statistiques
 */
function calculateProductStats(products) {
    return {
        total: products.length,
        lowStock: products.filter(p => p.quantity <= (p.alertLevel || 10)).length,
        outOfStock: products.filter(p => p.quantity === 0).length,
        totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0),
        averagePrice: products.length > 0 
            ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
            : 0
    };
}

/**
 * Rendu header
 */
function renderHeader(isAdminOrMagasinier, stats) {
    return `
        <div class="products-header">
            <div class="header-top">
                <h1 class="product-list-title-pannel">📦 LISTE DES PRODUITS</h1>
                
                <div class="header-actions">
                    ${isAdminOrMagasinier ? `
                        <div class="button-container">
                            <button class="add-product button" id="btn-add-product">
                                <span class="btn-icon">➕</span>
                                <span>Ajouter</span>
                            </button>
                            <button class="delete-product button" id="btn-delete-product">
                                <span class="btn-icon">🗑️</span>
                                <span>Supprimer</span>
                            </button>
                            <button class="real-delete" id="btn-confirm-delete" style="display:none;">
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
 * Rendu filtres
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
        </div>
    `;
}

/**
 * Rendu grille produits
 */
function renderProductGrid(products) {
    // Appliquer filtres
    let filteredProducts = applyFilters(products);
    
    // Appliquer tri
    filteredProducts = applySort(filteredProducts);

    if (filteredProducts.length === 0) {
        return `<div class="product-list-container empty"></div>`;
    }

    if (currentView === 'list') {
        return renderListView(filteredProducts);
    }

    const cardsHTML = filteredProducts.map(product => `
        <div class="product-list-card" data-product-id="${product.id}">
            <input type="checkbox" class="product-checkbox" data-product-id="${product.id}">
            <div class="product-status-badge status-${getProductStatus(product)}">
                ${getStatusText(getProductStatus(product))}
            </div>
            <div class="image-container">
                <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}">
                <div class="image-overlay">
                    <button class="quick-view-btn" data-product-id="${product.id}">
                        👁️ Voir
                    </button>
                </div>
            </div>
            <div class="card-info">
                <div class="product-name">${product.name}</div>
                <div class="product-meta">${product.category?.name || 'Sans catégorie'}</div>
                <div class="product-stats">
                    <div class="stat">
                        <span class="stat-label">Stock</span>
                        <span class="stat-value ${product.quantity <= (product.alertLevel || 10) ? 'low' : ''}">${product.quantity || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Prix</span>
                        <span class="stat-value price">Ar ${formatNumber(product.price || 0)}</span>
                    </div>
                </div>
                ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
            </div>
        </div>
    `).join('');

    return `<div class="product-list-container">${cardsHTML}</div>`;
}

/**
 * Rendu vue liste
 */
function renderListView(products) {
    const headerHTML = `
        <div class="product-list-header">
            <div>✓</div>
            <div>Image</div>
            <div>Nom</div>
            <div>Catégorie</div>
            <div>Stock</div>
            <div>Prix</div>
            <div>Statut</div>
            <div>⚙️</div>
        </div>
    `;

    const rowsHTML = products.map(product => `
        <div class="product-list-row" data-product-id="${product.id}">
            <div class="checkbox-cell">
                <input type="checkbox" class="product-checkbox" data-product-id="${product.id}">
            </div>
            <div class="image-cell">
                <img src="${getImageUrl(product.imageUrl)}" alt="${product.name}">
            </div>
            <div class="name-cell">
                <div class="product-name">${product.name}</div>
                ${product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
            </div>
            <div class="category-cell">${product.category?.name || '-'}</div>
            <div class="quantity-cell ${product.quantity <= (product.alertLevel || 10) ? 'low' : ''}">${product.quantity || 0}</div>
            <div class="price-cell">Ar ${formatNumber(product.price || 0)}</div>
            <div class="status-cell">
                <span class="status-badge status-${getProductStatus(product)}">
                    ${getStatusText(getProductStatus(product))}
                </span>
            </div>
            <div class="action-cell">
                <button class="action-btn" data-product-id="${product.id}">👁️</button>
            </div>
        </div>
    `).join('');

    return `<div class="product-list-container list-view">${headerHTML}${rowsHTML}</div>`;
}

/**
 * Modal d'ajout de produit
 */
function renderAddProductModal(categories) {
    const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    
    return `
        <div class="modal-overlay" id="add-product-modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>➕ Ajouter un Produit</h2>
                    <button class="modal-close" id="close-add-modal">&times;</button>
                </div>
                <form id="add-product-form" class="product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-name">Nom du produit *</label>
                            <input type="text" id="product-name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="product-sku">SKU</label>
                            <input type="text" id="product-sku" name="sku">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-category">Catégorie</label>
                            <select id="product-category" name="categoryId">
                                <option value="">Sans catégorie</option>
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-location">Emplacement</label>
                            <input type="text" id="product-location" name="location">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-quantity">Quantité *</label>
                            <input type="number" id="product-quantity" name="quantity" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="product-price">Prix (Ar) *</label>
                            <input type="number" id="product-price" name="price" min="0" step="0.01" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-alert">Niveau d'alerte</label>
                            <input type="number" id="product-alert" name="alertLevel" min="0" value="10">
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="product-description">Description</label>
                        <textarea id="product-description" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="product-image">Image</label>
                        <input type="file" id="product-image" name="imageUrl" accept="image/*">
                        <div class="image-preview" id="image-preview"></div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" id="cancel-add-product">Annuler</button>
                        <button type="submit" class="btn-submit">✓ Ajouter le Produit</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ========================================
// FILTRAGE ET TRI
// ========================================

function applyFilters(products) {
    return products.filter(p => {
        // Filtre recherche
        if (currentFilters.search) {
            const term = currentFilters.search.toLowerCase();
            const matches = 
                p.name.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.category?.name?.toLowerCase().includes(term);
            if (!matches) return false;
        }

        // Filtre catégorie
        if (currentFilters.category) {
            if (p.categoryId != currentFilters.category) return false;
        }

        // Filtre statut
        if (currentFilters.status) {
            if (getProductStatus(p) !== currentFilters.status) return false;
        }

        // Filtre prix
        const price = p.price || 0;
        if (price < currentFilters.priceRange.min || price > currentFilters.priceRange.max) {
            return false;
        }

        return true;
    });
}

function applySort(products) {
    return products.sort((a, b) => {
        const { field, order } = currentSort;
        let aVal, bVal;

        switch (field) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
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

// ========================================
// GESTION DES ÉVÉNEMENTS
// ========================================

async function refreshProductList() {
    productsCache = await fetchProducts();
    const container = document.querySelector(".product-list-container");
    if (container) {
        container.outerHTML = renderProductGrid(productsCache);
        attachCardEvents();
    }
}

function attachAllEvents() {
    if (eventsAttached) {
        console.log('⚠️ Événements déjà attachés, skip');
        return;
    }

    activateProductSearch();
    activateProductFilter();
    activateProductSort();
    activateViewToggle();
    activateClearFilters();
    attachCardEvents();
    activateAjouterProductButton();
    activateProductDeleteButton();
    activateExportButtons();
    interactiveNavBar();

    eventsAttached = true;
    console.log('✅ Événements attachés');
}

function attachCardEvents() {
    document.querySelectorAll('.product-list-card, .product-list-row').forEach(el => {
        // Retirer les anciens événements
        const newEl = el.cloneNode(true);
        el.replaceWith(newEl);
        
        newEl.addEventListener('click', (e) => {
            if (e.target.closest('.product-checkbox') || e.target.closest('.action-btn')) return;
            const productId = newEl.dataset.productId;
            if (productId) {
                window.location.hash = `#/productList/Pannel?id=${productId}`;
            }
        });
    });

    document.querySelectorAll('.quick-view-btn, .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            if (productId) {
                window.location.hash = `#/productList/Pannel?id=${productId}`;
            }
        });
    });

    // Checkboxes
    document.querySelectorAll('.product-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.stopPropagation();
        });
    });
}

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
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
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
            document.getElementById('sort-filter').value = 'name-asc';
            refreshProductList();
        });
    }
}

function activateAjouterProductButton() {
    const addBtn = document.getElementById('btn-add-product');
    const modal = document.getElementById('add-product-modal');
    const closeBtn = document.getElementById('close-add-modal');
    const cancelBtn = document.getElementById('cancel-add-product');
    const form = document.getElementById('add-product-form');
    const imageInput = document.getElementById('product-image');
    const imagePreview = document.getElementById('image-preview');

    if (!addBtn || !modal) return;

    // Ouvrir modal
    addBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    // Fermer modal
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
        imagePreview.innerHTML = '';
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Preview image
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Soumettre formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('quantity', document.getElementById('product-quantity').value);
        formData.append('price', document.getElementById('product-price').value);

        const sku = document.getElementById('product-sku').value;
        if (sku) formData.append('sku', sku);

        const categoryId = document.getElementById('product-category').value;
        if (categoryId) formData.append('categoryId', categoryId);

        const location = document.getElementById('product-location').value;
        if (location) formData.append('location', location);

        const alertLevel = document.getElementById('product-alert').value;
        if (alertLevel) formData.append('alertLevel', alertLevel);

        const description = document.getElementById('product-description').value;
        if (description) formData.append('description', description);

        if (imageInput.files[0]) {
            formData.append('imageUrl', imageInput.files[0]);
        }

        try {
            const result = await createProduct(formData);
            if (result) {
                closeModal();
                await refreshProductList();
            }
        } catch (error) {
            alert('Erreur lors de l\'ajout du produit');
        }
    });
}

function activateProductDeleteButton() {
    const deleteBtn = document.getElementById('btn-delete-product');
    const confirmBtn = document.getElementById('btn-confirm-delete');

    if (!deleteBtn || !confirmBtn) return;

    deleteBtn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(cb => cb.classList.add('visible'));
        confirmBtn.style.display = 'inline-block';
    });

    confirmBtn.addEventListener('click', async () => {
        const checked = document.querySelectorAll('.product-checkbox:checked');
        const ids = Array.from(checked).map(cb => cb.dataset.productId);
        
        if (ids.length === 0) {
            alert('Sélectionnez au moins un produit');
            return;
        }

        if (!confirm(`Supprimer ${ids.length} produit(s) ?`)) return;

        const result = await deleteMultipleProducts(ids);
        console.log(`✅ ${result.success.length} supprimé(s)`);
        
        await refreshProductList();
        confirmBtn.style.display = 'none';
        document.querySelectorAll('.product-checkbox').forEach(cb => cb.classList.remove('visible'));
    });
}

function activateExportButtons() {
    const pdfBtn = document.getElementById('export-products-pdf');
    const excelBtn = document.getElementById('export-products-excel');

    if (pdfBtn) {
        // Retirer les anciens événements
        const newPdfBtn = pdfBtn.cloneNode(true);
        pdfBtn.replaceWith(newPdfBtn);

        newPdfBtn.addEventListener('click', () => {
            console.log('📄 Export PDF...');
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
        }, { once: true });
    }

    if (excelBtn) {
        // Retirer les anciens événements
        const newExcelBtn = excelBtn.cloneNode(true);
        excelBtn.replaceWith(newExcelBtn);

        newExcelBtn.addEventListener('click', () => {
            console.log('📊 Export Excel...');
            const csvData = productsCache.map(p => ({
                Nom: p.name,
                Catégorie: p.category?.name || '-',
                Stock: p.quantity,
                Prix: p.price
            }));
            exportToExcel(csvData, 'produits.csv');
        }, { once: true });
    }
}

// ========================================
// UTILITAIRES
// ========================================

function getProductStatus(product) {
    const qty = product.quantity || 0;
    const alert = product.alertLevel || 10;
    if (qty === 0) return 'out';
    if (qty <= alert) return 'low';
    return 'available';
}

function getStatusText(status) {
    const texts = {
        'out': 'Épuisé',
        'low': 'Stock faible',
        'available': 'Disponible'
    };
    return texts[status] || status;
}

function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

function renderErrorState() {
    return `
        <div class="error-state">
            <h2>❌ Erreur de chargement</h2>
            <p>Impossible de charger les produits</p>
            <button onclick="location.reload()">Réessayer</button>
        </div>
    `;
}

// Export
export { 
    productList as default,
    refreshProductList,
    attachAllEvents as activateProductListEvents,
    activateProductSearch,
    activateProductFilter,
    activateProductSort,
    activateViewToggle,
    activateClearFilters,
    attachCardEvents as activateProductCardEvent,
    activateAjouterProductButton,
    activateProductDeleteButton,
    activateExportButtons
};