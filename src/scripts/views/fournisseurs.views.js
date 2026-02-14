import { render, renderSection } from "../utils/render.js";
import { fournisseursCards, createSupplier } from "../../data/Fournisseurs.js";
import { form } from "../utils/renderForm.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { API_URL, getImageUrl } from "../../data/apiUrl.js";
import { categorieList } from "../../data/categoriesList.js";

function navigate(route) {    
    window.location.hash = route
}

let fournisseursCards2 = [];

export async function fournisseurs() {
    fournisseursCards2 = await fournisseursCards();
    const fournisseursCardsHTML = fournisseursCards2.map(card => `
        <div class="fournisseurs-card" data-id="${card.id}">
            <div class="image-container">
                <img src="${getImageUrl(card.imageUrl)}" loading="lazy" alt="fournisseurs-logo" onerror="this.src='./src/images/placeholder.png'">
            </div>
            <div class="entreprise-name">
                ${card.name}
            </div>
            <div class="type-materiels-fourni">
                ${card.category}
            </div>
        </div>
    `).join('');

    let fournisseursHTML = `
        <div class="fournisseurs-title">
            <div>
                LISTE DES FOURNISSEURS
            </div>
        </div>
        <div class="list-fournisseur">
            <div class="add-fournisseur">
                <img src="./src/icons/icons-add.png">
                <div>Ajouter</div>
            </div>
            ${fournisseursCardsHTML}
        </div>
    `;
    return renderSection("fournisseurs-container", fournisseursHTML);
}

export async function addFournisseur() {
    if (!document.querySelector(".fournisseurs-container")) return;

    const addButton = document.querySelector('.add-fournisseur');
    if (!addButton) return;

    const categories = await categorieList();
    const categoriesNameList = categories.map(c => c.name);

    const labelList = [{
        name: "Entrer le nom du fournisseur",
        className: "nom-fournisseur-input Nom",
        placeholder: "fournisseur",
        type: "text",
    },
    {
        name: "Téléphone",
        className: "phone-fournisseur-input Telephone",
        placeholder: "+261",
        type: "tel"
    },
    {
        name: "Email",
        className: "email-fournisseur-input Email",
        placeholder: "example@email.com",
        type: "email"
    },
    {
        name: "Adresse",
        className: "adresse-fournisseur-input Adresse",
        placeholder: "lot",
        type: "text",
    },
    {
        name: "Image",
        className: "image-fournisseur-input Image",
        placeholder: "",
        type: "file",
        accept: "image/*"
    },
    {
        name: "Catégorie",
        className: "category-fournisseur-input category",
        type: "select",
        op: categoriesNameList
    }];

    let buttonList = [
        {
            name: "Ajouter",
            className: "add-fournisseur-btn"
        },
        {
            name: "Annuler",
            className: "annuler"
        }
    ];

    addButton.addEventListener('click', () => {
        document.body.innerHTML += form('Ajouter Fournisseur', labelList, buttonList);
        attachFormEvents();
    });
}

function attachFormEvents() {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    const formContainer = formSection.querySelector('.form-container');
    const inputs = formSection.querySelectorAll("input");
    const addBtn = formSection.querySelector('.add-fournisseur-btn');
    const cancel = formSection.querySelector('.annuler');
    const select = formSection.querySelector("select");

    cancel.addEventListener('click', () => {
        formSection.remove();
        activateFournisseursButton();
        addFournisseur();
        interactiveNavBar();
    });

    addBtn.addEventListener('click', async () => {
        const name = inputs[0].value;
        const phone = inputs[1].value;
        const email = inputs[2].value;
        const address = inputs[3].value;
        const imageFile = inputs[4].files[0];
        const category = select.value;

        // Validation basique
        if (!name || !phone || !email || !address || !imageFile || !category) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        // Validation email
        if (!email.includes('@') || !email.includes('.')) {
            alert("Email invalide");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("phone", phone);
            formData.append("email", email);
            formData.append("address", address);
            formData.append("category", category);
            formData.append("image", imageFile);

            const newSupplier = await createSupplier(formData);
            if (newSupplier) {
                formSection.remove();
                refreshFournisseurs();
            } else {
                throw new Error("Échec de la création");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création du fournisseur");
        }
    });
}

async function refreshFournisseurs() {
    try {
        const fournisseurData = await fournisseursCards();
        const container = document.querySelector(".fournisseurs-container");
        if (!container) return;

        container.innerHTML = fournisseurData
            .map(card => `
                <div class="fournisseurs-card" data-id="${card.id}">
                    <div class="image-container">
                        <img src="${getImageUrl(card.imageUrl)}" loading="lazy" alt="fournisseurs-logo" onerror="this.src='./src/images/placeholder.png'">
                    </div>
                    <div class="entreprise-name">
                        ${card.name}
                    </div>
                    <div class="type-materiels-fourni">
                        ${card.category}
                    </div>
                </div>
            `)
            .join("");

        activateFournisseursButton();
        addFournisseur();
        interactiveNavBar();
    } catch (err) {
        console.error(err);
    }
}

export function activateFournisseursButton() {
    if (!document.querySelector('.fournisseurs-container')) return;

    const allCards = document.querySelectorAll(".fournisseurs-card");
    allCards.forEach((card) => {
        card.addEventListener("click", async () => {
            const id = card.dataset.id;
            if (id) {
                render(`#/fournisseurs/pannel`, parseInt(id));
            }
        });
    });
}