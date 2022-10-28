import template from './compass.html?raw';
import styles from './compass.css?raw';
import { Coordinates } from "../../models/city";

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
      (position) => {
        this.setupOrientationServicePermissions();

        this.dispatchUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) =>{
        console.error(err);
        this.dispatchError(err.message)
      }
    );
  }

  private dispatchError(errorMessage: string): void {
    const event = new CustomEvent('error', {detail: errorMessage});
    this.dispatchEvent(event);
  }

  private dispatchHeading(heading: number): void {
    const event = new CustomEvent('heading', {detail: heading});
    this.dispatchEvent(event);
  }

  private dispatchUserLocation(location: Coordinates): void {
    const event = new CustomEvent('user-location', {detail: location});
    this.dispatchEvent(event);
  };

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
      .catch((err) => {
        console.error(err);
        this.dispatchError(err.message)
      });
  }

  private setupAbsoluteOrientationSensor(): void {
    const compassImage = this.shadowRoot!.getElementById('compass-image')!;

    // @ts-ignore
    const sensor = new AbsoluteOrientationSensor({frequency: 30, referenceFrame: 'device'});

    sensor.addEventListener('reading', () => {
      const heading = this.quaternionToNorthDegrees(sensor.quaternion);
      compassImage.style.transform = `rotate(${heading}deg)`;

      this.dispatchHeading(heading);
    });

    sensor.addEventListener("error", (error: {error: { message: string} }) => {
      console.error(error);
      this.dispatchError(error.error.message);
    });

    sensor.start();
  }

  private quaternionToNorthDegrees(q: number[]): number {
    const heading = Math.atan2(2 * q[0] * q[1] + 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2]) * (180 / Math.PI);

    return heading < 0 ? heading + 360 : heading;
  }
}
