const form = document.querySelector("#address-form");
const input = document.querySelector("#url-input");
const frame = document.querySelector("#web-frame");
const emptyState = document.querySelector("#empty-state");
const currentAddress = document.querySelector("#current-address");
const hint = document.querySelector("#form-hint");

// Asegúrate de añadir el protocolo https:// a la URL de tu backend en Railway
const [API_URL] = ["https://web-proxy-backend-production.up.railway.app"];

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
      alert(errorData.error || `Error del servidor: ${respuesta.status}`);
    }

    const htmlModificado = await respuesta.text();

    // CORRECCIÓN 3: Usar 'srcdoc' en lugar de 'src' para inyectar el HTML crudo que devuelve tu proxy
    frame.srcdoc = htmlModificado;

    // Limpia el mensaje de carga cuando finalice con éxito
    hint.textContent = "";
  } catch (error) {
    alert("Error al cargar mediante el proxy:", error);
    hint.textContent = `Error: ${error}`;
    hint.classList.add("is-error");
    emptyState.removeAttribute("hidden");
  }
}
