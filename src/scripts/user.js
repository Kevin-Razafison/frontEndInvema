import { API_URL } from "../data/apiUrl.js";
import { fetchProducts } from "../data/product.js";

  const token = localStorage.getItem("token");
  if (token) {
    // Si déjà connecté, évite de retourner sur login
    const role = localStorage.getItem("role");
    if (role === "ADMIN") {
      window.location.replace("./index.html#/");
    } else {
      window.location.replace("./user.html");
    }
  }

const addRequestBtn = document.querySelector(".add-request");

addRequestBtn.addEventListener("click", async () => {
  // Supprimer le modal existant si déjà présent
  const existingModal = document.querySelector(".request-popup");
  if (existingModal) existingModal.remove();

  // Créer le conteneur du modal
  const modal = document.createElement("div");
  modal.classList.add("request-popup");
  Object.assign(modal.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  });

  // Créer le contenu
  const content = document.createElement("div");
  Object.assign(content.style, {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  });

  content.innerHTML = `
    <h3>Nouvelle demande</h3>
    <label>Produit :
      <select id="request-productId"></select>
    </label>
    <label>Quantité :
      <input type="number" id="request-quantity" min="1" placeholder="Quantité"/>
    </label>
    <label>Raison :
      <input id="request-reason" placeholder="Raison de la demande">
    </label>
    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
      <button id="request-submit" style="background:#28a745;color:#fff;padding:5px 10px;border:none;border-radius:5px;cursor:pointer;">Envoyer</button>
      <button id="request-cancel" style="background:#dc3545;color:#fff;padding:5px 10px;border:none;border-radius:5px;cursor:pointer;">Annuler</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Remplir le select avec les produits
  const productSelect = document.querySelector("#request-productId");
  const products = await fetchProducts();
  productSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // Gestion fermeture modal
  document.getElementById("request-cancel").addEventListener("click", () => modal.remove());

  // Envoi de la demande
  document.getElementById("request-submit").addEventListener("click", async () => {
    const products = await fetchProducts();
    const productId = productSelect.value;
    console.log(productId);
    const quantityElement = document.querySelector("#request-quantity");
    let quantity = Number(quantityElement.value)
    console.log(quantity);
    const reasonElement = document.getElementById("request-reason");
    let reason = reasonElement.value;
    console.log(reason);

    if (!productId || !quantity || !reason) return alert("Tous les champs sont requis !");

    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity, reason, userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      alert("Demande créée avec succès !");
      modal.remove();
      console.log(data); // tu peux mettre à jour la liste des demandes ici
    } catch (err) {
      console.error(err);
      alert("Erreur : " + err.message);
    }
  });
});
