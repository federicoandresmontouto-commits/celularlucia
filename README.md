# Celular de Lucía · Caso 001

El celular simulado de Lucía Ferrán, con un **panel de administración** para cambiar todo sin tocar código: textos, chats, audios reales, fotos, mails, alarma y códigos de caja.

- **Jugadores:** entran a `tu-sitio.pages.dev`, ponen el código de su caja y desbloquean el celular con el PIN.
- **Vos:** entrás a `tu-sitio.pages.dev/admin` con tu contraseña.

Todo lo que cambies en el panel vale para todos los códigos. Cada código solo guarda el avance de su grupo (qué leyó, si desbloqueó, etc.).

---

## Instalación (una sola vez, unos 20 minutos)

### Paso 1 · Subir los archivos a GitHub

1. Entrá a github.com y creá una cuenta si no tenés.
2. Tocá **New repository**. Nombre: `celular-lucia`. Elegí **Private**. Tocá **Create repository**.
3. Tocá **uploading an existing file**.
4. Descomprimí el zip y arrastrá **todo lo que hay adentro de la carpeta `celular-lucia`** (las carpetas `public`, `functions`, `lib` y este archivo).
5. Tocá **Commit changes**.

### Paso 2 · Crear el sitio en Cloudflare

1. Entrá a cloudflare.com y creá una cuenta gratis.
2. En el menú: **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
3. Conectá tu GitHub y elegí `celular-lucia`.
4. Configuración:
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Build output directory: **public**
5. Tocá **Save and Deploy**.

Todavía no va a funcionar: faltan los pasos 3 y 4.

### Paso 3 · Crear el almacenamiento (donde se guardan textos, audios y códigos)

1. En Cloudflare: **Storage & Databases** → **KV** → **Create a namespace**. Nombre: `celular-lucia`. Crear.
2. Volvé a **Workers & Pages** → tu proyecto `celular-lucia` → **Settings** → **Bindings** → **Add** → **KV namespace**.
3. En *Variable name* escribí exactamente: **KV** (en mayúscula).
4. En *KV namespace* elegí `celular-lucia`. Guardá.

### Paso 4 · Poner la contraseña del panel

1. En tu proyecto: **Settings** → **Variables and Secrets** → **Add**.
2. Tipo: **Secret**. Nombre: **ADMIN_PASSWORD**. Valor: la contraseña que quieras (larga, que no uses en otro lado).
3. Guardá.

### Paso 5 · Volver a publicar

1. En tu proyecto: pestaña **Deployments** → en el último, los tres puntitos → **Retry deployment**.
2. Esperá un minuto y entrá a `tu-sitio.pages.dev/admin`.

Si algo falta, el panel te avisa qué paso revisar. Los nombres de los menús de Cloudflare pueden cambiar un poco con el tiempo.

---

## Usar el panel

| Pestaña | Qué hacés |
| --- | --- |
| **General** | PIN del celular, fecha, hora y batería de la pantalla bloqueada. Botón para volver al Caso 001 original. |
| **Chats y audios** | Agregar, editar, ordenar y borrar chats y mensajes. **Subir audios reales**: el jugador los escucha con play. |
| **Fotos** | Subir fotos a la galería. Se achican solas para que carguen rápido. |
| **Correos** | Mails de la bandeja, con fotos adjuntas. |
| **Alarma** | Usuario, clave, registro de eventos y zonas de la app Centinela. |
| **Códigos** | Crear códigos nuevos, importar los que ya tenés, dar de baja, ver cuáles ya se usaron y descargar la planilla. |
| **Archivos** | Todos los audios y fotos subidos, para escucharlos o borrarlos. |

Después de cambiar algo, tocá **Guardar cambios** (la barra de abajo se pone amarilla cuando hay cambios sin guardar). Los jugadores ven los cambios en hasta 1 minuto.

### Audios

- Formato recomendado: **MP3** o **M4A**. Suenan en todos los celulares.
- Los audios de WhatsApp vienen en **.opus**. Pueden no sonar en iPhone: convertilos a MP3 antes (cualquier conversor online gratis sirve).
- La duración se completa sola al subir.
- Si un audio no tiene archivo, el jugador ve la transcripción.

### Fotos

- JPG o PNG. Si sacás fotos con iPhone en formato HEIC, subilas desde el iPhone mismo o pasalas a JPG.

### Códigos

- Viene cargado un código de prueba: **LC-DEMO-2026**. Dalo de baja antes de vender.
- Para cargar los 200 códigos que ya generamos: abrí `codigos-caso-001.csv`, copiá la columna de códigos y pegala en **Códigos → Importar**.
- Si alguien pierde o filtra su código, lo das de baja y deja de funcionar.

---

## Límites a tener en cuenta

- El plan gratis de Cloudflare KV alcanza de sobra para empezar: 100.000 lecturas y 1.000 escrituras por día. Cada grupo que entra usa unas pocas lecturas; las escrituras son tus guardados, tus subidas y el primer uso de cada código.
- Cada archivo puede pesar hasta 20 MB.
- El avance de cada grupo se guarda en el navegador. Si cambian de celular, empiezan desbloqueando de nuevo con el mismo código.
- Los textos del caso ahora solo se entregan a quien tiene un código válido, así que no se pueden leer desde el código fuente del sitio.

## Qué hay en cada carpeta (no hace falta tocar nada)

| Carpeta | Qué es |
| --- | --- |
| `public/` | Las páginas: el celular (`index.html`) y el panel (`admin/`). |
| `functions/` | El servidor: valida códigos, entrega el contenido y guarda lo que cambiás en el panel. |
| `lib/` | Funciones compartidas y el contenido original del Caso 001. |
