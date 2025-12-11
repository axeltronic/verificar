async function verificar(code) {
    const resultDiv = document.getElementById("result");

    const res = await fetch("codes.json");
    const alumnos = await res.json();

    const alumno = alumnos.find(a => a.id === code);

    if (!alumno) {
        resultDiv.className = "invalid";
        resultDiv.style.display = "block";
        resultDiv.innerHTML = "❌ Código inválido o no registrado";
        return;
    }

    resultDiv.className = "valid";
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
      ✔ Certificado válido<br><br>
      <b>Nombre:</b> ${alumno.nombreCompleto}<br>
      <b>Curso:</b> ${alumno.curso}<br>
      <b>Modalidad:</b> ${alumno.modalidad}<br>
      <b>Sede:</b> ${alumno.sede}<br>
      <b>Finalización:</b> ${alumno.fechaFinalizacion}
    `;
}

document.getElementById("btnVerify").addEventListener("click", () => {
    const code = document.getElementById("codeInput").value.trim();
    if (code) verificar(code);
});

const params = new URLSearchParams(window.location.search);
if (params.has("code")) {
    const code = params.get("code");
    document.getElementById("codeInput").value = code;
    verificar(code);
}
