// Logos de marcas. `file` es relativo a media-originals/. Para sumar uno: copia el archivo a
// media-originals/logos/, agrégalo aquí y ejecuta `node scripts/optimize-media.mjs && npm run build`.
// `mask` define cómo pasar a blanco: alpha (silueta), dark (zonas oscuras), bright/white (zonas claras), blue, solid.
const wix = (f) => `img/${f}`;
export const brands = [
  { id: 'falabella', name: 'Falabella', file: wix('5f6474_3bc7d88b2b4b410e96a5c521c0d5f55c~mv2.png') },
  { id: 'adidas', name: 'Adidas', file: 'logos/adidas.svg', scale: 0.92 },
  { id: 'adidas-terrex', name: 'Adidas Terrex', file: wix('5f6474_d60289023317464fa6f84e97c2fcbde1~mv2.png') },
  { id: 'under-armour', name: 'Under Armour', file: 'logos/under-armour.svg', scale: 0.95 },
  { id: 'paris', name: 'Paris', file: 'logos/paris.jpg', mask: 'blue', scale: 1.1 },
  { id: 'cenco-malls', name: 'Cenco Malls', file: wix('5f6474_672f53aa0f62448dbc9178000983f1a3~mv2.png') },
  { id: 'mallplaza', name: 'Mallplaza', file: 'logos/mallplaza.svg', crop: 0.515, scale: 1.08 },
  { id: 'heineken', name: 'Heineken', file: 'logos/heineken.svg', scale: 1.12 },
  { id: 'canada-dry', name: 'Canada Dry', file: 'logos/canada-dry.png', mask: 'dark', scale: 1.15 },
  { id: 'takis', name: 'Takis', file: 'logos/takis.webp', mask: 'bright', scale: 1.15 },
  { id: 'maybelline', name: 'Maybelline New York', file: 'logos/maybelline.svg' },
  { id: 'garnier', name: 'Garnier', file: 'logos/garnier.png', mask: 'white' },
  { id: 'bci', name: 'Bci', file: 'logos/bci.svg' },
  { id: 'pisco-diablo', name: 'Pisco Diablo', file: 'logos/pisco-diablo.png', mask: 'solid', scale: 1.05 },
];
