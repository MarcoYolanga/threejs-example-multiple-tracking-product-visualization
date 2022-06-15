/* eslint-disable no-case-declarations */
import Splide from '@splidejs/splide';
import Hammer from 'hammerjs';
import { gsap } from 'gsap';
import DocumentManager from '../dom/elements';
import World from './world';
/*
 * Splide slideshow
 */
const splide = new Splide('.splide', { arrows: false, pagination: 'slider' });
// Hide pagination on mount
splide.on('pagination:mounted', (data) => {
  data.list.classList.add('splide__pagination--custom');
});
// Add our slideshow functionality
splide.mount();

function switchSlide(world: World, DOM: DocumentManager) {
// Play the slide sound, if it's already playing, reset so that
  // it will play whenever we move the slides

  // Show or hide the reset button depending on the slide we're on
  DOM.toggleResetButton(splide.index > 0);

  const {
    instantTrackingHeadset,
  } = world.models;

  // Slide behaviour
  switch (splide.index) {
    case 0:

      break;
    default:
      break;
  }
}

splide.on('pagination:updated', (data) => {
  // Show or hide the pagination bullets depending on the slide we're on
  if (splide.index > 0) {
    data.list.classList.remove('splide__pagination--custom');
  } else {
    data.list.classList.add('splide__pagination--custom');
  }
});

// Swipe screen, not just slides
const hammer = new Hammer(document.body);
hammer.on('swipeleft', () => {
  // Increase our slide index by one when we slipe left
  splide.go(splide.index + 1);
});
hammer.on('swiperight', () => {
  // Decrease our slide index by one when we slipe left
  splide.go(splide.index - 1);
});

export default {
  switchSlide,
  splide,
  gsap,
};
