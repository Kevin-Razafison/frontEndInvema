import { fetchProducts } from "../../data/product.js";
import { API_URL } from "../../data/apiUrl.js";
import { renderSection } from "../utils/render.js";

let allProducts = [];
let allOrders = [];

// ============================
// ==== FETCH DATA INIT =======
async function initData() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    allProducts = await fetchProducts();

    const res = await fetch(`${API_URL}/orders`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return [];

    allOrders = await res.json();
    return allOrders;
}

// ============================
// ======= FILTRAGE ===========
function filterOrders(type) {
    if (type === "recent") {
        const now = new Date();
        return allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const diff = (now - orderDate) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        });
    } else if (type === "historique") {
        return allOrders.filter(order => order.status === "DELIVERED" || order.status === "REJECTER");
    } else {
        return allOrders;
    }
}

// ============================
// ======= FRONT HTML =========
function firstPart() {
    return `
        <div class="order-management-title">GESTION DES COMMANDES</div>
        <div class="categories-order">
            <div class="categories-choice">
                <div class="all-choice div-button active">Tout</div>
                <div class="recent div-button">Récent</div>
            </div>
            <div class="historique-command-button div-button">Historique</div>
        </div>
    `;
}

function secondPart(filteredOrders) {
    let rows = "";
    filteredOrders.forEach(order => {
        const product = order.items?.[0]?.product || {};
        rows += `
        <div class="row">
            <div class="order-id"><div class="id">${order.id}</div><div class="name-product">${product.name || "—"}</div></div>
            <div class="number-received row-content">${order.items?.[0]?.quantity || 0}</div>
            <div class="expected-Date row-content">${order.expectedDate || "—"}</div>
            <div class="status row-content">${order.status}</div>
            <div class="treshold row-content">${product.price || "—"}</div>
            <div class="actions row-content"></div>
        </div>`;
    });

    return `
    <div class="first-part part">
        <div class="title-row">
            <div class="order-id">Order ID</div>
            <div class="number-received">Received</div>
            <div class="expected-Date">Date de livraison</div>
            <div class="status">Status</div>
            <div class="treshold">Prix</div>
            <div class="actions">Actions</div>
        </div>
        <div class="row-container">${rows}</div>
    </div>`;
}

function thirdPart() {
    let rows = "";

    // On ne montre que les produits alertLevel >=3 **et non déjà commandés**
    const orderedProductIds = allOrders.flatMap(order =>
        order.items?.map(item => parseInt(item.productId))
    );

    allProducts.forEach(product => {
        if (product.alertLevel >= 3 && !orderedProductIds.includes(product.id)) {
            rows += `
            <div class="row" data-id="${product.id}" data-supplier="${product.supplierId}">
                <div class="order-id"><div class="id">${product.id}</div><div class="name-product">${product.name}</div></div>
                <div class="category row-content">${product.category?.name || "—"}</div>
                <div class="stock-count row-content">${product.quantity}</div>
                <div class="treshold row-content">${product.price}</div>
                <div class="sku row-content">${product.sku}</div>
                <div class="status row-content">${product.alertLevel}</div>
                <div class="actions row-content">
                    <button class="order-button">Order</button>
                </div>
            </div>`;
        }
    });

    return `
    <div class="second-part part">
        <div class="title-part">Low Stock Reorder Suggestions</div>
        <div class="title-row">
            <div class="order-id">ProductID</div>
            <div class="category">Categorie</div>
            <div class="stock">Stock</div>
            <div class="treshold">Prix</div>
            <div class="sku">SKU</div>
            <div class="status">Alerte</div>
            <div class="actions">Actions</div>
        </div>
        <div class="row-container">${rows}</div>
    </div>`;
}


// ============================
// ===== POPUP COMMANDE =======
function showOrderPopup(productId, supplierId) {
    const container = document.createElement("div");
    container.classList.add("popup-container");
    container.innerHTML = `
        <div class="popup">
            <h3>Commander un produit</h3>
            <p>Quantité :</p>
            <input type="number" min="1" value="1" class="qty-input" />
            <div class="popup-buttons">
                <button class="confirm">Confirmer</button>
                <button class="cancel">Annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    container.querySelector(".cancel").onclick = () => container.remove();
    container.querySelector(".confirm").onclick = async () => {
        const qty = parseInt(container.querySelector(".qty-input").value);
        await createOrder(supplierId, productId, qty);
        container.remove();
    };
}

// ============================
// ===== API CREATE ORDER =====
async function createOrder(supplierId, productId, quantity) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ supplierId, items: [{ id: productId, quantity }] }),
        });
        if (!res.ok) throw new Error("Erreur création commande");
        alert("✅ Commande envoyée !");
        CommandePannelUpdate(); // Rafraîchit les listes
    } catch (err) {
        console.error(err);
        alert("❌ Erreur lors de la commande");
    }
}

// ============================
// ===== PANEL / RENDER =======
async function CommandePannel(type = "all") {
    allOrders = await initData();
    const filtered = filterOrders(type);
    const html = `
        ${firstPart()}
        ${secondPart(filtered)}
        ${thirdPart()}
    `;
    return renderSection("order-management-container", html);
}

// ============================
// ===== UPDATE PANEL ========
function CommandePannelUpdate(type = "all") {
    const container = document.querySelector(".order-management-container");
    if (!container) return;

    const filtered = filterOrders(type);
    container.innerHTML = `
        ${firstPart()}
        ${secondPart(filtered)}
        ${thirdPart()}
    `;
    attachEvents();
}

// ============================
// ===== EVENT HANDLERS =======
function attachEvents() {
    document.querySelector(".all-choice")?.addEventListener("click", () => CommandePannelUpdate("all"));
    document.querySelector(".recent")?.addEventListener("click", () => CommandePannelUpdate("recent"));
    document.querySelector(".historique-command-button")?.addEventListener("click", () => CommandePannelUpdate("historique"));

    // bouton "Order" dans thirdPart
    document.querySelectorAll(".second-part .order-button").forEach(btn => {
        btn.onclick = (e) => {
            const row = e.target.closest(".row");
            const id = parseInt(row.dataset.id);
            const supplierId = parseInt(row.dataset.supplier);
            showOrderPopup(id, supplierId);
        };
    });
}

// ============================
// ===== EXPORT ===============
export { CommandePannel, CommandePannelUpdate };
