import { API_URL } from "./apiUrl.js";


export async function fournisseursCards() {
    const token = localStorage.getItem("token");
if (!token) {
  console.warn("Aucun token trouvé, utilisateur non connecté");
  return [];
}

    try {

        const token = localStorage.getItem("token");
        const res = await fetch (`${API_URL}/supplier`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });
        if(!res.ok) throw new Error("Erreur lors de la récupération des fournisseurs");

        const data = await res.json();
        console.log("fournisseurs :", data);

        return data;
    } catch (err) {
        console.error(err);
    }
}



/*
[
    {
        id: 1,
        fournisseursName : "HP",
        typeFourni: "Consummable informatique",
        logo: "hp-logo.png",
        backgroundImg: "hp-logo.png",
        contact: "+261 33 95 004 47",
        email: "hpakondro@gmail.com",
        adresse: "lot IAH 127C avaratsena",
    }
]
*/ 