// =============================
// CONFIGURACIÓN DEL REPO GITHUB
// =============================
const REPO_OWNER = "axeltronic";
const REPO_NAME = "verificar";
const FILE_PATH = "codes.json";

// Guarda el token en memoria del navegador
let GITHUB_TOKEN = localStorage.getItem("gh_token") || null;

async function pedirToken() {
    if (!GITHUB_TOKEN) {
        GITHUB_TOKEN = prompt("Ingresá tu GitHub Token (solo la primera vez):");
        if (!GITHUB_TOKEN) {
            alert("Token necesario para guardar en GitHub.");
            throw new Error("Sin token");
        }
        localStorage.setItem("gh_token", GITHUB_TOKEN);
    }
}

// =======================================
// Generar código único (8 caracteres)
// =======================================
function generarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// =======================================
// Guardar codes.json en GitHub
// =======================================
async function guardarEnGitHub(nuevaLista) {
    await pedirToken();

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    // 1. Obtener SHA actual (si existe)
    let sha = null;
    const r = await fetch(url);
    if (r.ok) {
        const json = await r.json();
        sha = json.sha;
    }

    // 2. Preparar contenido
    const contenidoBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(nuevaLista, null, 2))));

    // 3. Enviar commit
    const resp = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Nuevo alumno agregado",
            content: contenidoBase64,
            sha: sha
        })
    });

    if (!resp.ok) {
        alert("Error guardando en GitHub");
        console.error(await resp.text());
        return false;
    }

    return true;
}

// =======================================
// Cargar lista actual de codes.json
// =======================================
async function cargarCodes() {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;
    const r = await fetch(url + "?" + Date.now());
    if (!r.ok) return [];
    return await r.json();
}

// =======================================
// Formulario ADMIN
// =======================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formAlumno");
    const qrImg = document.getElementById("qrPreview");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const dni = document.getElementById("dni").value.trim();
        const curso = document.getElementById("curso").value.trim();
        const modalidad = document.querySelector("input[name='modalidad']:checked").value;
        const sede = document.getElementById("sede").value.trim();
        const finalizacion = document.getElementById("finalizacion").value.trim();

        const codigo = generarCodigo();

        const alumno = {
            nombre,
            dni,
            curso,
            modalidad,
            sede,
            finalizacion,
            codigo
        };

        // URL final del alumno (verify)
        const urlCert = `https://axeltronic.github.io/verificar/?code=${codigo}`;

        // QR
        new QRious({
            element: qrImg,
            size: 200,
            value: urlCert
        });

        // Cargar lista actual
        const lista = await cargarCodes();
        lista.push(alumno);

        // Guardar en GitHub
        const ok = await guardarEnGitHub(lista);

        if (ok) {
            alert("Alumno guardado y QR generado");
            console.log("Guardado:", alumno);
        }
    });
});
