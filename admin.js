// admin.js (REEMPLAZAR COMPLETO)
// Dependencias: qrious debe estar cargado en admin.html

const REPO_OWNER = "axeltronic";
const REPO_NAME = "verificar";
const TARGET_PATH = "codes.json";
const BRANCH = "main";
const LOCAL_TOKEN_KEY = "gh_token_axeltronic_v1";
const PASSWORD = "keycert";

function getToken() {
  return localStorage.getItem(LOCAL_TOKEN_KEY) || null;
}
function setToken(t) {
  if (t) localStorage.setItem(LOCAL_TOKEN_KEY, t);
}
function clearToken() { localStorage.removeItem(LOCAL_TOKEN_KEY); alert("Token borrado del navegador."); }
async function promptToken() {
  const t = prompt("Pegá tu GitHub Personal Access Token (repo contents read+write). Se guardará LOCALMENTE en este navegador.");
  if (t) { setToken(t.trim()); return t.trim(); }
  throw new Error("Token no proporcionado");
}

async function sha256hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function generarCodigo(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i=0;i<len;i++) out += chars[arr[i] % chars.length];
  return out;
}

async function ghGetFile(path) {
  const token = getToken();
  if (!token) throw new Error("Token ausente");
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}`, "Accept":"application/vnd.github+json" } });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Error al leer codes.json: " + res.status + " " + txt);
  }
  return await res.json();
}

async function ghPutFile(path, contentB64, message, sha=null) {
  const token = getToken();
  if (!token) throw new Error("Token ausente");
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`;
  const body = { message, content: contentB64, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}`, "Accept":"application/vnd.github+json", "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Error al subir codes.json: " + (data.message || JSON.stringify(data)));
  return data;
}

function utf8_to_b64(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64_to_utf8(str){ return decodeURIComponent(escape(atob(str))); }

// ------- UI: login
document.getElementById("btnLogin").addEventListener("click", () => {
  const pass = (document.getElementById("pass").value || "").trim();
  if (pass === PASSWORD) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("panel").style.display = "block";
  } else {
    document.getElementById("authError").style.display = "block";
  }
});

// ------- prompt helpers exposed to UI
window.promptForToken = async function(){ try { await promptToken(); alert("Token guardado en este navegador."); } catch(e){ alert(e.message); } };
window.clearSavedToken = clearToken;

// ------- Main generate handler
document.getElementById("btnGenerar").addEventListener("click", async () => {
  try {
    // pedir token si no existe
    if (!getToken()) await promptToken();

    // leer campos
    const nombre = (document.getElementById("nombre").value || "").trim();
    const dni = (document.getElementById("dni").value || "").trim();
    const curso = (document.getElementById("curso").value || "").trim();
    const modalidad = (document.getElementById("modalidad").value || "").trim();
    const sede = (document.getElementById("sede").value || "").trim();
    const finalizacion = (document.getElementById("fecha").value || "").trim(); // YYYY-MM

    if (!nombre || !dni || !curso || !modalidad || !sede || !finalizacion) {
      alert("Completá todos los campos.");
      return;
    }

    // generar código único
    const codigo = generarCodigo(10);

    // construir objeto alumno (dni en claro porque pediste que se vea)
    const alumno = {
      nombre,
      dni,
      curso,
      modalidad,
      sede,
      finalizacion,
      codigo,
      createdAt: new Date().toISOString()
    };

    // === obtener codes.json remoto (si existe) ===
    const remote = await ghGetFile(TARGET_PATH);
    let array = [];
    let sha = null;
    if (remote && remote.content) {
      try {
        const raw = b64_to_utf8(remote.content);
        array = JSON.parse(raw);
        if (!Array.isArray(array)) array = [];
        sha = remote.sha;
      } catch(e) {
        throw new Error("El archivo remoto no contiene un JSON válido: " + e.message);
      }
    } else {
      array = [];
      sha = null;
    }

    // evitar duplicados
    if (array.some(x => x.codigo === codigo)) {
      alert("Collision raro en código, intenta nuevamente.");
      return;
    }

    array.push(alumno);

    // subir
    const newContent = JSON.stringify(array, null, 2);
    const newB64 = utf8_to_b64(newContent);
    const commitMsg = `Add certificate ${codigo} — ${nombre}`;
    const res = await ghPutFile(TARGET_PATH, newB64, commitMsg, sha);

    // generar QR en canvas y overlay texto
    const canvas = document.getElementById("qr");
    const url = `https://axeltronic.github.io/verificar/?code=${encodeURIComponent(codigo)}`;

    // generar QR
    const q = new QRious({ element: canvas, value: url, size: 360, level: "H" });

    // overlay texto en centro
    const ctx = canvas.getContext("2d");
    const hRect = 44;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.fillRect(0, canvas.height/2 - hRect/2, canvas.width, hRect);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.font = "18px Arial";
    ctx.fillText("axeltronic.github.io/verificar", canvas.width/2, canvas.height/2 + 6);

    // preparar download
    const dataUrl = canvas.toDataURL("image/png");
    document.getElementById("btnDescargarQR").style.display = "inline-block";
    document.getElementById("btnDescargarQR").onclick = () => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `QR_${codigo}.png`;
      a.click();
    };

    // mostrar código y éxito
    document.getElementById("generatedCode").innerText = codigo;
    document.getElementById("qrContainer").style.display = "block";

    alert("Alumno agregado y codes.json actualizado (commit creado).");

  } catch (err) {
    console.error(err);
    alert("Error: " + (err.message || err));
  }
});
