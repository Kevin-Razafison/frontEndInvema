/**
 * ========================================
 * DASHBOARD VIEWS - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Tableau de bord avec :
 * - Statistiques en temps réel
 * - Graphiques interactifs
 * - Export PDF/Excel fonctionnel
 * - Animations
 */

import { fetchProducts } from "../../data/product.js";
import { fetchRequests } from "../../data/request.js";
import { Users } from "../../data/Users.js";
import { fetchOrders } from "./commandes.views.js";
import { renderSection } from "../utils/render.js";
import { exportDashboardReport } from "../utils/export.js";

/**
 * Génère le tableau de bord complet
 */
export async function DashBoard() {
    try {
        // Afficher un loader pendant le chargement
        showLoadingState();

        // Récupérer toutes les données en parallèle
        const [stock, requests, users, orders] = await Promise.all([
            fetchProducts(),
            fetchRequests(),
            Users(),
            fetchOrders()
        ]);

        // Calculer les statistiques
        const stats = calculateStatistics(stock, requests, users, orders);

        // Stocker les stats globalement pour l'export
        window.dashboardStats = stats;

        // Générer le HTML
        const html = `
            ${renderOverviewSection(stats)}
            ${renderChartsSection(stats)}
            ${renderActivitySection(requests, users, stock)}
            ${renderQuickActionsSection()}
        `;

        // Attacher les événements après le rendu
        setTimeout(() => {
            attachDashboardEvents(stats);
        }, 100);

        return html;

    } catch (error) {
        console.error('❌ Erreur lors du chargement du dashboard:', error);
        return renderErrorState();
    }
}

/**
 * Attache les événements du dashboard
 */
function attachDashboardEvents(stats) {
    // Bouton Export PDF
    const exportBtn = document.getElementById('export-dashboard-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '⏳ Export en cours...';
                
                await exportDashboardReport(stats);
                
                exportBtn.innerHTML = '✓ Exporté !';
                setTimeout(() => {
                    exportBtn.innerHTML = '📄 Exporter PDF';
                    exportBtn.disabled = false;
                }, 2000);
            } catch (error) {
                console.error('❌ Erreur export:', error);
                exportBtn.innerHTML = '❌ Erreur';
                setTimeout(() => {
                    exportBtn.innerHTML = '📄 Exporter PDF';
                    exportBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // Bouton Générer Rapport
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            await exportDashboardReport(stats);
        });
    }

    // Initialiser les graphiques si Chart.js est chargé
    if (typeof Chart !== 'undefined') {
        initializeCharts(stats);
    } else {
        // Charger Chart.js dynamiquement
        loadChartJS().then(() => {
            initializeCharts(stats);
        });
    }

    // Boutons d'action dans l'activité
    attachActivityActionButtons();
}

/**
 * Attache les boutons d'action des activités (approuver/rejeter)
 */
function attachActivityActionButtons() {
    const approveButtons = document.querySelectorAll('.btn-approve');
    const rejectButtons = document.querySelectorAll('.btn-reject');

    approveButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const requestId = btn.dataset.requestId;
            await handleRequestAction(requestId, 'APPROVED');
        });
    });

    rejectButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const requestId = btn.dataset.requestId;
            await handleRequestAction(requestId, 'REJECTER');
        });
    });
}

/**
 * Gère l'approbation/rejet d'une requête
 */
async function handleRequestAction(requestId, status) {
    try {
        // Implémenter votre logique d'API ici
        console.log(`${status === 'APPROVED' ? '✓' : '✗'} Requête #${requestId} ${status}`);
        
        // Recharger le dashboard après l'action
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors du traitement de la requête');
    }
}

/**
 * Charge Chart.js dynamiquement
 */
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Calcule toutes les statistiques nécessaires
 */
