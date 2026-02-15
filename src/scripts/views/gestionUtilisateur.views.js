import { API_URL } from "../../data/apiUrl.js";
import { popUp } from "../utils/popUp.js";
import { Users, createUser, updateUser, deleteUser } from "../../data/Users.js";
import { renderSection, render } from "../utils/render.js";
import { interactiveNavBar } from "./NavBar.views.js";
import { form, togglePasswordVisibility } from "../utils/renderForm.js";

let users = [];

async function loadUsers() {
    users = await Users();
    return users;
}

export async function gestionUtilisateur() {
    await loadUsers();
    let usersListHTML = '';
    users.forEach((user, index) => {
        usersListHTML += `
            <div class="list-users-row" data-user-id="${user.id}">
                <div class="user-id-column">
                    ${index + 1}
                </div>
                <div class="user-name-column">
                    ${user.name}
                </div>
               <div class="user-permission-type-column">
                    <div class="role-${user.role.toLowerCase()}">${user.role}</div>
                </div>
                <div class="actions">
                    <div class="delete-user-button button" data-user-id="${user.id}">
                        <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                    </div>
                    <div class="modify-user" data-user-id="${user.id}"><img src="src/icons/icons-3-dots.png" alt=""></div>
                </div>
            </div>
        `;
    });

    let AllPartHTML = `
        <div class="pannel-title">
            GESTION DES UTILISATEURS
        </div>
        <div class="ajouter-utilisateurs filter-container">
            <button>Ajouter utilisateur</button>
            <div class="filter-button-container">
                <button class="admin-filter filter admin" data-is-active="false">Admin</button>
                <button class="employe-filter filter employe" data-is-active="false">Employe</button>
                <button class="all-filter filter is-filter-active all" data-is-active="true">Tous les utilisateurs</button>
            </div>
        </div>
        <div class="list-users-containers">
            <div class="list-users-title">
                <div class="user-id-column">
                    User ID
                </div>
                <div class="user-name-column">
                    User name
                </div>
                <div class="user-permission-type-column">
                    permission
                </div>
                <div class="actions">
                    action
                </div>
            </div>
            <div class="list-html-container">
                ${usersListHTML}
            </div>
        </div>
    `;
    return renderSection("utilisateur-pannel-container", AllPartHTML);
}

export function filter(elementToFilter, elementClassName) {
    if (!document.querySelector('.utilisateur-pannel-container')) return;

    function removeClass() {
        document.querySelectorAll(".filter").forEach(filter => {
            filter.classList.remove("is-filter-active");
        });
    }

    const button = document.querySelector("." + elementClassName);
    if (!button) return;

    button.addEventListener("click", async () => {
        if (button.dataset.isActive === "true") return;

        removeClass();
        button.classList.add("is-filter-active");

        const users = await Users();
        let index = 0;
        let usersHTML = "";

        users.forEach(user => {
            if (elementToFilter === "ALL" || user.role === elementToFilter) {
                index++;
                usersHTML += `
                    <div class="list-users-row" data-user-id="${user.id}">
                        <div class="user-id-column">${index}</div>
                        <div class="user-name-column">${user.name}</div>
                        <div class="user-permission-type-column"><div>${user.role}</div></div>
                        <div class="actions">
                            <div class="delete-user-button button" data-user-id="${user.id}">
                                <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                            </div>
                            <div class="modify-user" data-user-id="${user.id}"><img src="src/icons/icons-3-dots.png" alt=""></div>
                        </div>
                    </div>
                `;
            }
        });

        document.querySelectorAll(".filter").forEach(f => f.dataset.isActive = "false");
        button.dataset.isActive = "true";
        let listContainer = document.querySelector('.list-html-container');
        if (listContainer) {
            listContainer.innerHTML = usersHTML;
            modifyButton();
            activeDeleteButton();
        }
    });
}

