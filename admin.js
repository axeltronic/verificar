// ======================================
//  AUTENTICACIÓN - PASSWORD REAL
// ======================================
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


// ======================================
//   GENERADOR DE CÓDIGOS
// ======================================
function generarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}


// ======================================
//   GENERAR QR + MOSTRAR INFO
// ======================================
let qrImage = null;

document.getElementById("btnGenerar").addEventListener("click", () => {

    const alumno = {
        id: generarCodigo(),
        nombreCompleto: document.getElementById("nombre").value,
        dni: document.getElementById("dni").value,
        curso: document.getElementById("curso").value,
        modalidad: document.getElementById("modalidad").value,
        sede: document.getElementById("sede").value,
        finalizacion: document.getElementById("fecha").value,
    };

    document.getElementById("generatedCode").innerText = alumno.id;

    const url = `https://axeltronic.com.ar/verificar?code=${alumno.id}`;

    const qr = new QRious({
        element: document.getElementById("qr"),
        value: url,
        size: 260,
        level: "H"
    });

    document.getElementById("qrContainer").style.display = "block";

    qrImage = document.getElementById("qr").toDataURL("image/png");
});


// ======================================
//    DESCARGAR QR
// ======================================
document.getElementById("btnDescargarQR").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "qr-certificado.png";
    link.href = qrImage;
    link.click();
});
