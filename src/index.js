const form = document.querySelector("#address-form");
const input = document.querySelector("#url-input");
const frame = document.querySelector("#web-frame");
const emptyState = document.querySelector("#empty-state");
const currentAddress = document.querySelector("#current-address");
const hint = document.querySelector("#form-hint");

// Busca una dirección compartida en la query string, por ejemplo ?url=https%3A...
const initialAddress = new URLSearchParams(window.location.search).get("url");
if (initialAddress) {
  try {
    // URL analiza y normaliza la dirección; solo se permiten destinos web HTTP o HTTPS.
    const destination = new URL(initialAddress);
    if (["http:", "https:"].includes(destination.protocol)) {
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
  const enteredAddress = input.value.trim();

  try {
    const destination = new URL(enteredAddress);
    // Impide protocolos como javascript:, file: u otros que no sean páginas web.
    if (!["http:", "https:"].includes(destination.protocol)) {
      throw new Error("Protocolo no válido");
    }
    cargarProxy(destination.href, destination.hostname);
  } catch {
    // Informa del formato esperado sin intentar navegar a una dirección inválida.
    hint.textContent =
      "Introduce una dirección válida que empiece por http:// o https://";
    hint.classList.add("is-error");
  }
});

// Actualiza la interfaz y pide al backend que cargue la página de destino.
function cargarProxy(urlCompleta, hostname) {
  hint.textContent = "Cargando a través de Railway Proxy…";
  hint.classList.remove("is-error");
  currentAddress.textContent = hostname.toUpperCase();
  // Oculta el estado inicial para dejar visible el área del iframe.
  emptyState.setAttribute("hidden", "true");

  // La ruta /proxy debe existir en el servidor y recibir la URL de destino en ?url=.
  frame.src = `/proxy?url=${encodeURIComponent(urlCompleta)}`;
}

// Punto de extensión para una futura petición directa al backend; ahora no tiene implementación.
async function fetchWeb_Backend(src) {}
