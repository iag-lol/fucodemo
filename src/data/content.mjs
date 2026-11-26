// Textos de servicios, proceso y preguntas frecuentes. Revísalos y ajústalos a tu forma de trabajar.
export const services = [
  {
    id: 'eventos', n: '01', image: 'paris-parade', related: ['paris-parade', 'f1-la-pelicula', 'festibike-cenco-malls'],
    title: { es: 'Cobertura de eventos', en: 'Event coverage' },
    text: {
      es: 'Lanzamientos, estrenos, activaciones y eventos masivos. Equipo de foto y video coordinado para que no se escape ningún momento.',
      en: 'Launches, premieres, activations and large-scale events. A coordinated photo and video crew so no moment slips by.',
    },
    items: { es: ['Fotografía editada', 'Registro en video', 'Entregas rápidas para redes'], en: ['Edited photography', 'Video documentation', 'Quick social deliveries'] },
  },
  {
    id: 'aftermovie', n: '02', image: 'ffl-f-01', related: ['falabella-fashion-live', 'adidas-fest-snow-edition', 'paris-parade'],
    title: { es: 'Aftermovies', en: 'Aftermovies' },
    text: {
      es: 'La experiencia completa en una pieza con ritmo, color y diseño sonoro. Pensada para que quien no estuvo quiera estar en la próxima.',
      en: 'The whole experience in one piece with rhythm, colour and sound design. Made so those who missed it want in next time.',
    },
    items: { es: ['Guion de montaje', 'Corrección de color', 'Versiones 16:9 y 9:16'], en: ['Edit structure', 'Colour grading', '16:9 and 9:16 versions'] },
  },
  {
    id: 'moda', n: '03', image: 'ffl-07', related: ['falabella-fashion-live', 'alaniz-pombo-paris', 'maybelline-teddy'],
    title: { es: 'Moda & beauty', en: 'Fashion & beauty' },
    text: {
      es: 'Pasarela, backstage, lookbooks y lanzamientos. Atención al detalle de cada prenda, textura y tono de piel.',
      en: 'Runway, backstage, lookbooks and launches. Close attention to every garment, texture and skin tone.',
    },
    items: { es: ['Pasarela y backstage', 'Lookbook y campaña', 'Retoque'], en: ['Runway and backstage', 'Lookbook and campaign', 'Retouching'] },
  },
  {
    id: 'vertical', n: '04', image: 'alaniz-f-01', related: ['alaniz-pombo-paris', 'canada-dry', 'mallplaza-records'],
    title: { es: 'Contenido vertical', en: 'Vertical content' },
    text: {
      es: 'Reels y TikToks filmados en vertical desde el origen, no recortados. Enganche en los primeros segundos.',
      en: 'Reels and TikToks shot vertically from the start, not cropped. A hook in the first seconds.',
    },
    items: { es: ['Reels y TikTok', 'Subtítulos y gráficas', 'Series de piezas'], en: ['Reels and TikTok', 'Captions and graphics', 'Content series'] },
  },
  {
    id: 'marca', n: '05', image: 'canada-f-01', related: ['adidas-originals', 'canada-dry', 'takis-intense'],
    title: { es: 'Marca & producto', en: 'Brand & product' },
    text: {
      es: 'Piezas de marca y fotografía de producto con una dirección visual coherente, del concepto a la entrega.',
      en: 'Brand films and product photography with consistent visual direction, from concept to delivery.',
    },
    items: { es: ['Concepto y dirección', 'Producto y bodegón', 'Piezas publicitarias'], en: ['Concept and direction', 'Product and still life', 'Advertising assets'] },
  },
  {
    id: 'deporte', n: '06', image: 'terrex-04', related: ['adidas-fest-snow-edition', 'maraton-santiago-bci', 'under-armour-halo'],
    title: { es: 'Deporte & aéreo', en: 'Sport & aerial' },
    text: {
      es: 'Carreras, outdoor y acción en condiciones exigentes, con tomas aéreas que muestran la escala real del evento.',
      en: 'Races, outdoor and action in demanding conditions, with aerial shots that show the true scale of the event.',
    },
    items: { es: ['Fotografía de acción', 'Tomas aéreas', 'Retrato deportivo'], en: ['Action photography', 'Aerial footage', 'Sports portraiture'] },
  },
];

