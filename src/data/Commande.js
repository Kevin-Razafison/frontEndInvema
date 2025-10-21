// Stocke les commandes avec items


// Fonction pour fetch les commandes depuis ton backend
export async function fetchOrders() {
    const token = localStorage.getItem("token");
if (!token) {
  console.warn("Aucun token trouvé, utilisateur non connecté");
  return [];
}

    try {
        const token = localStorage.getItem("token"); // JWT si authentifié
        const res = await fetch("http://localhost:4000/api/orders", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Erreur lors de la récupération des commandes");

        const data = await res.json();
        commandeOrderSimplifiees = data;

        // Exemple : parcourir toutes les commandes et leurs items
        commandeOrderSimplifiees.forEach(order => {
            console.log(`Commande #${order.id} - Status: ${order.status}`);
            order.items.forEach(item => {
                console.log(`Produit: ${item.product.name}, Quantité: ${item.quantity}`);
            });
        });

    } catch (err) {
        console.error("Erreur fetchOrders:", err);
    }
}

// Exemple d'utilisation
fetchOrders();
