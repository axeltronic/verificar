// =============================
// CONFIGURACIÓN
// =============================

const ADMIN_HASH = "4d1ee6ff3fbc0e5efbe2e53ab9779e155a278feacf840e563b5d87d28b07c795";

// =============================
// HASH FUNCTION
// =============================
async function sha256(msg) {
    const msgUint8 = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

// =============================
// LOGIN
// =============================
document.getElementById("btnLogin").addEventListener("click", async () => {
    const pass = document.getElementById("pass").value;
    const hash = await sha256(pass);

    if (hash === ADMIN_HASH) {
        document.getElementById("auth").style.display = "none";
        document.getElementById("panel").style.display = "block";
    } else {
        document.getElementById("authError").style.display = "block";
    }
});

// =============================
// GENERAR ID
// =============================
function generarID() {
    return crypto.randomUUID().split("-")[0].toUpperCase();
}

// =============================
// TEXTO CENTRAL EN EL QR
// =============================
function agregarTextoCentral(canvas, texto) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.globalAlpha = 0.85;

    const h = 40;
    ctx.fillRect(0, canvas.height / 2 - h / 2, canvas.width, h);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2 + 8);
}

// =============================
// GENERAR CERTIFICADO
// =============================
document.getElementById("btnGenerar").addEventListener("click", async () => {
    const nombre = document.getElementById("nombre").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const curso = document.getElementById("curso").value;
    const modalidad = document.getElementById("modalidad").value;
    const sede = document.getElementById("sede").value.trim();
    const fecha = document.getElementById("fecha").value;

    if (!nombre || !dni || !sede || !fecha) {
        alert("Faltan datos");
        return;
    }

    const id = generarID();
    const url = `https://axeltronic.com.ar/verificar?code=${id}`;

    const qr = new QRious({
        element: document.getElementById("qr"),
        value: url,
        size: 300
    });

    // texto central
    agregarTextoCentral(document.getElementById("qr"), "axeltronic.com.ar/verificar");

    document.getElementById("generatedCode").textContent = id;
    document.getElementById("qrContainer").style.display = "block";

    // descargar
    document.getElementById("btnDescargarQR").onclick = function () {
        const link = document.createElement("a");
        link.download = `${nombre}-${id}.png`;
        link.href = document.getElementById("qr").toDataURL();
        link.click();
    };

    // hash del DNI
    const dniHash = await sha256(dni);

    const entry = {
        id,
        nombreCompleto: nombre,
        dni: dniHash,
        curso,
        modalidad,
        sede,
        fechaFinalizacion: fecha
    };

    console.log("COPIAR ESTA ENTRADA EN codes.json:", entry);
    alert("QR generado. El JSON está en la consola.");
});
