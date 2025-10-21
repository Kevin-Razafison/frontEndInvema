import { API_URL } from "../data/apiUrl.js";

const token = localStorage.getItem("token");
let payload = JSON.parse(atob(token.split(".")[1]));
let fetchNotifications;
if(payload.role ==="ADMIN"){
const notificationContainer = document.querySelector(".notification-container");
const notificationIcon = notificationContainer.querySelector("img");
const notificationDropdown = notificationContainer.querySelector(".notification-dropdown");

let latestNotifications = [];

fetchNotifications = async function () {
  try {
    const res = await fetch(`${API_URL}orders/notifications`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    if (!res.ok) return;
    const notifications = await res.json();
    latestNotifications = notifications;

    const badge = notificationContainer.querySelector(".notification-badge");
    if (notifications.length > 0) {
      if (!badge) {
        const newBadge = document.createElement("div");
        newBadge.classList.add("notification-badge");
        notificationContainer.appendChild(newBadge);
      }
      notificationContainer.querySelector(".notification-badge").textContent = notifications.length;
    } else {
      if (badge) badge.remove();
    }
  } catch (err) {
    console.error("Erreur fetching notifications", err);
  }
}

// Dropdown au click
notificationIcon.addEventListener("click", () => {
  if (notificationDropdown.style.display === "block") {
    notificationDropdown.style.display = "none";
  } else {
    notificationDropdown.innerHTML = latestNotifications.map(n => `
      <div class="notif-item ${n.status.toLowerCase()}">
        Commande #${n.id} de ${n.supplier.name} : ${n.status}
      </div>
    `).join("");
    notificationDropdown.style.display = "block";

    // Supprime badge
    const badge = notificationContainer.querySelector(".notification-badge");
    if (badge) badge.remove();
  }
});

// Polling toutes les 10 secondes
setInterval(fetchNotifications, 10000);
fetchNotifications();
}
