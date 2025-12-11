async function verificarCodigo() {
    const input = document.getElementById("codigoInput").value.trim();
    const resDiv = document.getElementById("resultado");

    if (!input) {
        resDiv.innerHTML = "<p class='err'>Ingresá un código válido.</p>";
        return;
    }

    try {
        const response = await fetch("codes.json?" + new Date().getTime());
        const data = await response.json();

        const alumno = data.find(a => a.codigo === input);

        if (!alumno) {
            resDiv.innerHTML = "<p class='err'>❌ Código inválido o no registrado</p>";
            return;
        }

        resDiv.innerHTML = `
            <div class="ok">
                <h3>✔ Certificado válido</h3>
                <p><strong>Alumno:</strong> ${alumno.nombre}</p>
                <p><strong>DNI:</strong> ${alumno.dni}</p>
                <p><strong>Curso:</strong> ${alumno.curso}</p>
                <p><strong>Finalización:</strong> ${alumno.finalizacion}</p>
                <img src="${alumno.qr}" class="qr">
            </div>
        `;
    } catch (e) {
        resDiv.innerHTML = "<p class='err'>Error cargando base de datos.</p>";
    }
}