function calculateStatistics(stock, requests, users, orders) {
    // Stocks faibles (quantity <= alertLevel)
    const lowStocks = stock.filter(p => p.quantity <= (p.alertLevel || 10));

    // Commandes en attente
    const pendingOrders = orders.filter(o => o.status === "PENDING");

    // Requêtes en attente
    const pendingRequests = requests.filter(r => r.status === "PENDING");

    // Requêtes approuvées aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvedToday = requests.filter(r => {
        if (r.status !== "APPROVED") return false;
        const reqDate = new Date(r.updatedAt);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate.getTime() === today.getTime();
    });

    // Valeur totale du stock
    const totalStockValue = stock.reduce((acc, p) => {
        return acc + ((Number(p.price) || 0) * (Number(p.quantity) || 0));
    }, 0);

    // Produits les plus demandés (top 5)
    const productRequestCounts = {};
    requests.forEach(r => {
        productRequestCounts[r.productId] = (productRequestCounts[r.productId] || 0) + 1;
    });
    const topProducts = Object.entries(productRequestCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({
            product: stock.find(p => p.id === parseInt(id)),
            count
        }));

    // Tendance des requêtes (7 derniers jours)
    const requestTrend = calculateRequestTrend(requests);

    // Distribution des stocks par catégorie
    const stockByCategory = calculateStockByCategory(stock);

    // Utilisateurs actifs (ayant fait une requête ce mois)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const activeUsers = new Set(
        requests
            .filter(r => new Date(r.createdAt) >= thisMonth)
            .map(r => r.userId)
    ).size;

    return {
        lowStocks: lowStocks.length,
        lowStocksData: lowStocks,
        pendingOrders: pendingOrders.length,
        pendingRequests: pendingRequests.length,
        approvedToday: approvedToday.length,
        totalStockValue,
        totalProducts: stock.length,
        totalUsers: users.length,
        activeUsers,
        topProducts,
        requestTrend,
        stockByCategory,
        allStock: stock,
        allRequests: requests,
        allOrders: orders
    };
}

/**
 * Calcule la tendance des requêtes sur 7 jours
 */
function calculateRequestTrend(requests) {
    const trend = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = requests.filter(r => {
            const reqDate = new Date(r.createdAt);
            return reqDate >= date && reqDate < nextDate;
        }).length;
        
        trend.push({
            date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
            count
        });
    }
    
    return trend;
}

/**
 * Calcule la distribution des stocks par catégorie
 */
function calculateStockByCategory(stock) {
    const byCategory = {};
    
    stock.forEach(p => {
        const categoryName = p.category?.name || 'Non catégorisé';
        if (!byCategory[categoryName]) {
            byCategory[categoryName] = {
                name: categoryName,
                count: 0,
                value: 0
            };
        }
        byCategory[categoryName].count += Number(p.quantity) || 0;
        byCategory[categoryName].value += (Number(p.price) || 0) * (Number(p.quantity) || 0);
    });
    
    return Object.values(byCategory).sort((a, b) => b.value - a.value);
}

/**
 * Section Overview (cartes de statistiques)
 */
function renderOverviewSection(stats) {
    const cards = [
        {
            title: "STOCKS FAIBLES",
            value: stats.lowStocks,
            icon: "icons-low-priority.png",
            color: "#e74c3c",
            trend: "danger"
        },
        {
            title: "COMMANDES EN ATTENTE",
            value: stats.pendingOrders,
            icon: "icons-pending.png",
            color: "#f39c12",
            trend: "warning"
        },
        {
            title: "REQUÊTES EN ATTENTE",
            value: stats.pendingRequests,
            icon: "icons-arrow-up.png",
            color: "#3498db",
            trend: "info"
        },
        {
            title: "VALEUR TOTALE DU STOCK",
            value: `Ar ${formatNumber(stats.totalStockValue)}`,
            icon: "icons-dollar.png",
            color: "#27ae60",
            trend: "success"
        }
    ];

    const cardsHTML = cards.map((card, index) => `
        <div class="stats-card card-${index}" data-color="${card.color}" style="--card-color: ${card.color}">
            <div class="card-header">
                <div class="card-title">${card.title}</div>
                <img src="./src/icons/${card.icon}" alt="${card.title}" class="card-icon">
            </div>
            <div class="card-value">${card.value}</div>
            <div class="card-footer">
                <div class="trend ${card.trend}">
                    <span>Temps réel</span>
                </div>
            </div>
        </div>
    `).join('');

    return renderSection("dashboard-overview", `
        <div class="section-header">
            <h2 class="section-title">📊 Vue d'ensemble</h2>
            <div class="section-actions">
                <button class="btn-refresh" onclick="location.reload()">
                    🔄 Actualiser
                </button>
                <button class="btn-export" id="export-dashboard-btn">
                    📄 Exporter PDF
                </button>
            </div>
        </div>
        <div class="stats-grid">
            ${cardsHTML}
        </div>
        
        <div class="quick-stats">
            <div class="quick-stat">
                <span class="label">Produits totaux</span>
                <span class="value">${stats.totalProducts}</span>
            </div>
            <div class="quick-stat">
                <span class="label">Utilisateurs actifs</span>
                <span class="value">${stats.activeUsers}/${stats.totalUsers}</span>
            </div>
            <div class="quick-stat">
                <span class="label">Approuvées aujourd'hui</span>
                <span class="value">${stats.approvedToday}</span>
            </div>
        </div>
    `);
}

