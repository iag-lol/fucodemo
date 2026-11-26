// Identidad del proveedor de desarrollo; no atribuye el contenido audiovisual.
export const developer = {
  name: 'Zyteron',
  url: 'https://www.zyteron.cl/',
  description: {
    es: 'Desarrollo de sitios web, software a medida, aplicaciones móviles, integraciones y automatización para empresas y profesionales.',
    en: 'Website development, custom software, mobile applications, integrations and automation for businesses and professionals.',
  },
};

export function websiteCredits(site, lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: `${site.url}/`,
    name: site.name,
    inLanguage: ['es', 'en'],
    publisher: { '@type': 'Organization', name: site.name, url: site.url },
    creator: {
      '@type': 'Organization',
      name: developer.name,
      url: developer.url,
      description: developer.description[lang] ?? developer.description.es,
    },
    creditText: `Desarrollo web: ${developer.name}`,
  };
}
