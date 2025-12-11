async function guardarAlumno() {
    const nombre = document.getElementById("nombre").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const curso = document.getElementById("curso").value;
    const finalizacion = document.getElementById("finalizacion").value;
    const status = document.getElementById("status");

    if (!nombre || !dni || !curso || !finalizacion) {
        status.innerHTML = "<p class='err'>Completá todos los datos.</p>";
        return;
    }

    // Código único
    const codigo = "AX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // QR API
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${codigo}`;

    const response = await fetch("codes.json?" + new Date().getTime());
    let lista = await response.json();

    const nuevo = {
        nombre,
        dni,
        curso,
        finalizacion,
        codigo,
        qr
    };

    lista.push(nuevo);

    // Guardar usando GitHub API
    await actualizarGithub(lista);

    status.innerHTML = `
        <p class="ok">Alumno guardado correctamente</p>
        <p><strong>Código:</strong> ${codigo}</p>
        <img src="${qr}" class="qr">
    `;

    // borrar campos
    document.getElementById("nombre").value = "";
    document.getElementById("dni").value = "";
    document.getElementById("curso").value = "";
    document.getElementById("finalizacion").value = "";
}

async function actualizarGithub(lista) {
    const token = "TU_TOKEN_AQUI"; // poner tu token
    const user = "axeltronic";
    const repo = "verificar";
    const path = "codes.json";

    const getFile = await fetch(
        `https://api.github.com/repos/${user}/${repo}/contents/${path}`,
        { headers: { Authorization: `token ${token}` } }
    );

    const fileData = await getFile.json();

    await fetch(
        `https://api.github.com/repos/${user}/${repo}/contents/${path}`,
        {
            method: "PUT",
            headers: {
                Authorization: `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Actualización automática",
                content: btoa(unescape(encodeURIComponent(JSON.stringify(lista, null, 2)))),
                sha: fileData.sha
            })
        }
    );
}
