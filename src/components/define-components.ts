import { App } from "./app/app";
import { Compass } from "./compass/compass";

export function defineComponents() {
  window.customElements.define('rd-app', App);
  window.customElements.define('rd-compass', Compass);
}
