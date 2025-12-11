// =============================
// CONFIGURACIÓN DEL REPO GITHUB
// =============================
const REPO_OWNER = "axeltronic";
const REPO_NAME = "verificar";
const FILE_PATH = "codes.json";

// Guarda o carga token almacenado
let GITHUB_TOKEN = localStorage.getItem("gh_token") || null;

async function pedirToken() {
    if (!GITHUB_TOKEN) {
        GITHUB_TOKEN = prompt("Ingresá tu GitHub Token (solo la primera vez):");

        if (!GITHUB_TOKEN || GITHUB_TOKEN.trim() === "") {
            alert("Token necesario para guardar alumnos.");
            throw new Error("Falta token");
        }

        localStorage.setItem("gh_token", GITHUB_TOKEN);
    }
}

// =======================================
// Generar código único de 8 caracteres
// =======================================
function generarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// =======================================
// Cargar codes.json actual
// =======================================
async function cargarCodes() {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${FILE_PATH}`;
    const r = await fetch(url + "?" + Date.now());
    if (!r.ok) return [];
    return await r.json();
}

// =======================================
// Guardar codes.json en GitHub
// =======================================
async function guardarEnGitHub(nuevaLista) {
    await pedirToken();

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    // Obtener SHA actual
    let sha = null;
    const r = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });

    if (r.ok) {
        const json = await r.json();
        sha = json.sha;
    }

    // Preparar contenido JSON en base64
    const contenido = JSON.stringify(nuevaLista, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(contenido)));

    // Commit
    const resp = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Nuevo alumno agregado",
            content: base64Content,
            sha: sha
        })
    });

    if (!resp.ok) {
        console.error(await resp.text());
        alert("Error guardando en GitHub.");
        return false;
    }

    return true;
}

// =======================================
// FORMULARIO ADMIN
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

        // Cargar lista actual
        const lista = await cargarCodes();

        // ================================
        // PREVENIR REGISTROS DUPLICADOS
        // ================================
        const yaExiste = lista.some(a => a.dni === dni);

        if (yaExiste) {
            alert("⚠ Ya existe un alumno registrado con ese DNI. No se puede repetir.");
            return;
        }

        // Agregar alumno nuevo
        lista.push(alumno);

        // Guardar en GitHub
        const ok = await guardarEnGitHub(lista);

        if (!ok) return;

        // URL final con código
        const urlCert = `https://axeltronic.github.io/verificar/?code=${codigo}`;

        // Generar QR
        new QRious({
            element: qrImg,
            size: 200,
            value: urlCert
        });

        alert("Alumno guardado correctamente. QR generado.");
        console.log("Guardado:", alumno);
    });
});
