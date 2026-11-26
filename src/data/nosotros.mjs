// Contenido de la página «Nosotros». Después de editar: `npm run build`.
//
// Cada dato tiene `ok`. Mientras sea `false`, la web lo muestra con la etiqueta «Por confirmar».
// Revisa el texto, ajústalo a cómo trabaja el estudio y recién entonces cambia a `ok: true`.
// Los campos en `null` aparecen como «Por completar».

/** Ficha de cada persona (la clave es su correo en site.mjs). */
export const crew = {
  'isaac@fucoestudio.com': {
    ok: false,
    role: null, // { es: 'Cargo', en: 'Role' }
    bio: null, //  { es: 'Trayectoria y forma de trabajar…', en: '…' }
    skills: [], // [{ es: 'Especialidad', en: 'Speciality' }]
    photo: null, // nombre de una foto del proyecto (ver media-map.mjs)
  },
  'cata@fucoestudio.com': { ok: false, role: null, bio: null, skills: [], photo: null },
};

/** Cómo trabaja el equipo, etapa por etapa. */
export const phases = [
  {
    ok: false, image: 'alaniz-f-02',
    title: { es: 'Brief y propuesta', en: 'Brief and proposal' },
    text: { es: 'Partimos por entender qué necesitas contar, a quién y en qué pantallas se va a ver.', en: 'We start by understanding what you need to say, to whom, and on which screens it will be seen.' },
    does: {
      es: ['Reunión para conocer el proyecto y sus objetivos', 'Referencias visuales y tono', 'Lista de entregables, formatos y usos', 'Propuesta con alcance, valores y plazos'],
      en: ['A meeting to learn about the project and its goals', 'Visual references and tone', 'List of deliverables, formats and uses', 'Proposal with scope, fees and timeline'],
    },
    gets: { es: 'Una propuesta clara antes de comprometer la fecha.', en: 'A clear proposal before you commit to a date.' },
  },
  {
    ok: false, image: 'bike-f-03',
    title: { es: 'Preproducción', en: 'Pre-production' },
    text: { es: 'El rodaje se gana antes: llegamos sabiendo qué momento no se puede perder y quién lo cubre.', en: 'The shoot is won beforehand: we arrive knowing which moment cannot be missed and who covers it.' },
    does: {
      es: ['Visita o revisión de la locación', 'Plan de rodaje y lista de tomas', 'Roles del equipo y equipamiento', 'Acreditaciones y permisos'],
      en: ['Location visit or review', 'Shooting schedule and shot list', 'Crew roles and equipment', 'Accreditations and permits'],
    },
    gets: { es: 'Un cronograma compartido para el día.', en: 'A shared schedule for the day.' },
  },
  {
    ok: false, image: 'bike-09',
    title: { es: 'Rodaje', en: 'Shoot day' },
    text: { es: 'En terreno trabajamos coordinados entre foto y video, sin interrumpir lo que está pasando.', en: 'On location, photo and video work in step without interrupting what is happening.' },
    does: {
      es: ['Montaje y pruebas antes de la hora de inicio', 'Cobertura según la lista de tomas', 'Piezas rápidas para redes cuando se acuerdan', 'Copia del material al terminar la jornada'],
      en: ['Set-up and tests before start time', 'Coverage following the shot list', 'Quick social assets when agreed', 'Footage backed up at the end of the day'],
    },
    gets: { es: 'Cada momento clave registrado en los formatos acordados.', en: 'Every key moment captured in the agreed formats.' },
  },
  {
    ok: false, image: 'ffl-f-03',
    title: { es: 'Postproducción', en: 'Post-production' },
    text: { es: 'Selección, montaje, color y sonido con una misma mirada, para que foto y video se sientan parte de lo mismo.', en: 'Selection, edit, colour and sound with a single eye, so photo and video feel like one body of work.' },
    does: {
      es: ['Selección y retoque de fotografías', 'Montaje, música y diseño sonoro', 'Corrección de color', 'Versiones horizontales y verticales'],
      en: ['Photo selection and retouching', 'Editing, music and sound design', 'Colour grading', 'Landscape and vertical versions'],
    },
    gets: { es: 'Un primer corte para revisar y comentar.', en: 'A first cut to review and comment on.' },
  },
  {
    ok: false, image: 'terrex-10',
    title: { es: 'Entrega', en: 'Delivery' },
    text: { es: 'Recibes todo ordenado y en cada formato que necesitas publicar.', en: 'You receive everything organised, in every format you need to publish.' },
    does: {
      es: ['Ajustes según tus comentarios', 'Exportación por formato y plataforma', 'Galería privada con código de acceso', 'Selección de favoritas y descarga'],
      en: ['Changes based on your feedback', 'Exports for each format and platform', 'Private gallery with access code', 'Favourites and downloads'],
    },
    gets: { es: 'Tus archivos finales en una galería privada.', en: 'Your final files in a private gallery.' },
  },
];

