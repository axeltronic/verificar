/* admin.js
  - Promptará por tu GitHub token (si no está en localStorage)
  - Generará ID, QR y subirá/actualizará codes.json en:
      https://api.github.com/repos/axeltronic/verificar/contents/codes.json
  - Guarda token en localStorage (solo en tu navegador).
  IMPORTANT: Revoke any token you already leaked before using this.
*/

/* ========== CONFIG ========== */
const REPO_OWNER = "axeltronic";
const REPO_NAME  = "verificar";
const TARGET_PATH = "codes.json";
const BRANCH = "main"; // branch donde está codes.json

/* ========== HELPERS ========== */

// safe base64 for unicode:
function utf8_to_b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64_to_utf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

// SHA-256 util (returns hex string)
async function sha256hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ========== TOKEN STORAGE ========== */
const LOCAL_TOKEN_KEY = "axeltronic_gh_token_v1";

function getToken() {
  return localStorage.getItem(LOCAL_TOKEN_KEY) || null;
}
function setToken(t) {
  if (!t) return;
  localStorage.setItem(LOCAL_TOKEN_KEY, t);
}
function clearToken() {
  localStorage.removeItem(LOCAL_TOKEN_KEY);
}

/* ========== UI - prompt for token (only when needed) ========== */
async function ensureTokenOrPrompt() {
  let token = getToken();
  if (token) return token;

  // ask the user to paste their PAT (will be stored in localStorage)
  token = prompt("Ingresá tu GitHub Personal Access Token (repo:contents -> read & write). Se guardará LOCALmente en este navegador.");
  if (!token) throw new Error("Token no proveído. Operación cancelada.");
  setToken(token.trim());
  return token.trim();
}

/* ========== GitHub API interactions ========== */

async function ghGetFile(path) {
  const token = getToken();
  if (!token) throw new Error("Token ausente");
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub GET failed: ${res.status} ${txt}`);
  }
  return res.json(); // contains content (base64) and sha
}

async function ghPutFile(path, content_b64, message, sha=null) {
  const token = getToken();
  if (!token) throw new Error("Token ausente");
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`;
  const body = { message, content: content_b64, branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    // GitHub returns useful error object in JSON
    throw new Error(`GitHub PUT failed: ${res.status} ${data && data.message ? data.message : JSON.stringify(data)}`);
  }
  return data;
}

/* ========== Main: create entry and push it ========== */

async function addStudentAndCommit(studentObj) {
  // studentObj expected with fields:
  // { id, nombreCompleto, dniHash, curso, modalidad, sede, fechaFinalizacion, createdAt }
  await ensureTokenOrPrompt();

  // 1) get existing file
  const remote = await ghGetFile(TARGET_PATH);
  let array = [];
  let sha = null;

  if (remote && remote.content) {
    try {
      const raw = b64_to_utf8(remote.content);
      array = JSON.parse(raw);
      if (!Array.isArray(array)) array = [];
      sha = remote.sha;
    } catch (e) {
      // If parse fails, bail out
      throw new Error("El contenido remoto de codes.json no es un array JSON válido: " + e.message);
    }
  } else {
    array = [];
    sha = null;
  }

  // 2) push new entry (avoid duplicates by id)
  if (array.some(x => x.id === studentObj.id)) {
    throw new Error("ID ya existe en codes.json (collision inesperada). Generá nuevamente.");
  }
  array.push(studentObj);

  // 3) encode and PUT
  const newContentStr = JSON.stringify(array, null, 2);
  const newContentB64 = utf8_to_b64(newContentStr);
  const message = `Add certificate ${studentObj.id} — ${studentObj.nombreCompleto}`;

  const result = await ghPutFile(TARGET_PATH, newContentB64, message, sha);
  return result; // contains commit info
}

/* ========== Utilities: generate ID (short, random) ========== */
function generateId(len=10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  const array = new Uint32Array(len);
  crypto.getRandomValues(array);
  for (let i = 0; i < len; i++) id += chars[array[i] % chars.length];
  return id;
}

