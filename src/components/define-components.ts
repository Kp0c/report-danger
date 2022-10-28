import { App } from "./app/app";
import { Compass } from "./compass/compass";
import { Swiper } from "./swiper/swiper";

/**
 * Register all the components
 */
export function defineComponents() {
  window.customElements.define('rd-app', App);
  window.customElements.define('rd-compass', Compass);
  window.customElements.define('rd-swiper', Swiper);
}
