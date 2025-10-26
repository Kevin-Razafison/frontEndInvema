// views/dashboard.views.js
import { afficheCards } from "../../data/Dashboard.js";
import { fetchProducts } from "../../data/product.js";
import { fetchRequests } from "../../data/request.js";
import { Users } from "../../data/Users.js";
import { renderSection } from "../utils/render.js";
 const stock = await fetchProducts();       // tableau de produits
  const requests = await fetchRequests();    // tableau de demandes
  const users = await Users();  
export async function DashBoard() {
              // tableau d'utilisateurs

  // Low stocks
  const LowStocks = stock.filter(p => p.alertLevel >= 3);

  // Note: Pour Pending on vérifie les commandes qui peuvent être liées via orderItems
  // Ici je fais une estimation : si tu as un champ "status" dans order lié au product,
  // il faut adapter selon ta relation DB. Je laisse simple : stockPending = 0 (à adapter)
  const StockPending = stock.filter(p => {
    // si product a orderItems et l'un des order.status === "PENDING"
    if (!p.orderItems) return false;
    return p.orderItems.some(oi => oi.order && oi.order.status === "PENDING");
  });

  // Requests pending (vérifier requests)
  const requestPending = requests.filter(r => r.status === "PENDING");

  // Total price (somme des prix * quantité si souhaité) — ici somme des prix simples
  let priceTotal = stock.reduce((acc, p) => acc + (Number(p.price) || 0), 0);

  // Construire les cards à partir de afficheCards (on corrige l'index starting 0)
  let cardsHtml = afficheCards.map((card, idx) => {
    let value = "";
    switch (idx) {
      case 0:
        value = LowStocks.length;
        break;
      case 1:
        value = StockPending.length;
        break;
      case 2:
        value = requestPending.length;
        break;
      case 3:
        value = "Ar " + priceTotal;
        break;
      default:
        value = "";
    }
    return `
      <div class="affiche-card affiche-card-${idx}">
        <div class="affiche-card-title">${card.title}</div>
        <div class="count-items">${value}</div>
        <img src="./src/icons/${card.icon}" alt="${card.title}" class="icon-representation">
        <img src="./src/icons/icons-trading.png" alt="trading" class="icon-trading">
      </div>
    `;
  }).join("");

  // Recent activity list (on affiche les requests récentes)
  const recentActivityListItemHTML = requests.map(Item => {
    const userObj = users.find(u => u.id === Item.userId);
    const productObj = stock.find(p => p.id === Item.productId);
    const userName = userObj ? userObj.name : "—";
    const productName = productObj ? productObj.name : "—";
    const date = Item.createdAt;
    const safeDate = new Date(date);
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
    return `
      <div class="recent-activity-card-list-element">
        <img src="./src/icons/icons-quest.png" alt="request">
        <div class="user-name-requester">${userName}</div>
        <div class="quantity-request">quantité demander: ${Item.quantity || "—"}</div>
        <div class="type-request">${Item.status || "—"}</div>
        <div class="date-request">${formatter.format(safeDate) || "—"}</div>
        <div class="product-name-request">produit: ${productName}</div>
        <div class="id-request">id: ${Item.id}</div>
        <div class="product-name-request"><button class="approuver-button-y">Approuver</button></div>
      </div>
    `;
  }).join("");

  const firstPart = `
    <div class="title-of-section">Overview</div>
    <div class="content-container">${cardsHtml}</div>
  `;

  const secondPart = `
    <div class="title-of-section">Speed Review</div>
    <div class="recent-activity-container">
      <div class="recent-activity-card">
        <div class="recent-activity-card-title">ACTIVITÉS RÉCENTES</div>
        ${recentActivityListItemHTML}
      </div>
    </div>
  `;

  return `
    ${renderSection("", firstPart)}
    ${renderSection("", secondPart)}
  `;
}