/* ========== QR generation (using qrious lib loaded in admin.html) ========== */
function generateQrToCanvas(url, canvasEl, overlayText="axeltronic.com.ar/verificar") {
  const q = new QRious({
    element: canvasEl,
    value: url,
    size: 360,
    level: "H"
  });

  // add overlay text in the centre (semi-opaque white bar with black text)
  const ctx = canvasEl.getContext("2d");
  const h = 44;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(0, canvasEl.height/2 - h/2, canvasEl.width, h);
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  // font size responsive to canvas
  ctx.font = "18px Arial";
  ctx.fillText(overlayText, canvasEl.width/2, canvasEl.height/2 + 6);
}

/* ========== Hook to your admin UI ========== */
/* Assumes admin.html has elements with ids:
   btnLogin, pass, auth, panel, btnGenerar,
   nombre, dni, curso, modalidad, sede, fecha,
   generatedCode, qr, btnDescargarQR
*/

(async function initAdminBindings(){
  // make sure elements exist before binding
  function $id(id){ return document.getElementById(id); }

  // login (simple: password is 'keycert' as you set before)
  $id("btnLogin")?.addEventListener("click", () => {
    const pass = $id("pass").value || "";
    if (pass === "keycert") {
      $id("auth").style.display = "none";
      $id("panel").style.display = "block";
    } else {
      $id("authError").style.display = "block";
    }
  });

  // allow user to set/clear token via console commands or small UI prompt:
  // call promptForToken() from console if want to change token
  window.promptForToken = async function() {
    try {
      const t = await ensureTokenOrPrompt();
      alert("Token guardado localmente en este navegador.");
      return t;
    } catch (e) {
      alert("Token no guardado: " + e.message);
      return null;
    }
  };
  window.clearSavedToken = function() { clearToken(); alert("Token borrado del localStorage"); };

  // main generate button
  $id("btnGenerar")?.addEventListener("click", async () => {
    try {
      // ensure token exists (will prompt if not)
      await ensureTokenOrPrompt();

      // read fields
      const nombre = ($id("nombre").value || "").trim();
      const dniRaw = ($id("dni").value || "").trim();
      const curso = ($id("curso").value || "").trim();
      const modalidad = ($id("modalidad").value || "").trim();
      const sede = ($id("sede").value || "").trim();
      const fechaFinalizacion = ($id("fecha").value || "").trim();

      if (!nombre || !dniRaw || !curso || !modalidad || !sede || !fechaFinalizacion) {
        alert("Completá todos los campos obligatorios.");
        return;
      }

      // generate id and hash dni
      const id = generateId(10);
      const dniHash = await sha256hex(dniRaw);

      // build student object (store dniHash, not raw dni)
      const student = {
        id,
        nombreCompleto: nombre,
        dni: dniHash,
        curso,
        modalidad,
        sede,
        fechaFinalizacion,
        createdAt: new Date().toISOString()
      };

      // 1) update codes.json via GitHub API
      $id("btnGenerar").disabled = true;
      $id("btnGenerar").innerText = "Guardando...";

      const res = await addStudentAndCommit(student);

      // success
      $id("generatedCode").innerText = id;

      // 2) generate QR on canvas
      const canvas = $id("qr");
      generateQrToCanvas(`https://axeltronic.com.ar/verificar?code=${encodeURIComponent(id)}`, canvas);

      // enable download
      $id("btnDescargarQR").style.display = "inline-block";
      $id("btnDescargarQR").onclick = function() {
        const link = document.createElement("a");
        link.href = canvas.toDataURL();
        link.download = `QR_${id}.png`;
        link.click();
      };

      alert("Alumno agregado y codes.json actualizado en GitHub.\nCommit: " + (res && res.commit && res.commit.sha ? res.commit.sha : "ok"));

    } catch (err) {
      console.error("Error:", err);
      alert("Ocurrió un error: " + (err.message || err));
    } finally {
      try { $id("btnGenerar").disabled = false; $id("btnGenerar").innerText = "Generar certificado + QR"; } catch(e){}
    }
  });

})();
