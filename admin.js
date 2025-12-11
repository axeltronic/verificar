// ==========================
// 🔐 AUTENTICACIÓN
// ==========================
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

// ==========================
// 🔧 TOKEN GITHUB
// ==========================
function getSavedToken() {
  return localStorage.getItem("gh_token") || null;
}

function saveToken(t) {
  localStorage.setItem("gh_token", t);
}

function clearSavedToken() {
  localStorage.removeItem("gh_token");
  alert("Token borrado.");
}

function promptForToken() {
  const t = prompt("Pegá tu GitHub Personal Access Token:");
  if (t) {
    saveToken(t.trim());
    alert("Token guardado.");
  }
}

// ==========================
// 🔤 GENERADOR DE CÓDIGOS
// ==========================
function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ==========================
// 🧠 DESCARGAR JSON DE GITHUB
// ==========================
async function fetchCodesJson(token) {
  const res = await fetch("https://api.github.com/repos/axeltronic/verificar/contents/codes.json", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error leyendo codes.json desde GitHub");

  const data = await res.json();
  return data;
}

// ==========================
// 📝 SUBIR JSON ACTUALIZADO
// ==========================
async function uploadCodesJson(token, newContent, sha) {
  const body = {
    message: "Añadir alumno automáticamente",
    content: btoa(unescape(encodeURIComponent(JSON.stringify(newContent, null, 2)))),
    sha: sha
  };

  const res = await fetch("https://api.github.com/repos/axeltronic/verificar/contents/codes.json", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return res.ok;
}

// ==========================
// 🟦 GENERAR CERTIFICADO + QR
// ==========================
let qrImage = null;

document.getElementById("btnGenerar").addEventListener("click", async () => {
  let token = getSavedToken();
  if (!token) {
    alert("Primero debés ingresar tu token de GitHub.");
    return promptForToken();
  }

  const alumno = {
    id: generarCodigo(),
    nombreCompleto: document.getElementById("nombre").value.trim(),
    dni: document.getElementById("dni").value.trim(),
    curso: document.getElementById("curso").value,
    modalidad: document.getElementById("modalidad").value,
    sede: document.getElementById("sede").value.trim(),
    finalizacion: document.getElementById("fecha").value
  };

  // Mostrar código
  document.getElementById("generatedCode").innerText = alumno.id;
  document.getElementById("qrContainer").style.display = "block";

  // Crear QR
  const url = `https://axeltronic.com.ar/verificar?code=${alumno.id}`;
  const qr = new QRious({
    element: document.getElementById("qr"),
    value: url,
    size: 260,
    level: "H"
  });

  qrImage = document.getElementById("qr").toDataURL("image/png");

  // ==========================
  //  SUBIR A GITHUB
  // ==========================
  try {
    const jsonFile = await fetchCodesJson(token);

    const oldList = JSON.parse(atob(jsonFile.content));
    oldList.push(alumno);

    const success = await uploadCodesJson(token, oldList, jsonFile.sha);

    if (!success) {
      alert("Hubo un error subiendo el certificado a GitHub.");
    } else {
      alert("Alumno guardado y QR generado con éxito.");
    }

  } catch (err) {
    console.error(err);
    alert("No se pudo actualizar codes.json");
  }
});

// ==========================
// ⬇ DESCARGAR QR
// ==========================
document.getElementById("btnDescargarQR").addEventListener("click", () => {
  if (!qrImage) return;

  const a = document.createElement("a");
  a.href = qrImage;
  a.download = "qr-certificado.png";
  a.click();
});
