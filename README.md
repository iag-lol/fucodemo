# FUCO Estudio — sitio web

Sitio bilingüe (español e inglés) con portafolio, showreel, cotizador, laboratorio de color,
galerías privadas para clientes y panel de administración.

## Ver la web

```bash
npm install      # solo la primera vez
npm run build    # genera dist/
npm start        # http://localhost:4321
```

Requiere Node 22 o superior.

## Panel de administración

`http://localhost:4321/admin/` — la contraseña inicial está en `data/CLAVE-PANEL.txt`.
Para cambiarla, define `ADMIN_PASSWORD` en un archivo `.env` (ver `.env.example`).

| Pestaña | Para qué sirve |
|---|---|
| Solicitudes | Mensajes, cotizaciones y selecciones de clientes; estados y exportación CSV |
| Galerías | Crear galerías privadas, subir fotos y compartir el código |
| Disponibilidad | Bloquear fechas en el cotizador |
| Tarifas | Definir precios y activar el estimado (desactivado por defecto) |

Galería de prueba: `http://localhost:4321/clientes/?code=DEMO-FUCO` (elimínala desde el panel antes de publicar).

## Editar contenido

Después de cualquier cambio: `npm run build`.

| Qué | Dónde |
|---|---|
| Correos, teléfonos, redes | `src/data/site.mjs` |
| Página «Nosotros»: equipo, forma de trabajo, equipamiento, compromisos | `src/data/nosotros.mjs` |
| Proyectos | `src/data/projects.mjs` |
| Servicios, proceso, preguntas, opciones del cotizador | `src/data/content.mjs` |
| Textos de cada página | `src/templates/` |
| Logos de marcas | `src/data/brands.mjs` |
| Colores y tipografías | `src/css/01-base.css` |

### Página «Nosotros»

Todo su contenido propio está en `src/data/nosotros.mjs`. **Revísalo antes de publicar:** las etapas de
trabajo y los compromisos son un borrador, y por eso la web los marca como «Por confirmar».

- Cuando un dato sea correcto, cambia su `ok: false` a `ok: true`. Borra lo que no corresponda.
- Equipo: completa `role`, `bio`, `skills` y, si quieres, `photo`.
- Equipamiento: agrega cada equipo en `items`, por ejemplo
  `{ name: 'Marca y modelo', detail: { es: 'Para qué se usa', en: 'What it is for' } }`.

`npm run build` avisa cuántos datos faltan.

### Agregar el video de un proyecto

1. Copia el MP4 (H.264, idealmente 720p o 1080p) a `media-originals/video-extra/<slug>.mp4`.
   El slug es el de la dirección del proyecto, por ejemplo `takis-intense`.
2. Ejecuta `node scripts/optimize-media.mjs && npm run build`.

### Agregar fotos

1. Copia las fotos como `.jpg` a `media-originals/stills/`, por ejemplo `nuevo-01.jpg`.
2. Ejecuta `node scripts/optimize-media.mjs`.
3. Usa el nombre sin extensión (`nuevo-01`) en `src/data/projects.mjs` y ejecuta `npm run build`.

Para reemplazar una foto conservando el nombre, borra antes sus versiones en `public/media/img/`.

### Logos de marcas

Copia el archivo (SVG o PNG) a `media-originals/logos/`, agrégalo en `src/data/brands.mjs` y ejecuta
`node scripts/optimize-media.mjs && npm run build`. Se convierten solos a blanco.
Los actuales se tomaron de los sitios oficiales de cada marca (Adidas y Under Armour, de la colección
Simple Icons). Son marcas registradas: confirma que puedes mostrarlas.

### Sala de edición (sección «Del brief al corte final»)

Usa los cinco videos horizontales definidos en `TIMELINE_CLIPS` (`src/templates/components.mjs`).
La forma de onda sale del audio real (`src/data/timeline.json`) y los fotogramas están en
`media-originals/timeline/`. Para sumar un video a esta sección hay que generar ambos para ese video.
El navegador no permite reproducir con sonido hasta que el visitante lo activa con un clic o toque.

## Material (importante)

`media-originals/` contiene las fotos y videos descargados del sitio anterior y los fotogramas
extraídos de los videos. **Respáldala antes de cancelar Wix**: no está incluida en Git.

## Publicar en fucoestudio.com

Necesitas un hosting que ejecute Node (VPS, Render, Railway, Fly.io…):

1. Sube el proyecto incluyendo `public/media/` (o `media-originals/` y ejecuta `node scripts/optimize-media.mjs`).
2. Configura `HOST=0.0.0.0`, `NODE_ENV=production`, `TRUST_PROXY=1`, `ADMIN_PASSWORD` y el aviso por correo.
3. Asegura que `data/` (o `DATA_DIR`) esté en un disco persistente y con respaldo.
4. `npm install && npm run build && npm start`, siempre con HTTPS.
5. Cambia el DNS del dominio. Las direcciones antiguas (`/about`, `/estudio`, `/clients`, `/contact`) ya redirigen.

Un hosting solo estático (Netlify, Cloudflare Pages) puede servir `dist/`, pero los formularios,
las galerías y el panel dejarían de funcionar.
