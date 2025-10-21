import { API_URL } from "./apiUrl.js";


export async function categorieList() {
    const token = localStorage.getItem("token");
if (!token) {
  console.warn("Aucun token trouvé, utilisateur non connecté");
  return [];
}

    try {

        const token = localStorage.getItem("token");
        const res = await fetch (`${API_URL}/categories`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if(!res.ok) throw new Error("Erreur lors de la récupération des produits");

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

