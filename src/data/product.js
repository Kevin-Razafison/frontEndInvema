import { API_URL } from "./apiUrl.js"

export async function fetchProducts() {
    const token = localStorage.getItem("token");
if (!token) {
  console.warn("Aucun token trouvé, utilisateur non connecté");
  return [];
}

    try {
        const token = localStorage.getItem("token");
        const res = await fetch (`${API_URL}/products`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization" : `Bearer ${token}`
            },
        });
        if(!res.ok) throw new Error("Erreur lors de la récupếration des produits");

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(err);
    }
}
/*
[
    {
        id:1,
        reference: "12",
        name:'akondro',
        category : 'Quincaillerie',
        prixUnitaire: 1200,
        quantite: 14,
        status: 'low',
        fournisseursPrincipal: "HP",
        localisationPhysique : "Enrepot A, étagère3, rayon B",
        img : "images.jpeg",
        seuilAlerte: '14',
        description: "tsy fanaovana alony e"
    }
]
*/