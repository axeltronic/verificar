// ==================
// AUTENTICACIÓN
// ==================
const PASSWORD = "keycert";

document.getElementById("btnLogin").addEventListener("click", () => {
    const pass = document.getElementById("pass").value;

    if (pass === PASSWORD) {
        document.getElementById("auth").style.display = "none";
        document.getElementById("panel").style.display = "block";
    } else {
        document.getElementById("authError").style.display = "block";
    }
});

// ==================
// GENERAR CÓDIGO ALUMNO
// ==================
function generarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ==================
// VARIABLES GLOBALES
// ==================
let qrImage = null;

// ==================
// BOTÓN "GENERAR"
// ==================
document.getElementById("btnGenerar").addEventListener("click", async () => {

    const nombre = document.getElementById("nombre").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const curso = document.getElementById("curso").value;
    const modalidad = document.getElementById("modalidad").value;
    const sede = document.getElementById("sede").value.trim();
    const finalizacion = document.getElementById("fecha").value; // month YYYY-MM

    if (!nombre || !dni || !finalizacion) {
        alert("Completá todos los campos obligatorios.");
        return;
    }

    const codigo = generarCodigo();

    // Mostrar código
    document.getElementById("generatedCode").innerText = codigo;

    // URL CORRECTA PARA GITHUB PAGES
    const url = `https://axeltronic.github.io/verificar/?code=${codigo}`;

    // Generar QR
    const qr = new QRious({
        element: document.getElementById("qr"),
        value: url,
        size: 260,
        level: "H",
    });

    document.getElementById("qrContainer").style.display = "block";

    qrImage = document.getElementById("qr").toDataURL("image/png");

    // ==========================
    // GUARDAR EN GITHUB
    // ==========================
    const token = "TU_TOKEN_ACÁ";

    // Descargar codes.json actual
    const response = await fetch("https://raw.githubusercontent.com/axeltronic/verificar/main/codes.json?" + Date.now());
    const lista = await response.json();

    // Nuevo alumno
    const nuevoAlumno = {
        nombre,
        dni,
        curso,
        modalidad,
        sede,
        finalizacion,
        codigo
    };

    lista.push(nuevoAlumno);

    // Subir nueva versión
    await fetch("https://api.github.com/repos/axeltronic/verificar/contents/codes.json", {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: "add new student",
            content: btoa(unescape(encodeURIComponent(JSON.stringify(lista, null, 2)))),
            sha: await obtenerSHA()
        }),
    });

    alert("Alumno agregado correctamente.");
});

// ==================
// OBTENER SHA DE codes.json
// ==================
async function obtenerSHA() {
    const res = await fetch("https://api.github.com/repos/axeltronic/verificar/contents/codes.json");
    const data = await res.json();
    return data.sha;
}

// ==================
// DESCARGAR QR
// ==================
document.getElementById("btnDescargarQR").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "qr-certificado.png";
    link.href = qrImage;
    link.click();
});
