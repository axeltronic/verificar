// Leer parámetro ?code=XXXX
function getCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("code");
}

// Mostrar datos del alumno
function mostrarAlumno(alumno) {
    document.getElementById("resultado").innerHTML = `
        <div class="card success">
            <h2>Certificado válido</h2>
            <p><strong>Nombre:</strong> ${alumno.nombre}</p>
            <p><strong>DNI:</strong> ${alumno.dni}</p>
            <p><strong>Curso:</strong> ${alumno.curso}</p>
            <p><strong>Modalidad:</strong> ${alumno.modalidad}</p>
            <p><strong>Sede:</strong> ${alumno.sede}</p>
            <p><strong>Finalización:</strong> ${alumno.finalizacion}</p>
            <p><strong>Código:</strong> ${alumno.codigo}</p>
        </div>
    `;
}

// Mostrar error
function mostrarInvalido() {
    document.getElementById("resultado").innerHTML = `
        <div class="card error">
            <h2>❌ Código inválido o no registrado</h2>
        </div>
    `;
}

// Verificación manual OR automática
document.addEventListener("DOMContentLoaded", async () => {
    const input = document.getElementById("codeInput");
    const btn = document.getElementById("btnVerificar");

    const codeInURL = getCodeFromURL();

    if (codeInURL) {
        input.value = codeInURL; // completa el campo automáticamente
        verificar(codeInURL);
    }

    btn.addEventListener("click", () => {
        verificar(input.value.trim().toUpperCase());
    });
});

// Función de verificación
async function verificar(code) {
    if (!code) {
        mostrarInvalido();
        return;
    }

    const response = await fetch("codes.json?" + Date.now()); // evitar caché
    const data = await response.json();

    const alumno = data.find(a => a.codigo === code);

    if (alumno) mostrarAlumno(alumno);
    else mostrarInvalido();
}