export function modifyButton() {
    let labelList = [{
        name: "Nom",
        className: "nom-utilisateur-input Nom",
        placeholder: "Utilisateur",
        type: "text",
    },
    {
        name: "Email",
        className: "email-utilisateur-input Email",
        placeholder: "example@email.com",
        type: "email"
    },
    {
        name: "Mot de passe",
        className: "password-input Password",
        className1: "password-input",
        placeholder: "Laisser vide si inchangé",
        type: "password",
    },
    {
        name: "Role",
        className: "role-input Role",
        placeholder: "",
        type: "select",
        op: ["ADMIN", "MAGASINIER", "EMPLOYE"]
    }];

    let buttonAddList = [
        { name: "Modifier", className: "modify-user-btn" },
        { name: "Annuler", className: "annuler" }
    ];

    const modifyButtons = document.querySelectorAll(".modify-user");
    modifyButtons.forEach(modify => {
        modify.addEventListener("click", async () => {
            const id = modify.dataset.userId;
            const formHTML = form("Modifier Utilisateur", labelList, buttonAddList);
            document.body.innerHTML += formHTML;
            await processModify(id);
            togglePasswordVisibility("password-input");
        });
    });
}

async function processModify(id) {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    const formContainer = formSection.querySelector('.form-container');
    const inputs = formSection.querySelectorAll("input");
    const selectHTML = formSection.querySelector("select");
    const add = formSection.querySelector('.modify-user-btn');
    const cancel = formSection.querySelector('.annuler');
    const usersList = await Users();
    let userPassword;

    usersList.forEach(user => {
        if (user.id === Number(id)) {
            inputs[0].value = user.name;
            inputs[1].value = user.email;
            // password laissé vide
            userPassword = user.password;
            // sélectionner le rôle
            const options = selectHTML.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === user.role) {
                    options[i].selected = true;
                    break;
                }
            }
        }
    });

    cancel.addEventListener('click', () => {
        formSection.remove();
        addUsers();
        modifyButton();
        interactiveNavBar();
        filter("ADMIN", "admin-filter");
        filter("EMPLOYE", "employe-filter");
        filter("ALL", "all-filter");
    });

    add.addEventListener("click", async () => {
        const name = inputs[0].value;
        const email = inputs[1].value;
        let password = inputs[2].value;
        const role = selectHTML.value;

        if (!name || !email) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        const updateData = { name, email, role };
        if (password) {
            updateData.password = password;
        }

        try {
            const updated = await updateUser(id, updateData);
            if (updated) {
                formSection.remove();
                refreshAfterModify();
                interactiveNavBar();
                filter("ADMIN", "admin-filter");
                filter("EMPLOYE", "employe-filter");
                filter("ALL", "all-filter");
                modifyButton();
                addUsers();
            } else {
                throw new Error("Échec de la modification");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la modification");
        }
    });
}

