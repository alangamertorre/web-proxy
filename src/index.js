const form = document.querySelector("#address-form");
const input = document.querySelector("#url-input");
const frame = document.querySelector("#web-frame");
const emptyState = document.querySelector("#empty-state");
const currentAddress = document.querySelector("#current-address");
const hint = document.querySelector("#form-hint");
const suggestedUrl = document.querySelector("#suggested-url");
const viewer = document.querySelector(".viewer");
const fullscreenButton = document.querySelector("#fullscreen-button");

// Añade HTTPS cuando el usuario escribe un dominio sin protocolo.
function prepararDireccion(value) {
  const address = value.trim();
  if (!address) {
    throw new Error("La dirección está vacía");
  }

  const normalizedAddress = /^[a-z][a-z\d+.-]*:/i.test(address)
    ? address
    : `https://${address}`;
  const destination = new URL(normalizedAddress);

  if (!["http:", "https:"].includes(destination.protocol)) {
    throw new Error("Protocolo no válido");
  }

  return destination;
}

// Busca una dirección compartida en la query string, por ejemplo ?url=https%3A...
const initialAddress = new URLSearchParams(window.location.search).get("url");
if (initialAddress) {
  try {
    // URL analiza y normaliza la dirección; solo se permiten destinos web HTTP o HTTPS.
    const destination = prepararDireccion(initialAddress);
    if (destination) {
      input.value = destination.href;
      cargarProxy(destination.href, destination.hostname);
    }
  } catch {
    // Muestra un mensaje si el parámetro no tiene formato de URL válido.
    hint.textContent =
      "La dirección recibida no es válida. Puedes introducir otra.";
    hint.classList.add("is-error");
  }
}

// Intercepta el envío para validar la dirección antes de cargarla en el iframe.
form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const destination = prepararDireccion(input.value);
    input.value = destination.href;
    cargarProxy(destination.href, destination.hostname);
  } catch {
    hint.textContent =
      "Introduce un dominio o una URL válida, por ejemplo juegos.com";
    hint.classList.add("is-error");
  }
});

// Carga una de las direcciones predefinidas al seleccionarla.
suggestedUrl.addEventListener("change", () => {
  if (!suggestedUrl.value) return;

  const destination = prepararDireccion(suggestedUrl.value);
  input.value = destination.href;
  cargarProxy(destination.href, destination.hostname);
});

// Usa la API del navegador para ampliar solo el visor, no toda la aplicación.
fullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await viewer.requestFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = document.fullscreenElement === viewer;
  fullscreenButton.setAttribute(
    "aria-label",
    isFullscreen
      ? "Salir de pantalla completa"
      : "Abrir el visor en pantalla completa",
  );
  fullscreenButton.title = isFullscreen
    ? "Salir de pantalla completa"
    : "Pantalla completa";
});

// Asegúrate de añadir el protocolo https:// a la URL de tu backend en Railway
const [API_URL] = ["https://web-proxy-backend-production.up.railway.app"];

frame.addEventListener("load", () => {
  hint.textContent = "";
});

async function cargarProxy(urlCompleta, hostname) {
  hint.textContent = "Cargando a través de Railway Proxy…";
  hint.classList.remove("is-error");
  currentAddress.textContent = hostname.toUpperCase();
  emptyState.setAttribute("hidden", "true");

  frame.src = cargarPagina(
    `${API_URL}/proxy?url=${encodeURIComponent(urlCompleta)}`,
  );
  console.log(`${API_URL}/proxy?url=${encodeURIComponent(urlCompleta)}`);
}

function cargarPagina(url) {
  const contenedor = document.getElementById("contenedor-web");
  contenedor.innerHTML = "Cargando...";

  // Hacemos la petición para descargar el HTML de la web
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al descargar la página");
      }
      return response.text(); // Convertimos la respuesta a texto (HTML)
    })
    .then((html) => {
      // Insertamos el HTML dentro del DIV
      contenedor.innerHTML = html;
    })
    .catch((error) => {
      contenedor.innerHTML = "No se pudo cargar la página: " + error.message;
    });
}
