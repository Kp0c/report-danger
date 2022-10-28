import template from './app.html?raw';
import styles from './app.css?raw';
import { GeolocationService } from "../../services/geolocation.service";
import { Coordinates } from "../../models/city";
import { Swiper } from "../swiper/swiper";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

type stages = 'init' | 'draw' | 'approve' | 'info';

/**
 * The main app component
 */
export class App extends HTMLElement {
  private geoService = new GeolocationService();
  private currentHeading = 0;
  private drawnHeading = 0;
  private currentStage: stages = 'init';
  private userLocation: Coordinates = {
    latitude: 0,
    longitude: 0
  };

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

    this.setup();
  }

  /**
   * Setup the app
   *
   * @private
   */
  private setup(): void {
    this.setupCompassEvents();
    this.setupSwiperEvents();
    this.setupButtons();

    this.setStage('init');
  }

  /**
   * Setup the button events
   *
   * @private
   */
  private setupButtons(): void {
    const approveButton = this.shadowRoot!.getElementById('approve-direction')!;
    const denyButton = this.shadowRoot!.getElementById('deny-direction')!;

    approveButton.addEventListener('click', () => {
      this.setStage('info');
    });

    denyButton.addEventListener('click', () => {
      this.clearSwiper();
      this.setStage('draw');
    });

    const reportMoreButton = this.shadowRoot!.getElementById('report-more-button')!;

    reportMoreButton.addEventListener('click', () => {
      this.clearSwiper();
      this.setStage('draw');
    });
  }

  /**
   * Setup the compass events (see `rd-compass` component)
   *
   * @private
   */
  private setupCompassEvents(): void {
    const compass = this.shadowRoot!.querySelector('rd-compass');

    compass!.addEventListener('error', (event) => {
      console.error(event);

      // @ts-ignore
      this.showError(event.detail);
    });

    compass!.addEventListener('heading', (event) => {
      // @ts-ignore
      this.currentHeading = 360 - event.detail; // we need to invert the heading
    });

    compass!.addEventListener('user-location', (event) => {
      // @ts-ignore
      this.userLocation = event.detail;
    });

    compass!.addEventListener('initialized', () => {
      this.setStage('draw');
    });
  }

  /**
   * Setup the swiper events (see `rd-swiper` component)
   *
   * @private
   */
  private setupSwiperEvents() {
    const swiper = this.shadowRoot!.querySelector('rd-swiper')!;

    swiper.addEventListener('heading', (event) => {
      // @ts-ignore
      this.drawnHeading = event.detail;

      this.setStage('approve');
    })

  }

  /**
   * Clear the swiper
   *
   * @private
   */
  private clearSwiper(): void {
    const swiper = this.shadowRoot!.querySelector('rd-swiper')! as Swiper;

    swiper.clearCanvas();
  }

  /**
   * Show an error message
   *
   * @param {string} error error message to show
   * @private
   */
  private showError(error: string): void {
    const errorElement = this.shadowRoot!.getElementById('error')!;

    errorElement.hidden = false;
    errorElement.innerHTML = error;
  }

  /**
   * Set the current stage
   *
   * @param {stage} stage
   * @private
   */
  private setStage(stage: stages): void {
    this.currentStage = stage;

    this.renderStageInfo();
  }

  /**
   * Render the stage info. This will show the correct buttons and hide the others
   * You can treat this as a state machine
   *
   * @private
   */
  private renderStageInfo(): void {
    const stageInfo = this.shadowRoot!.getElementById('stage-info')!;
    const initializing = this.shadowRoot!.getElementById('initializing')!;
    const swiper = this.shadowRoot!.querySelector('rd-swiper')! as Swiper;
    const approveDenyContainer = this.shadowRoot!.getElementById('approve-deny-container')!;
    const reportMoreContainer = this.shadowRoot!.getElementById('report-more-container')!;

    approveDenyContainer.hidden = true;
    reportMoreContainer.hidden = true;
    initializing.hidden = true;
    swiper.style.pointerEvents = 'none';

    if (this.currentStage === 'init') {
      initializing.hidden = false;
    } else if (this.currentStage === 'draw') {
      stageInfo.innerHTML = 'Draw a dangerous item movement relative to you.<br>' +
        'E.g. if it is moving towards you, draw an arrow from the top to the bottom of the screen.<br>' +
        'Use swipe on screen to draw an arrow.<br/>' +
        'Compass will be used to determine your heading.';
      swiper.style.pointerEvents = 'auto';
    } else if (this.currentStage === 'approve') {
      stageInfo.innerHTML = 'Approve the direction';
      approveDenyContainer.hidden = false;
    } else if (this.currentStage === 'info') {
      const heading = (this.currentHeading + this.drawnHeading) % 360;
      const predictedCity = this.geoService.predictCity(this.userLocation, heading);

      if (predictedCity) {
        stageInfo.innerHTML = `The item heading to the ${predictedCity.capital}. Distance: ${predictedCity.distance} km`;
      } else {
        stageInfo.innerHTML = 'The item heading to the unknown direction';
      }

      reportMoreContainer.hidden = false;
    }
  }
}
