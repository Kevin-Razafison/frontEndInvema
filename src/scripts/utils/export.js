
/**
 * Exporte des données en PDF
 * @param {Object} options - Options d'export
 * @param {string} options.title - Titre du document
 * @param {Array} options.data - Données à exporter
 * @param {string} options.type - Type de rapport ('table', 'stats', 'invoice')
 * @param {string} options.filename - Nom du fichier
 */
export async function exportToPDF(options) {
    const {
        title = 'Rapport',
        data = [],
        type = 'table',
        filename = 'export.pdf',
        orientation = 'portrait'
    } = options;

    try {
        // Vérifier si jsPDF est disponible
        if (typeof window.jspdf === 'undefined') {
            console.error('❌ jsPDF n\'est pas chargé');
            await loadJsPDF();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: 'a4'
        });

        // En-tête du document
        addPDFHeader(doc, title);

        // Contenu selon le type
        switch (type) {
            case 'table':
                addTableToPDF(doc, data);
                break;
            case 'stats':
                addStatsToPDF(doc, data);
                break;
            case 'invoice':
                addInvoiceToPDF(doc, data);
                break;
            case 'dashboard':
                addDashboardToPDF(doc, data);
                break;
            default:
                addTableToPDF(doc, data);
        }

        // Pied de page
        addPDFFooter(doc);

        // Télécharger le fichier
        doc.save(filename);
        
        console.log('✅ PDF exporté:', filename);
        showSuccessNotification('PDF exporté avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'export PDF:', error);
        showErrorNotification('Impossible d\'exporter le PDF');
    }
}

/**
 * Charge la bibliothèque jsPDF dynamiquement
 */
async function loadJsPDF() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            const autoTableScript = document.createElement('script');
            autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            autoTableScript.onload = resolve;
            autoTableScript.onerror = reject;
            document.head.appendChild(autoTableScript);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Ajoute un en-tête au PDF
 */
function addPDFHeader(doc, title) {
    // Logo (si disponible)
    // doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);

    // Titre
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 20, { align: 'center' });

    // Date et heure
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString('fr-FR');
    doc.text(`Généré le ${now}`, 105, 28, { align: 'center' });

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 35, 200, 35);
}

/**
 * Ajoute un pied de page au PDF
 */
function addPDFFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ligne de séparation
        doc.setDrawColor(200, 200, 200);
        doc.line(10, 280, 200, 280);
        
        // Numéro de page
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Page ${i} / ${pageCount}`,
            105,
            290,
            { align: 'center' }
        );
        
        // Nom de l'entreprise
        doc.text('INVEMA - Système de Gestion d\'Inventaire', 105, 285, { align: 'center' });
    }
}

/**
 * Ajoute un tableau au PDF
 */
function addTableToPDF(doc, data) {
    if (!data || data.length === 0) {
        doc.text('Aucune donnée à afficher', 105, 50, { align: 'center' });
        return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(item => headers.map(header => item[header] || '-'));

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: [20, 37, 54],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        }
    });
}

/**
 * Ajoute des statistiques au PDF
 */
function addStatsToPDF(doc, stats) {
    let yPos = 45;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques', 10, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    for (const [key, value] of Object.entries(stats)) {
        doc.text(`${key}: ${value}`, 15, yPos);
        yPos += 8;
        
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    }
}

/**
 * Ajoute un dashboard au PDF
 */
function addDashboardToPDF(doc, data) {
    // Titre de section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tableau de Bord', 10, 45);

    // Statistiques principales
    let yPos = 55;
    const stats = [
        { label: 'Stocks faibles', value: data.lowStocks || 0, color: [231, 76, 60] },
        { label: 'Commandes en attente', value: data.pendingOrders || 0, color: [243, 156, 18] },
        { label: 'Requêtes en attente', value: data.pendingRequests || 0, color: [52, 152, 219] },
        { label: 'Valeur totale', value: `Ar ${formatNumber(data.totalStockValue || 0)}`, color: [39, 174, 96] }
    ];

    stats.forEach(stat => {
        // Rectangle coloré
        doc.setFillColor(...stat.color);
        doc.rect(10, yPos - 5, 3, 8, 'F');

        // Label et valeur
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, 15, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text(String(stat.value), 105, yPos);
        
        yPos += 12;
    });

    // Produits les plus demandés
    if (data.topProducts && data.topProducts.length > 0) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Produits les plus demandés', 10, yPos);
        yPos += 10;

        data.topProducts.forEach((item, index) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `${index + 1}. ${item.product?.name || 'Inconnu'} - ${item.count} demandes`,
                15,
                yPos
            );
            yPos += 7;
        });
    }
}

/**
 * Exporte des données en Excel (CSV)
 */
export function exportToExcel(data, filename = 'export.csv') {
    try {
        if (!data || data.length === 0) {
            throw new Error('Aucune donnée à exporter');
        }

        // Convertir en CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','), // En-têtes
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Échapper les virgules et guillemets
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        // Créer le blob avec BOM UTF-8 pour Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        // Télécharger
        downloadFile(blob, filename);

        console.log('✅ Excel exporté:', filename);
        showSuccessNotification('Excel exporté avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'export Excel:', error);
        showErrorNotification('Impossible d\'exporter en Excel');
    }
}

/**
 * Exporte un graphique en image
 */
export function exportChartAsImage(chartId, filename = 'chart.png') {
    try {
        const canvas = document.getElementById(chartId);
        if (!canvas) {
            throw new Error('Graphique non trouvé');
        }

        canvas.toBlob(blob => {
            downloadFile(blob, filename);
            console.log('✅ Image exportée:', filename);
            showSuccessNotification('Image exportée avec succès');
        });

    } catch (error) {
        console.error('❌ Erreur lors de l\'export de l\'image:', error);
        showErrorNotification('Impossible d\'exporter l\'image');
    }
}

/**
 * Télécharge un fichier
 */
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Formate un nombre
 */
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Affiche une notification de succès
 */
function showSuccessNotification(message) {
    console.log(`✅ ${message}`);
    // Implémenter votre système de notifications ici
}

/**
 * Affiche une notification d'erreur
 */
function showErrorNotification(message) {
    console.error(`❌ ${message}`);
    // Implémenter votre système de notifications ici
}

/**
 * Exporte le rapport complet du dashboard
 */
export async function exportDashboardReport(stats) {
    await exportToPDF({
        title: 'Rapport du Tableau de Bord',
        data: stats,
        type: 'dashboard',
        filename: `rapport_dashboard_${new Date().toISOString().split('T')[0]}.pdf`
    });
}

/**
 * Exporte la liste des produits
 */
export async function exportProductsList(products) {
    const formatted = products.map(p => ({
        'ID': p.id,
        'Nom': p.name,
        'Catégorie': p.category?.name || '-',
        'Stock': p.quantity || 0,
        'Prix': `Ar ${p.price || 0}`,
        'Statut': p.alertLevel >= 3 ? 'Faible' : 'OK'
    }));

    await exportToPDF({
        title: 'Liste des Produits',
        data: formatted,
        type: 'table',
        filename: `produits_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
    });
}

/**
 * Exporte les requêtes
 */
export async function exportRequestsList(requests, users, products) {
    const formatted = requests.map(r => {
        const user = users.find(u => u.id === r.userId);
        const product = products.find(p => p.id === r.productId);
        
        return {
            'ID': r.id,
            'Utilisateur': user?.name || '-',
            'Produit': product?.name || '-',
            'Quantité': r.quantity,
            'Statut': r.status,
            'Date': new Date(r.createdAt).toLocaleDateString('fr-FR')
        };
    });

    await exportToPDF({
        title: 'Liste des Requêtes',
        data: formatted,
        type: 'table',
        filename: `requetes_${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
    });
}

// Export par défaut
export default {
    exportToPDF,
    exportToExcel,
    exportChartAsImage,
    exportDashboardReport,
    exportProductsList,
    exportRequestsList
};