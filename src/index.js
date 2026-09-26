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

// Elimina políticas que impiden el iframe y mantiene la navegación dentro del proxy.
function prepararHtmlParaIframe(html, urlBase) {
  const documento = new DOMParser().parseFromString(html, "text/html");

  documento
    .querySelectorAll(
      'meta[http-equiv="Content-Security-Policy"], meta[http-equiv="X-Frame-Options"]',
    )
    .forEach((meta) => meta.remove());

  documento.querySelectorAll("a[href]").forEach((enlace) => {
    try {
      const destino = new URL(enlace.getAttribute("href"), urlBase);
      if (["http:", "https:"].includes(destino.protocol)) {
        enlace.href = `${API_URL}/proxy?url=${encodeURIComponent(destino.href)}`;
      }
    } catch {
      // Deja intactos los enlaces especiales como mailto: o javascript:.
    }
  });

  return documento.documentElement.outerHTML;
}

// Asegúrate de añadir el protocolo https:// a la URL de tu backend en Railway
const [API_URL] = ["https://web-proxy-backend-production.up.railway.app"];

async function cargarProxy(urlCompleta, hostname) {
  hint.textContent = "Cargando a través de Railway Proxy…";
  hint.classList.remove("is-error");
  currentAddress.textContent = hostname.toUpperCase();
  emptyState.setAttribute("hidden", "true");

  try {
    const respuesta = await fetch(
      `${API_URL}/proxy?url=${encodeURIComponent(urlCompleta)}`,
    );

    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error del servidor: ${respuesta.status}`,
      );
    }

    const htmlOriginal = await respuesta.text();
    const htmlModificado = prepararHtmlParaIframe(htmlOriginal, urlCompleta);

    // El sandbox evita que el HTML remoto acceda al documento de GitHub Pages.
    frame.srcdoc = htmlModificado;

    // Limpia el mensaje de carga cuando finalice con éxito
    hint.textContent = "";
  } catch (error) {
    hint.textContent = `Error: ${error.message}`;
    hint.classList.add("is-error");
    emptyState.removeAttribute("hidden");
  }
}