export const processSteps = [
  { t: { es: 'Brief', en: 'Brief' }, d: { es: 'Escuchamos qué necesitas comunicar, a quién y dónde se va a ver.', en: 'We listen to what you need to say, to whom, and where it will be seen.' } },
  { t: { es: 'Preproducción', en: 'Pre-production' }, d: { es: 'Referencias, plan de rodaje, equipo, permisos y cronograma.', en: 'References, shot list, crew, permits and schedule.' } },
  { t: { es: 'Rodaje', en: 'Shoot' }, d: { es: 'Foto y video en terreno, con foco en los momentos que no se repiten.', en: 'Photo and video on location, focused on the moments that never repeat.' } },
  { t: { es: 'Postproducción', en: 'Post-production' }, d: { es: 'Selección, montaje, color, sonido y retoque.', en: 'Selection, editing, colour, sound and retouching.' } },
  { t: { es: 'Entrega', en: 'Delivery' }, d: { es: 'Galería privada y archivos en cada formato que necesitas.', en: 'Private gallery and files in every format you need.' } },
];

export const faqs = [
  { q: { es: '¿Cómo pido una cotización?', en: 'How do I request a quote?' }, a: { es: 'Usa el cotizador: eliges servicios, entregables y fecha, y te respondemos con una propuesta. También puedes escribirnos por WhatsApp o correo.', en: 'Use the quote builder: pick services, deliverables and a date, and we reply with a proposal. You can also reach us by WhatsApp or email.' } },
  { q: { es: '¿Cuánto demora la entrega?', en: 'How long does delivery take?' }, a: { es: 'Depende del alcance. El plazo queda definido en la propuesta; si necesitas piezas el mismo día, indícalo al cotizar.', en: 'It depends on scope. The timeline is set in the proposal; if you need same-day assets, tell us when requesting the quote.' } },
  { q: { es: '¿Hacen foto y video en la misma jornada?', en: 'Do you shoot photo and video on the same day?' }, a: { es: 'Sí. Podemos armar un equipo que cubra ambos formatos de manera coordinada.', en: 'Yes. We can put together a crew that covers both formats in a coordinated way.' } },
  { q: { es: '¿Trabajan fuera de Santiago?', en: 'Do you work outside Santiago?' }, a: { es: 'Cuéntanos dónde es tu proyecto y lo incluimos en la propuesta junto con los traslados.', en: 'Tell us where your project is and we will include it in the proposal along with travel.' } },
  { q: { es: '¿Cómo recibo el material?', en: 'How do I receive the files?' }, a: { es: 'A través de una galería privada con código, donde puedes marcar favoritas y descargar tus archivos.', en: 'Through a private code-protected gallery where you can pick favourites and download your files.' } },
];

// Opciones del cotizador. Los precios se administran desde /admin/ (ocultos por defecto).
export const quoteOptions = {
  format: [
    { id: 'foto', es: 'Fotografía', en: 'Photography' },
    { id: 'video', es: 'Video', en: 'Video' },
    { id: 'ambos', es: 'Foto + video', en: 'Photo + video' },
  ],
  duration: [
    { id: 'media', es: 'Media jornada', en: 'Half day' },
    { id: 'completa', es: 'Jornada completa', en: 'Full day' },
    { id: 'varios', es: 'Varios días', en: 'Multiple days' },
  ],
  deliverables: [
    { id: 'fotos', es: 'Fotos editadas', en: 'Edited photos' },
    { id: 'aftermovie', es: 'Aftermovie', en: 'Aftermovie' },
    { id: 'reels', es: 'Reels verticales', en: 'Vertical reels' },
    { id: 'aereo', es: 'Tomas aéreas', en: 'Aerial footage' },
    { id: 'sameday', es: 'Entrega el mismo día', en: 'Same-day delivery' },
    { id: 'crudos', es: 'Material en bruto', en: 'Raw footage' },
  ],
  budget: [
    { id: 'pd', es: 'Por definir', en: 'To be defined' },
    { id: 'a', es: 'Hasta $500.000 CLP', en: 'Up to CLP 500,000' },
    { id: 'b', es: '$500.000 – $1.500.000', en: 'CLP 500,000 – 1,500,000' },
    { id: 'c', es: '$1.500.000 – $4.000.000', en: 'CLP 1,500,000 – 4,000,000' },
    { id: 'd', es: 'Más de $4.000.000', en: 'Over CLP 4,000,000' },
  ],
};
