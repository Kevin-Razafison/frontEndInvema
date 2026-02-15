import { renderFournisseur } from "../utils/renderFournisseur.js";
import { renderProduct } from "../utils/renderProducInfo.js";
import { categories } from "../views/categories.views.js";
import { CommandePannel } from "../views/commandes.views.js";
import { DashBoard } from "../views/dashboard.views.js";
import { fournisseurs } from "../views/fournisseurs.views.js";
import { gestionUtilisateur } from "../views/gestionUtilisateur.views.js";
import { productList } from "../views/productList.views.js";
import { waitView } from "../utils/wait.js";

export const views = {
    "#/": async () => `${await DashBoard()}`, // dashboard par défaut pour admin
    "#/simpleUser": async () => `${await productList()}`,   
    "#/categories": async () => `${await categories()}`,
    "#/commandes": async () => `${await CommandePannel()}`,
    "#/dashboard": async () => `${await DashBoard()}`,
    "#/fournisseurs": async () => `${await fournisseurs()}`,
    "#/utilisateur": async () => `${await gestionUtilisateur()}`,
    "#/categories/productList": async () => `${await productList()}`,
    "#/productList": async () => `${await productList()}`,
    "#/fournisseurs/pannel": async (id) => `${await renderFournisseur(id)}`,
    "#/productList/Pannel": async (id) => `${await renderProduct(id)}`
};