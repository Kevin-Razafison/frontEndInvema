// src/views/wait.views.js
import { renderSection } from "../utils/render.js";

export function waitView() {
    console.log("wait");
    return renderSection("wait-screen",
        `<div class="loader-container">
            <div class="loader">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="loading-text">Chargement...</div>
        </div>
        `
    );
}
