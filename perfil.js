// Micro frontend: PERFIL  (equipo "Cuentas") — implementado como Web Component
// Contrato: define la etiqueta <mfe-perfil>
// Publica:  'usuario:cambio' { nombre, version }   (v1) — al guardar y al montarse si ya hay nombre
// Estado:   sessionStorage['saborupc:perfil'] (propio de este micro frontend)
// Config:   atributo data-tokens="URL/tokens.css" en la etiqueta script que carga este archivo
(function () {
  if (customElements.get('mfe-perfil')) return;  // ya cargado

  const VERSION = '1.2.0';
  const CLAVE = 'saborupc:perfil';

  // document.currentScript solo existe mientras el script se ejecuta: se lee aquí, de forma síncrona
  const URL_TOKENS = (document.currentScript && document.currentScript.dataset.tokens)
    || 'https://design-tokens-saborupc.onrender.com/tokens.css';

  // ---- Estado propio, persistido en sessionStorage
  const VACIO = { nombre: '', ciudad: 'Valledupar' };
  function cargar() {
    try {
      const g = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
      if (!g || typeof g !== 'object') return { ...VACIO };
      return {
        nombre: typeof g.nombre === 'string' ? g.nombre : VACIO.nombre,
        ciudad: typeof g.ciudad === 'string' ? g.ciudad : VACIO.ciudad
      };
    } catch (e) {
      return { ...VACIO };   // storage bloqueado o JSON dañado
    }
  }
  function guardar() {
    try { sessionStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sigue en memoria */ }
  }
  const datos = cargar();

  function publicar() {
    window.dispatchEvent(new CustomEvent('usuario:cambio', {
      detail: { nombre: datos.nombre, version: 1 }
    }));
  }

  function cargarTokens() {
    if (document.querySelector('link[href="' + URL_TOKENS + '"]')) return; // ya cargado
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = URL_TOKENS;
    document.head.appendChild(link);
  }

  class MfePerfil extends HTMLElement {
    connectedCallback() {
      cargarTokens();
      // Shadow DOM: estilos y marcado encapsulados. Ni el contenedor ni
      // otros micro frontends pueden afectar (ni ser afectados por) este CSS.
      // Las variables CSS de los tokens sí lo atraviesan (se heredan).
      const sombra = this.shadowRoot || this.attachShadow({ mode: 'open' });
      sombra.innerHTML = `
        <style>
          :host { display: block; }
          h2 { color: var(--color-exito, #1b7a3e); margin: 0 0 4px; }
          .version { font-size: 12px; color: #888; }
          form {
            background: #fff;
            border: 1px solid var(--color-borde, #dde3ea);
            border-radius: 6px;
            padding: 20px;
            margin-top: 16px;
            max-width: 420px;
          }
          label { display: block; margin: 12px 0 4px; font-size: 14px; }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid #bbb;
            border-radius: 4px;
            box-sizing: border-box;
          }
          button {
            margin-top: 16px;
            background: var(--color-exito, #1b7a3e);
            color: #fff;
            border: 0;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          .ok { color: var(--color-exito, #1b7a3e); font-size: 14px; }
        </style>
        <h2>Mi perfil</h2>
        <span class="version">mfe-perfil v${VERSION} · Web Component</span>
        <form>
          <label>Nombre</label>
          <input name="nombre" placeholder="Escribe tu nombre" required>
          <label>Ciudad</label>
          <input name="ciudad">
          <button type="submit">Guardar</button>
          <p class="ok"></p>
        </form>`;

      const f = sombra.querySelector('form');
      f.elements.nombre.value = datos.nombre;
      f.elements.ciudad.value = datos.ciudad;
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        datos.nombre = f.elements.nombre.value.trim();
        datos.ciudad = f.elements.ciudad.value.trim();
        guardar();
        sombra.querySelector('.ok').textContent = '¡Datos guardados!';
        publicar();
      });

      // Si ya hay usuario (p. ej. tras recargar), avisa al resto de micro frontends
      if (datos.nombre) publicar();
    }

    disconnectedCallback() {
      // El navegador llama a este método cuando el contenedor retira el elemento.
      // No hay listeners globales que limpiar: los del formulario se van con el Shadow DOM.
      console.log('[mfe-perfil] desmontado');
    }
  }

  customElements.define('mfe-perfil', MfePerfil);
})();