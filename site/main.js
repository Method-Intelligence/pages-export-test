const masthead = document.querySelector('#masthead');
const introSection = document.querySelector('#about');
const cascade = document.querySelector('.cascade');
const dancerImages = [
  '../assets/isadora-dancing.jpg',
  '../assets/isadora-portrait.jpg',
  '../assets/isadora_duncan.jpg',
  '../assets/Isadora_Duncan2.jpg',
];
for (const image of cascade.querySelectorAll('img')) {
  image.src = dancerImages[Math.floor(Math.random() * dancerImages.length)];
}
const movingImages = Array.from(cascade.querySelectorAll('img'), image => ({
  image,
  depth: Number(getComputedStyle(image).getPropertyValue('--depth')),
}));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;

function updateHeaderTheme() {
  const edge = masthead.getBoundingClientRect().bottom;
  const about = introSection.getBoundingClientRect();
  const onLightSection = about.top > edge || about.bottom <= edge;
  masthead.classList.toggle('is-light', onLightSection);
  masthead.classList.toggle('is-over-home', cascade.getBoundingClientRect().bottom > edge);
}

function updateScrollEffects() {
  scrollFrame = 0;
  updateHeaderTheme();
  if (reducedMotion.matches) return;

  const distance = Math.max(0, -cascade.getBoundingClientRect().top + masthead.offsetHeight);
  for (const { image, depth } of movingImages) {
    const shift = Math.min(distance, cascade.offsetHeight) * depth;
    image.style.setProperty('--shift', shift + 'px');
  }
}

function scheduleScrollEffects() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}

updateScrollEffects();
window.addEventListener('scroll', scheduleScrollEffects, { passive: true });
window.addEventListener('resize', scheduleScrollEffects);
window.addEventListener('pageshow', scheduleScrollEffects);
reducedMotion.addEventListener('change', scheduleScrollEffects);

for (const image of document.querySelectorAll('.card-frame img')) {
  image.addEventListener('contextmenu', event => event.preventDefault());
}

const cascadeToggle = document.querySelector('#cascade-toggle');
cascadeToggle.addEventListener('click', () => {
  const hidden = cascade.classList.toggle('is-images-hidden');
  cascadeToggle.setAttribute('aria-pressed', String(!hidden));
  cascadeToggle.title = hidden ? 'Show cascading images' : 'Hide cascading images';
  scheduleScrollEffects();
});
