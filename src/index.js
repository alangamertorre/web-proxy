// Asegúrate de añadir el protocolo https:// a la URL de tu backend en Railway
const [API_URL] = ["https://railway.app"];

async function cargarProxy(urlCompleta, hostname) {
  hint.textContent = "Cargando a través de Railway Proxy…";
  hint.classList.remove("is-error");
  currentAddress.textContent = hostname.toUpperCase();
  emptyState.setAttribute("hidden", "true");

  try {
    // CORRECCIÓN 1 y 2: Se añade 'await', se usa el nombre correcto 'respuesta' y se asegura el protocolo en la URL
    const respuesta = await fetch(
      `${API_URL}/proxy?url=${encodeURIComponent(urlCompleta)}`,
    );

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      throw new Error(
        errorData.error || `Error del servidor: ${respuesta.status}`,
      );
    }

    const htmlModificado = await respuesta.text();

    // CORRECCIÓN 3: Usar 'srcdoc' en lugar de 'src' para inyectar el HTML crudo que devuelve tu proxy
    frame.srcdoc = htmlModificado;

    // Limpia el mensaje de carga cuando finalice con éxito
    hint.textContent = "";
  } catch (error) {
    console.error("Error al cargar mediante el proxy:", error.message);
    hint.textContent = `Error: ${error.message}`;
    hint.classList.add("is-error");
    emptyState.removeAttribute("hidden");
  }
}
