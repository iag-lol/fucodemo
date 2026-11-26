// Se carga antes de pintar: marca que hay JavaScript y decide si mostrar la intro.
(function () {
  var d = document.documentElement;
  d.classList.replace('no-js', 'js');
  var seen = false;
  try { seen = !!sessionStorage.getItem('fuco:intro:v2'); } catch (e) {}
  if (seen) d.classList.add('seen');
  else d.style.setProperty('--hero-delay', '2.75s');
})();
