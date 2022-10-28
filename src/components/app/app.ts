import template from './app.html?raw';
import styles from './app.css?raw';

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

export class App extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    this.setupCompassEvents();
  }

  private setupCompassEvents() {
    const compass = this.shadowRoot!.querySelector('rd-compass');

    compass!.addEventListener('error', (event) => {
      console.error(event);

      const error = this.shadowRoot!.getElementById('error')!;

      error.hidden = false;
      // @ts-ignore
      error.innerHTML = event.detail;
    });
  }
}
