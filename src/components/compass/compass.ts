import template from './compass.html?raw';
import styles from './compass.css?raw';

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

export class Compass extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    this.setupCompass();
  }

  private setupCompass(): void {
    navigator.geolocation.getCurrentPosition(
      () => this.setupOrientationServicePermissions(),
      (err) => this.dispatchError(err.message)
    );
  }

  private dispatchError(errorMessage: string): void {
    const event = new CustomEvent('error', {detail: errorMessage});
    this.dispatchEvent(event);
  }

  private setupOrientationServicePermissions() {
    Promise.all([
      // @ts-ignore
      navigator.permissions.query({name: "accelerometer"}),
      // @ts-ignore
      navigator.permissions.query({name: "magnetometer"}),
      // @ts-ignore
      navigator.permissions.query({name: "gyroscope"}),
    ])
      .then((results) => {
        if (results.every((result) => result.state === "granted")) {
          this.setupAbsoluteOrientationSensor();
        } else {
          this.dispatchError('Permission to use AbsoluteOrientationSensor was denied.');
        }
      })
      .catch((err) => this.dispatchError(err.message));
  }

  setupAbsoluteOrientationSensor(): void {
    const compassImage = this.shadowRoot!.getElementById('compass-image')!;

    // @ts-ignore
    const sensor = new AbsoluteOrientationSensor({frequency: 30, referenceFrame: 'device'});

    sensor.addEventListener('reading', () => {
      const heading = this.quaternionToNorthDegrees(sensor.quaternion);
      compassImage.style.transform = `rotate(${heading}deg)`;
    });

    sensor.addEventListener("error", (error: {message: string}) => {
      this.dispatchError(error.message);
    });

    sensor.start();
  }

  private quaternionToNorthDegrees(q: number[]): number {
    return Math.atan2(2 * q[0] * q[1] + 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2]) * (180 / Math.PI);
  }
}
