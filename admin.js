const REPO = "axeltronic/verificar";
const FILE = "codes.json";
const BRANCH = "main";
const TOKEN = "REEMPLAZA_TU_TOKEN";

// -------------------- LOGIN --------------------
document.getElementById("btnLogin").addEventListener("click", () => {
    if (document.getElementById("adminPass").value === "keycert") {
        document.getElementById("auth").style.display = "none";
        document.getElementById("panel").style.display = "block";
        cargarLista();
    } else {
        document.getElementById("authError").style.display = "block";
    }
});

// -------------------- GENERAR CÓDIGO --------------------
function generarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// -------------------- NUEVO ALUMNO --------------------
document.getElementById("certForm").addEventListener("submit", async e => {
    e.preventDefault();

    const alumno = {
        nombre: document.getElementById("name").value,
        dni: document.getElementById("dni").value,
        curso: document.getElementById("course").value,
        modalidad: document.getElementById("modality").value,
        sede: document.getElementById("sede").value,
        finalizacion: document.getElementById("enddate").value,
        codigo: generarCodigo()
    };

    // QR
    const verifyURL = `https://axeltronic.github.io/verificar/?code=${alumno.codigo}`;
    const qr = new QRious({
        value: verifyURL,
        size: 260,
        level: "H"
    });

    document.getElementById("codeDisplay").innerText = alumno.codigo;
    document.getElementById("qrImage").src = qr.toDataURL("image/png");
    document.getElementById("result").style.display = "block";

    await guardarAlumno(alumno);
});

// -------------------- GUARDAR EN GITHUB --------------------
async function guardarAlumno(alumno) {
    const req = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`);
    const info = await req.json();

    const lista = JSON.parse(atob(info.content));
    lista.push(alumno);

    await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${TOKEN}` },
        body: JSON.stringify({
            message: "Nuevo certificado",
            content: btoa(JSON.stringify(lista, null, 2)),
            sha: info.sha,
            branch: BRANCH
        })
    });

    cargarLista();
}

// -------------------- LISTADO --------------------
async function cargarLista() {
    const resp = await fetch("codes.json?" + Date.now());
    const data = await resp.json();
    document.getElementById("list").textContent = JSON.stringify(data, null, 2);
}
