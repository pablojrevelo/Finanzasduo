# FinanzasDuo PWA — Guía de publicación en GitHub Pages

## ¿Qué vas a lograr?
Publicar FinanzasDuo en una URL gratuita y permanente para que Sofía la instale en su celular como una app.

---

## PASO 1 — Crear cuenta en GitHub
1. Ve a https://github.com
2. Haz clic en **Sign up**
3. Elige un nombre de usuario (ej: `pablorevelo`)
4. Ingresa tu email y una contraseña
5. Confirma tu email

---

## PASO 2 — Crear un repositorio nuevo
1. Una vez dentro de GitHub, haz clic en el botón verde **New** (o el ícono `+` arriba a la derecha)
2. En **Repository name** escribe: `finanzasduo`
3. Asegúrate de que esté en **Public**
4. Marca la casilla **Add a README file**
5. Haz clic en **Create repository**

---

## PASO 3 — Subir los archivos
Dentro de tu nuevo repositorio:
1. Haz clic en **Add file** → **Upload files**
2. Arrastra y suelta TODOS los archivos de la carpeta `finanzasduo`:
   - `index.html`
   - `app.jsx`
   - `manifest.json`
   - `sw.js`
   - La carpeta `icons/` con sus dos imágenes
3. En el campo **Commit changes** escribe: `Primera versión de FinanzasDuo`
4. Haz clic en **Commit changes**

---

## PASO 4 — Activar GitHub Pages
1. En tu repositorio, haz clic en **Settings** (pestaña de arriba)
2. En el menú izquierdo busca **Pages**
3. En **Source** selecciona **Deploy from a branch**
4. En **Branch** selecciona **main** y la carpeta **/ (root)**
5. Haz clic en **Save**
6. Espera 2-3 minutos

---

## PASO 5 — Obtener tu URL
Después de unos minutos, vuelve a **Settings → Pages** y verás:

> ✅ Your site is live at `https://pablorevelo.github.io/finanzasduo`

Esa es tu URL permanente y gratuita.

---

## PASO 6 — Instalar en el celular

### En Android (Chrome):
1. Abre Chrome y entra a tu URL
2. Aparecerá un banner que dice **"Agregar a pantalla de inicio"** — toca **Agregar**
3. Si no aparece el banner: toca los 3 puntos (⋮) → **Agregar a pantalla de inicio**

### En iPhone (Safari):
1. Abre Safari (debe ser Safari, no Chrome) y entra a tu URL
2. Toca el botón de compartir (cuadrado con flecha ↑)
3. Busca **"Añadir a pantalla de inicio"** y tócalo
4. Toca **Añadir**

¡Listo! Aparecerá el ícono de FinanzasDuo en la pantalla principal.

---

## PASO 7 — Compartir con Sofía
Solo mándale el link por WhatsApp:
> "Sofía, entra a esta dirección desde Safari y luego agrega la app a tu pantalla de inicio: https://TU-USUARIO.github.io/finanzasduo"

---

## Sincronización entre dispositivos

La app guarda los datos en cada celular de forma independiente. Para sincronizar:

1. **Uno de los dos** abre la app → toca el botón 🔄 (arriba a la derecha)
2. Va a **Exportar** y descarga el archivo
3. Le envía el archivo al otro por WhatsApp
4. El otro abre la app → toca 🔄 → va a **Importar** y selecciona el archivo
5. Los datos se combinan automáticamente ✅

**Recomendación:** sincronicen una vez por semana o después de registros importantes.

---

## Actualizar la app en el futuro

Cuando yo (Claude) haga mejoras a la app, solo tienes que:
1. Ir a tu repositorio en GitHub
2. Entrar al archivo que cambió (ej: `app.jsx`)
3. Hacer clic en el ícono del lápiz ✏️ para editar
4. Pegar el nuevo contenido
5. Hacer clic en **Commit changes**

La app se actualiza automáticamente en 1-2 minutos en todos los celulares.
