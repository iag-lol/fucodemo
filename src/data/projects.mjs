// Portafolio. Para sumar un proyecto, agrega un objeto aquí (el orden es el orden en la web).
// `photos`: nombres definidos en scripts/media-map.mjs o archivos de media-originals/stills (sin extensión).
// `videos`: id = nombre base del archivo en media-originals/video. Para un proyecto sin video,
// basta con dejar media-originals/video-extra/<slug>.mp4 y se agrega solo.

export const categories = {
  moda: { es: 'Moda & Beauty', en: 'Fashion & Beauty' },
  deporte: { es: 'Deporte', en: 'Sport' },
  eventos: { es: 'Eventos', en: 'Events' },
  marcas: { es: 'Marcas', en: 'Brands' },
  musica: { es: 'Música & Shows', en: 'Music & Shows' },
};

const frames = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
const range = (prefix, from, to) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}-${String(from + i).padStart(2, '0')}`);
const H = { es: 'Aftermovie', en: 'Aftermovie' };
const V = { es: 'Reel vertical', en: 'Vertical reel' };

export const projects = [
  {
    slug: 'falabella-fashion-live', title: 'Falabella Fashion Live 25', client: 'Falabella', year: 2025,
    cats: ['moda', 'eventos', 'musica'], featured: true, cover: 'ffl-03',
    summary: {
      es: 'Pasarela al aire libre, show en vivo y red carpet. Foto y video de una noche donde la moda y la música compartieron escenario.',
      en: 'Open-air runway, live show and red carpet. Photo and video of a night where fashion and music shared the stage.',
    },
    scope: { es: ['Fotografía de pasarela', 'Aftermovie', 'Reel vertical', 'Show en vivo'], en: ['Runway photography', 'Aftermovie', 'Vertical reel', 'Live show'] },
    photos: [...range('ffl', 1, 8), ...frames('ffl-f', 4), ...frames('ffl-v', 2)],
    videos: [{ id: 'falabella-aftermovie', label: H, poster: 'ffl-f-01' }, { id: 'falabella-vertical', label: V, poster: 'ffl-v-01', vertical: true }],
  },
  {
    slug: 'adidas-fest-snow-edition', title: 'Adidas Fest · Snow Edition', client: 'Adidas Terrex', cats: ['deporte', 'eventos'], featured: true, cover: 'terrex-02',
    summary: {
      es: 'Carrera sobre nieve en la cordillera. Acción, altura y comunidad registradas desde el piso y desde el aire.',
      en: 'A snow race high in the Andes. Action, altitude and community captured from the ground and from the air.',
    },
    scope: { es: ['Fotografía deportiva', 'Tomas aéreas', 'Aftermovie', 'Reel vertical'], en: ['Sports photography', 'Aerial footage', 'Aftermovie', 'Vertical reel'] },
    photos: [...range('terrex', 1, 11), ...frames('adidasfest-f', 5), ...frames('adidasfest-v', 4)],
    videos: [{ id: 'adidas-fest-recap', label: H, poster: 'terrex-05' }, { id: 'adidas-recap-vertical', label: V, poster: 'adidasfest-v-03', vertical: true }],
  },
  {
    slug: 'adidas-originals', title: 'Adidas Originals', client: 'Adidas', cats: ['marcas', 'moda'], featured: true, cover: 'originals-f-01',
    summary: {
      es: 'Santiago como set: metro, esquinas, barrio y mesa compartida en una pieza urbana con identidad propia.',
      en: 'Santiago as a set: subway, street corners, neighbourhood and shared tables in an urban piece with its own identity.',
    },
    scope: { es: ['Dirección de fotografía', 'Video de marca', 'Edición y color'], en: ['Cinematography', 'Brand film', 'Edit & colour'] },
    photos: ['originals-poster', ...frames('originals-f', 10)],
    videos: [{ id: 'hero', label: { es: 'Pieza de marca', en: 'Brand film' }, poster: 'originals-poster' }],
  },
  {
    slug: 'festibike-cenco-malls', title: 'Festi Bike', client: 'Cenco Malls', year: 2025, cats: ['eventos', 'deporte'], featured: true, cover: 'bike-06',
    summary: {
      es: 'La ciudad en dos ruedas: cicletada, saltos BMX, música y familias a los pies de la Costanera.',
      en: 'The city on two wheels: group ride, BMX jumps, music and families at the foot of the Costanera tower.',
    },
    scope: { es: ['Fotografía de evento', 'Aftermovie', 'Tomas aéreas'], en: ['Event photography', 'Aftermovie', 'Aerial footage'] },
    photos: [...range('bike', 1, 10), ...frames('bike-f', 5)],
    videos: [{ id: 'cenco-bike', label: H, poster: 'bike-01' }],
  },
  {
    slug: 'paris-parade', title: 'Paris Parade', client: 'Paris', year: 2025, cats: ['eventos', 'musica'], featured: true, cover: 'paris-parade',
    summary: {
      es: 'El desfile navideño por el centro de Santiago: globos gigantes, comparsas y miles de personas en la calle.',
      en: 'The Christmas parade through downtown Santiago: giant balloons, dance troupes and thousands of people on the street.',
    },
    scope: { es: ['Cobertura de gran formato', 'Aftermovie', 'Tomas aéreas'], en: ['Large-scale coverage', 'Aftermovie', 'Aerial footage'] },
    photos: ['paris-parade', ...frames('parade-f', 10)],
    videos: [{ id: 'paris-parade', label: H, poster: 'paris-parade' }],
  },
  {
    slug: 'under-armour-halo', title: 'Halo', client: 'Under Armour', cats: ['deporte', 'marcas'], featured: true, cover: 'under-armour',
    summary: {
      es: 'Luz roja, líneas de neón y movimiento: retrato deportivo para el universo Halo.',
      en: 'Red light, neon lines and movement: sports portraiture for the Halo universe.',
    },
    scope: { es: ['Fotografía de producto en uso', 'Retrato', 'Dirección de luz'], en: ['Product-in-use photography', 'Portrait', 'Lighting design'] },
    photos: ['under-armour'], videos: [],
  },
  {
    slug: 'alaniz-pombo-paris', title: 'Alaniz × María Pombo', client: 'Paris', cats: ['moda', 'eventos'], cover: 'pombo',
    summary: {
      es: 'Una tarde frente al mar para presentar la colaboración: moda, conversación y la hora dorada.',
      en: 'A seaside afternoon introducing the collaboration: fashion, conversation and golden hour.',
    },
    scope: { es: ['Fotografía lifestyle', 'Reel vertical', 'Tomas aéreas'], en: ['Lifestyle photography', 'Vertical reel', 'Aerial footage'] },
    photos: ['pombo', ...frames('alaniz-f', 7)],
    videos: [{ id: 'recap-experiencia', label: V, poster: 'alaniz-f-01', vertical: true }],
  },
  {
    slug: 'f1-la-pelicula', title: 'F1 · La Película', client: 'Estreno IMAX', cats: ['eventos', 'marcas'], cover: 'f1-imax',
    summary: {
      es: 'Noche de estreno: alfombra, invitados y la estética de pits llevada a la sala IMAX.',
      en: 'Premiere night: carpet, guests and pit-lane aesthetics brought to the IMAX theatre.',
    },
    scope: { es: ['Cobertura de estreno', 'Reel vertical'], en: ['Premiere coverage', 'Vertical reel'] },
    photos: ['f1-imax', ...frames('f1-f', 6)],
    videos: [{ id: 'f1-la-pelicula', label: V, poster: 'f1-f-01', vertical: true }],
  },
  {
    slug: 'canada-dry', title: 'Canada Dry', client: 'Canada Dry', cats: ['marcas', 'eventos'], cover: 'canada-dry',
    summary: {
      es: 'Atardecer, DJ sets y producto en mano. La marca como protagonista de la fiesta con Santiago de fondo.',
      en: 'Sunset, DJ sets and product in hand. The brand at the centre of the party with Santiago behind it.',
    },
    scope: { es: ['Fotografía de producto', 'Activación de marca', 'Reel vertical'], en: ['Product photography', 'Brand activation', 'Vertical reel'] },
    photos: ['canada-dry', ...frames('canada-f', 6)],
    videos: [{ id: 'canada-dry', label: V, poster: 'canada-f-03', vertical: true }],
  },
  {
    slug: 'mallplaza-records', title: 'Mallplaza Records', client: 'Mallplaza', cats: ['musica', 'marcas'], cover: 'mall-f-01',
    summary: {
      es: 'Un estudio de grabación dentro del mall: voces, instrumentos y público convertidos en historia.',
      en: 'A recording studio inside the mall: voices, instruments and audience turned into a story.',
    },
    scope: { es: ['Video de activación', 'Reel vertical', 'Fotografía'], en: ['Activation video', 'Vertical reel', 'Photography'] },
    photos: ['mallplaza', ...frames('mall-f', 7)],
    videos: [{ id: 'mallplaza-records', label: V, poster: 'mall-f-01', vertical: true }],
  },
  {
    slug: 'maybelline-lollapalooza', title: 'Lollapalooza', client: 'Maybelline', cats: ['moda', 'musica'], cover: 'maybelline-lolla',
    summary: { es: 'Retratos de festival: color, brillo y energía a plena luz.', en: 'Festival portraits: colour, shine and energy in full daylight.' },
    scope: { es: ['Retrato', 'Fotografía de festival'], en: ['Portrait', 'Festival photography'] },
    photos: ['maybelline-lolla'], videos: [],
  },
  {
    slug: 'garnier-lollapalooza', title: 'Lollapalooza', client: 'Garnier', cats: ['marcas', 'musica'], cover: 'garnier-lolla',
    summary: { es: 'La activación de Garnier en el festival, entre vegetación y producto.', en: 'Garnier’s festival activation, among greenery and product.' },
    scope: { es: ['Activación de marca', 'Video'], en: ['Brand activation', 'Video'] },
    photos: ['garnier-lolla'], videos: [],
  },
  {
    slug: 'maybelline-teddy', title: 'Teddy', client: 'Maybelline', cats: ['moda', 'marcas'], cover: 'maybelline-teddy',
    summary: { es: 'Lanzamiento en clave rosa: invitadas, set y retratos con la identidad de la marca.', en: 'A launch in pink: guests, set design and portraits in the brand’s identity.' },
    scope: { es: ['Evento de lanzamiento', 'Video'], en: ['Launch event', 'Video'] },
    photos: ['maybelline-teddy'], videos: [],
  },
  {
    slug: 'takis-intense', title: 'Takis Intense', client: 'Takis', cats: ['marcas'], cover: 'takis-intense',
    summary: { es: 'Neón, color e intensidad para una pieza que se mueve al ritmo del producto.', en: 'Neon, colour and intensity for a piece that moves to the product’s rhythm.' },
    scope: { es: ['Video publicitario', 'Dirección de color'], en: ['Commercial video', 'Colour direction'] },
    photos: ['takis-intense'], videos: [],
  },
  {
    slug: 'heineken-sundeck', title: 'Sundeck', client: 'Heineken', cats: ['musica', 'eventos'], cover: 'heineken-sundeck',
    summary: { es: 'Luces rojas y pista llena: registro de una experiencia nocturna de marca.', en: 'Red lights and a full floor: documenting a branded night experience.' },
    scope: { es: ['Cobertura nocturna', 'Video'], en: ['Night coverage', 'Video'] },
    photos: ['heineken-sundeck'], videos: [],
  },
  {
    slug: 'maraton-santiago-bci', title: 'Maratón de Santiago', client: 'BCI', cats: ['deporte', 'eventos'], cover: 'maraton-bci',
    summary: { es: 'El instante de cruzar la meta, y toda la ciudad corriendo detrás.', en: 'The moment of crossing the line, with the whole city running behind.' },
    scope: { es: ['Fotografía deportiva', 'Video'], en: ['Sports photography', 'Video'] },
    photos: ['maraton-bci'], videos: [],
  },
  {
    slug: 'mother-mother-chile', title: 'Mother Mother en Chile', client: 'Mother Mother', cats: ['musica'], cover: 'mother-mother',
    summary: { es: 'El show desde dentro: escenario, humo y un público que canta cada palabra.', en: 'The show from inside: stage, smoke and a crowd singing every word.' },
    scope: { es: ['Fotografía de concierto', 'Video'], en: ['Concert photography', 'Video'] },
    photos: ['mother-mother'], videos: [],
  },
  {
    slug: 'pisco-diablo', title: 'Pisco Diablo', client: 'Diablo', cats: ['marcas'], cover: 'pisco-diablo',
    summary: { es: 'Producto, geometría y luz cálida en formato vertical.', en: 'Product, geometry and warm light in vertical format.' },
    scope: { es: ['Video de producto', 'Formato vertical'], en: ['Product video', 'Vertical format'] },
    photos: ['pisco-diablo'], videos: [],
  },
  {
    slug: 'hoy-es-hoy-pamela-diaz', title: 'Hoy es Hoy', client: 'Pamela Díaz', cats: ['eventos', 'moda'], cover: 'pamela-diaz',
    summary: { es: 'Retrato en locación con la energía del set encendido detrás.', en: 'On-location portrait with the energy of a live set behind it.' },
    scope: { es: ['Retrato', 'Fotografía en set'], en: ['Portrait', 'On-set photography'] },
    photos: ['pamela-diaz'], videos: [],
  },
];