export async function activeDeleteButton() {
    const deleteButtons = document.querySelectorAll(".delete-user-button");
    deleteButtons.forEach(deleteButton => {
        let id = Number(deleteButton.dataset.userId);
        deleteButton.addEventListener("click", () => {
            document.body.innerHTML += popUp("Supprimer Utilisateur", "Voulez-vous vraiment supprimer l'utilisateur?", "popUp-supprimer-utilisateur");
            const popup = document.querySelector(".popUp-supprimer-utilisateur");
            if (!popup) return;
            popup.querySelector(".Annuler")?.addEventListener("click", () => {
                popup.remove();
                interactiveNavBar();
                addUsers();
                modifyButton();
                activeDeleteButton();
                filter("ADMIN", "admin-filter");
                filter("EMPLOYE", "employe-filter");
                filter("ALL", "all-filter");
            });
            popup.querySelector(".confirmer")?.addEventListener("click", async () => {
                try {
                    const success = await deleteUser(id);
                    if (success) {
                        popup.remove();
                        refreshAfterModify();
                    } else {
                        alert("Impossible de supprimer l'utilisateur");
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        });
    });
}

async function refreshAfterModify() {
    const filterElements = document.querySelectorAll(".filter");
    for (const filterEl of filterElements) {
        if (filterEl.dataset.isActive === "true") {
            const users = await Users();
            let index = 0;
            let usersHTML = '';

            if (filterEl.classList.contains("all")) {
                users.forEach(user => {
                    index++;
                    usersHTML += userRowHTML(user, index);
                });
            } else if (filterEl.classList.contains("admin")) {
                users.forEach(user => {
                    if (user.role === "ADMIN") {
                        index++;
                        usersHTML += userRowHTML(user, index);
                    }
                });
            } else if (filterEl.classList.contains("employe")) {
                users.forEach(user => {
                    if (user.role === "EMPLOYE") {
                        index++;
                        usersHTML += userRowHTML(user, index);
                    }
                });
            }

            let listContainer = document.querySelector('.list-html-container');
            if (listContainer) {
                listContainer.innerHTML = usersHTML;
                addUsers();
                modifyButton();
                activeDeleteButton();
            }
        }
    }
}

function userRowHTML(user, index) {
    return `
        <div class="list-users-row" data-user-id="${user.id}">
            <div class="user-id-column">${index}</div>
            <div class="user-name-column">${user.name}</div>
            <div class="user-permission-type-column"><div>${user.role}</div></div>
            <div class="actions">
                <div class="delete-user-button button" data-user-id="${user.id}">
                    <img src="./src/icons/icons-delete.png" alt="delete" class="delete-button">
                </div>
                <div class="modify-user" data-user-id="${user.id}"><img src="src/icons/icons-3-dots.png" alt=""></div>
            </div>
        </div>
    `;
}

export function addUsers() {
    if (!document.querySelector('.utilisateur-pannel-container')) return;

    let labelList = [{
        name: "Nom",
        className: "nom-utilisateur-input Nom",
        placeholder: "Utilisateur",
        type: "text",
    },
    {
        name: "Email",
        className: "email-utilisateur-input Email",
        placeholder: "example@email.com",
        type: "email"
    },
    {
        name: "Mot de passe",
        className: "password-input Password",
        className1: "password-input",
        placeholder: "Mot de passe",
        type: "password",
    },
    {
        name: "Role",
        className: "role-input Role",
        placeholder: "",
        type: "select",
        op: ["ADMIN", "MAGASINIER", "EMPLOYE"]
    }];

    let buttonAddList = [
        { name: "Ajouter", className: "add-user-btn" },
        { name: "Annuler", className: "annuler" }
    ];

    let UserAddButton = document.querySelector(".ajouter-utilisateurs button");
    if (UserAddButton) {
        UserAddButton.addEventListener('click', () => {
            const formHTML = form("Ajouter un Utilisateur", labelList, buttonAddList);
            document.body.innerHTML += formHTML;
            attachAddFormEvents();
            togglePasswordVisibility("password-input");
        });
    }
}

function attachAddFormEvents() {
    const formSection = document.querySelector('.form');
    if (!formSection) return;
    const inputs = formSection.querySelectorAll("input");
    const selectHTML = formSection.querySelector("select");
    const addBtn = formSection.querySelector('.add-user-btn');
    const cancel = formSection.querySelector('.annuler');

    cancel.addEventListener('click', () => {
        formSection.remove();
        addUsers();
        modifyButton();
        activeDeleteButton();
        interactiveNavBar();
        filter("ADMIN", "admin-filter");
        filter("EMPLOYE", "employe-filter");
        filter("ALL", "all-filter");
    });

    addBtn.addEventListener('click', async () => {
        const name = inputs[0].value;
        const email = inputs[1].value;
        const password = inputs[2].value;
        const role = selectHTML.value;

        // Validation
        if (!name || !email || !password || !role) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        if (password.length < 8) {
            alert("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert("Email invalide");
            return;
        }

        try {
            const newUser = await createUser({ name, email, password, role });
            if (newUser) {
                formSection.remove();
                await refreshAfterAdd(newUser);
            } else {
                throw new Error("Échec de la création");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création");
        }
    });
}

async function refreshAfterAdd(newUser) {
    await loadUsers();
    const filterElements = document.querySelectorAll(".filter");
    for (const filterEl of filterElements) {
        if (filterEl.dataset.isActive === "true") {
            const users = await Users();
            let index = 0;
            let usersHTML = '';
            if (filterEl.classList.contains("all")) {
                users.forEach(user => {
                    index++;
                    usersHTML += userRowHTML(user, index);
                });
            } else if (filterEl.classList.contains("admin")) {
                users.forEach(user => {
                    if (user.role === "ADMIN") {
                        index++;
                        usersHTML += userRowHTML(user, index);
                    }
                });
            } else if (filterEl.classList.contains("employe")) {
                users.forEach(user => {
                    if (user.role === "EMPLOYE") {
                        index++;
                        usersHTML += userRowHTML(user, index);
                    }
                });
            }
            let listContainer = document.querySelector('.list-html-container');
            if (listContainer) {
                listContainer.innerHTML = usersHTML;
                addUsers();
                modifyButton();
                activeDeleteButton();
            }
        }
    }
}