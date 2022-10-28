import template from './compass.html?raw';
import styles from './compass.css?raw';
import { Coordinates } from "../../models/city";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

/**
 * The compass component
 */
export class Compass extends HTMLElement {
  private isGeolocationInitialized = false;
  private isOrientationServiceInitialized = false;
  private initEventWasDispatched = false;

  /**
   * Called when the element is added to the DOM
   */
  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    this.setupLocation();
    this.setupOrientationServicePermissions();
  }

  /**
   * Setup the geolocation watcher
   * @private
   */
  private setupLocation(): void {
    navigator.geolocation.watchPosition(
      (position) => {
        this.isGeolocationInitialized = true;
        this.dispatchInitialized();

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

  /**
   * Dispatch an error event
   * @param {string} errorMessage error message to dispatch
   * @private
   */
  private dispatchError(errorMessage: string): void {
    const event = new CustomEvent('error', {detail: errorMessage});
    this.dispatchEvent(event);
  }

  /**
   * Dispatch an azimuth heading event
   * @param {number} heading heading to dispatch
   * @private
   */
  private dispatchHeading(heading: number): void {
    const event = new CustomEvent('heading', {detail: heading});
    this.dispatchEvent(event);
  }

  /**
   * Dispatch the user location
   *
   * @param {Coordinates} location location to dispatch
   * @private
   */
  private dispatchUserLocation(location: Coordinates): void {
    const event = new CustomEvent('user-location', {detail: location});
    this.dispatchEvent(event);
  };

  /**
   * Called when the component is completed initializing
   * @private
   */
  private dispatchInitialized(): void {
    if (this.isGeolocationInitialized && this.isOrientationServiceInitialized && !this.initEventWasDispatched) {
      const event = new CustomEvent('initialized');
      this.dispatchEvent(event);
      this.initEventWasDispatched = true;
    }
  }

  /**
   * Setup the permissions that are needed for the AbsoluteOrientationSensor
   * @private
   */
  private setupOrientationServicePermissions(): void {
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

          this.isOrientationServiceInitialized = true;
          this.dispatchInitialized();
        } else {
          this.dispatchError('Permission to use AbsoluteOrientationSensor was denied.');
        }
      })
      .catch((err) => {
        console.error(err);
        this.dispatchError(err.message)
      });
  }

  /**
   * Setup the absolute orientation sensor
   *
   * @private
   */
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

  /**
   * Convert a quaternion to a heading in degrees (azimuth orientation)
   *
   * @param {number[]} q quaternion. [x, y, z, w] format. Name is simplified to be closer to the original formula
   * @private
   */
  private quaternionToNorthDegrees(q: number[]): number {
    const heading = Math.atan2(2 * q[0] * q[1] + 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2]) * (180 / Math.PI);

    return heading < 0 ? heading + 360 : heading;
  }
}