/**
 * Section Graphiques
 */
function renderChartsSection(stats) {
    return renderSection("dashboard-charts", `
        <div class="section-header">
            <h2 class="section-title">📈 Analyses & Tendances</h2>
        </div>
        <div class="charts-grid">
            <div class="chart-container">
                <div class="chart-title">📊 Tendance des requêtes (7 jours)</div>
                <canvas id="requests-trend-chart"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">🎯 Distribution par catégorie</div>
                <canvas id="stock-category-chart"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">💰 Valeur par catégorie</div>
                <canvas id="value-category-chart"></canvas>
            </div>
            <div class="chart-container">
                <div class="chart-title">🔝 Top 5 produits demandés</div>
                <canvas id="top-products-chart"></canvas>
            </div>
        </div>
    `);
}

/**
 * Section Activités récentes
 */
function renderActivitySection(requests, users, products) {
    const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

    const activitiesHTML = recentRequests.map(request => {
        const user = users.find(u => u.id === request.userId);
        const product = products.find(p => p.id === request.productId);
        
        const statusBadge = getStatusBadge(request.status);
        const timeAgo = getTimeAgo(new Date(request.createdAt));

        return `
            <div class="activity-item" data-request-id="${request.id}">
                <div class="activity-icon ${request.status.toLowerCase()}">
                    ${getStatusIcon(request.status)}
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="user-name">${user?.name || 'Utilisateur inconnu'}</span>
                        <span class="activity-action">a demandé</span>
                        <span class="product-name">${product?.name || 'Produit inconnu'}</span>
                    </div>
                    <div class="activity-details">
                        <span class="quantity">Quantité: ${request.quantity}</span>
                        <span class="separator">•</span>
                        <span class="time">${timeAgo}</span>
                        <span class="separator">•</span>
                        ${statusBadge}
                    </div>
                    ${request.reason ? `<div class="activity-reason">"${request.reason}"</div>` : ''}
                </div>
                ${request.status === 'PENDING' ? `
                    <div class="activity-actions">
                        <button class="btn-approve" data-request-id="${request.id}" title="Approuver">✓</button>
                        <button class="btn-reject" data-request-id="${request.id}" title="Rejeter">✗</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    return renderSection("dashboard-activity", `
        <div class="section-header">
            <h2 class="section-title">⚡ Activités récentes</h2>
            <a href="#/requests" class="view-all-link">Voir tout →</a>
        </div>
        <div class="activity-feed">
            ${activitiesHTML || '<p class="empty-message">Aucune activité récente</p>'}
        </div>
    `);
}

/**
 * Section Actions rapides
 */
function renderQuickActionsSection() {
    return renderSection("dashboard-quick-actions", `
        <div class="section-header">
            <h2 class="section-title">⚡ Actions rapides</h2>
        </div>
        <div class="quick-actions-grid">
            <button class="quick-action" onclick="window.location.hash='#/productList'">
                <span class="action-icon">📦</span>
                <span class="action-label">Ajouter un produit</span>
            </button>
            <button class="quick-action" onclick="window.location.hash='#/commandes'">
                <span class="action-icon">🛒</span>
                <span class="action-label">Nouvelle commande</span>
            </button>
            <button class="quick-action" onclick="window.location.hash='#/utilisateur'">
                <span class="action-icon">👥</span>
                <span class="action-label">Gérer utilisateurs</span>
            </button>
            <button class="quick-action" id="generate-report-btn">
                <span class="action-icon">📊</span>
                <span class="action-label">Générer rapport</span>
            </button>
        </div>
    `);
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Formate un nombre avec séparateurs de milliers
 */
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Retourne un badge de statut
 */
function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="status-badge pending">En attente</span>',
        'APPROVED': '<span class="status-badge approved">Approuvée</span>',
        'REJECTER': '<span class="status-badge rejected">Rejetée</span>',
        'PREPARED': '<span class="status-badge prepared">Préparée</span>',
        'PICKEDUP': '<span class="status-badge pickedup">Récupérée</span>'
    };
    return badges[status] || '<span class="status-badge">Inconnu</span>';
}

/**
 * Retourne une icône de statut
 */
function getStatusIcon(status) {
    const icons = {
        'PENDING': '⏳',
        'APPROVED': '✅',
        'REJECTER': '❌',
        'PREPARED': '📦',
        'PICKEDUP': '🚚'
    };
    return icons[status] || '❓';
}

/**
 * Calcule le temps écoulé depuis une date
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        année: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return `Il y a ${interval} ${name}${interval > 1 ? 's' : ''}`;
        }
    }
    
    return 'À l\'instant';
}

/**
 * Affiche un état de chargement
 */
function showLoadingState() {
    const main = document.getElementById('main');
    if (main) {
        main.innerHTML = `
            <div class="dashboard-loading">
                <div class="loader"></div>
                <p>Chargement du tableau de bord...</p>
            </div>
        `;
    }
}

/**
 * Affiche un état d'erreur
 */
function renderErrorState() {
    return `
        <div class="dashboard-error">
            <div class="error-icon">⚠️</div>
            <h2>Erreur de chargement</h2>
            <p>Impossible de charger les données du tableau de bord</p>
            <button onclick="location.reload()" class="btn-retry">Réessayer</button>
        </div>
    `;
}

/**
 * Initialise les graphiques
 */
function initializeCharts(stats) {
    if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js non chargé');
        return;
    }

    // Configuration commune
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    // Graphique de tendance des requêtes
    const trendCtx = document.getElementById('requests-trend-chart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: stats.requestTrend.map(t => t.date),
                datasets: [{
                    label: 'Requêtes',
                    data: stats.requestTrend.map(t => t.count),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: commonOptions
        });
    }

    // Graphique de distribution par catégorie
    const categoryCtx = document.getElementById('stock-category-chart');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: stats.stockByCategory.map(c => c.name),
                datasets: [{
                    data: stats.stockByCategory.map(c => c.count),
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#f39c12', 
                        '#27ae60', '#9b59b6', '#1abc9c'
                    ]
                }]
            },
            options: commonOptions
        });
    }

    // Graphique de valeur par catégorie
    const valueCtx = document.getElementById('value-category-chart');
    if (valueCtx) {
        new Chart(valueCtx, {
            type: 'bar',
            data: {
                labels: stats.stockByCategory.map(c => c.name),
                datasets: [{
                    label: 'Valeur (Ar)',
                    data: stats.stockByCategory.map(c => c.value),
                    backgroundColor: '#27ae60'
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Graphique des top produits
    const topProductsCtx = document.getElementById('top-products-chart');
    if (topProductsCtx) {
        new Chart(topProductsCtx, {
            type: 'bar',
            data: {
                labels: stats.topProducts.map(p => p.product?.name || 'Inconnu'),
                datasets: [{
                    label: 'Nombre de demandes',
                    data: stats.topProducts.map(p => p.count),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    console.log('✅ Graphiques initialisés');
}

// Export
export { DashBoard as default };