/** Equipamiento. Agrega cada equipo en `items`: { name: 'Marca y modelo', detail: { es: '…', en: '…' } }. */
export const gear = [
  { id: 'camaras', image: 'originals-f-04', items: [], title: { es: 'Cámaras', en: 'Cameras' }, use: { es: 'Cuerpos para fotografía y video, elegidos según la luz, el movimiento y el formato final.', en: 'Stills and video bodies, chosen for the light, the movement and the final format.' } },
  { id: 'lentes', image: 'originals-f-02', items: [], title: { es: 'Lentes', en: 'Lenses' }, use: { es: 'Del gran angular al teleobjetivo: contexto, detalle y retrato.', en: 'From wide angle to telephoto: context, detail and portraits.' } },
  { id: 'aereo', image: 'parade-f-09', items: [], title: { es: 'Tomas aéreas', en: 'Aerial' }, use: { es: 'Vistas que muestran la escala real de un evento o un recorrido.', en: 'Views that show the true scale of an event or a route.' } },
  { id: 'estabilizacion', image: 'terrex-02', items: [], title: { es: 'Estabilización', en: 'Stabilisation' }, use: { es: 'Movimiento fluido para seguir la acción de cerca.', en: 'Fluid movement to stay close to the action.' } },
  { id: 'iluminacion', image: 'under-armour', items: [], title: { es: 'Iluminación', en: 'Lighting' }, use: { es: 'Luz para retrato, producto y escenas nocturnas.', en: 'Light for portraits, product and night scenes.' } },
  { id: 'audio', image: 'mall-f-01', items: [], title: { es: 'Audio', en: 'Audio' }, use: { es: 'Registro de voces, entrevistas y sonido ambiente.', en: 'Voices, interviews and ambient sound.' } },
  { id: 'postproduccion', image: 'mall-f-03', items: [], title: { es: 'Postproducción', en: 'Post-production' }, use: { es: 'Estaciones de edición, programas, monitores y almacenamiento.', en: 'Editing stations, software, monitors and storage.' } },
];

/** Compromisos de trabajo. Deja en `ok: true` solo lo que el estudio cumple siempre. */
export const standards = [
  { ok: false, icon: 'disk', title: { es: 'Respaldo del material', en: 'Footage backup' }, text: { es: 'El material se copia en más de un disco antes de volver a usar las tarjetas.', en: 'Footage is copied to more than one drive before cards are reused.' } },
  { ok: false, icon: 'plan', title: { es: 'Plan antes de filmar', en: 'A plan before we shoot' }, text: { es: 'Cronograma y lista de tomas acordados contigo antes del día de rodaje.', en: 'Schedule and shot list agreed with you before shoot day.' } },
  { ok: false, icon: 'clock', title: { es: 'Plazos por escrito', en: 'Deadlines in writing' }, text: { es: 'Cada propuesta indica qué se entrega y en qué fecha.', en: 'Every proposal states what is delivered and when.' } },
  { ok: false, icon: 'loop', title: { es: 'Revisiones definidas', en: 'Defined revisions' }, text: { es: 'Las rondas de cambios quedan acordadas desde el comienzo.', en: 'Rounds of changes are agreed from the start.' } },
  { ok: false, icon: 'license', title: { es: 'Derechos de uso claros', en: 'Clear usage rights' }, text: { es: 'La propuesta explica dónde y por cuánto tiempo puedes usar el material.', en: 'The proposal explains where and for how long you may use the material.' } },
  { ok: false, icon: 'permit', title: { es: 'Permisos al día', en: 'Permits in order' }, text: { es: 'Coordinamos acreditaciones, permisos del recinto y las autorizaciones que exija cada rodaje.', en: 'We coordinate accreditations, venue permits and any authorisation a shoot requires.' } },
  { ok: false, icon: 'lock', title: { es: 'Confidencialidad', en: 'Confidentiality' }, text: { es: 'Los lanzamientos se mantienen en reserva hasta que la marca los publica.', en: 'Launches stay under wraps until the brand publishes them.' } },
  { ok: true, icon: 'gallery', title: { es: 'Galería privada', en: 'Private gallery' }, text: { es: 'Acceso con código para ver, marcar favoritas, comentar y descargar tus archivos.', en: 'Code-protected access to view, favourite, comment on and download your files.' } },
];

export const pendingCount = () =>
  Object.values(crew).filter((x) => !x.ok).length + phases.filter((x) => !x.ok).length
  + gear.filter((x) => !x.items.length).length + standards.filter((x) => !x.ok).length;
