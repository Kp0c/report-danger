import template from './app.html?raw';
import styles from './app.css?raw';
import { GeolocationService } from "../../services/geolocation.service";
import { Coordinates } from "../../models/city";
import { Swiper } from "../swiper/swiper";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

type stages = 'draw' | 'approve' | 'info';

export class App extends HTMLElement {
  private geoService = new GeolocationService();
  private currentHeading = 0;
  private drawnHeading = 0;
  private currentStage: stages = 'draw';
  private userLocation: Coordinates = {
    latitude: 0,
    longitude: 0
  };

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    this.load().catch((error) => {
      this.showError(error);
    });
  }

  private async load(): Promise<void> {
    await this.geoService.init('/data/cities.json');

    this.setupCompassEvents();
    console.log('App loaded');
    this.setupSwiperEvents();
    this.setupButtons();

    this.setStage('draw');
  }

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
  }

  private setupSwiperEvents() {
    const swiper = this.shadowRoot!.querySelector('rd-swiper')!;

    swiper.addEventListener('heading', (event) => {
      // @ts-ignore
      this.drawnHeading = event.detail;

      this.setStage('approve');
    })

  }

  private clearSwiper(): void {
    const swiper = this.shadowRoot!.querySelector('rd-swiper')! as Swiper;

    swiper.clearCanvas();
  }

  private showError(error: string) {
    const errorElement = this.shadowRoot!.getElementById('error')!;

    errorElement.hidden = false;
    errorElement.innerHTML = error;
  }

  private setStage(stage: stages): void {
    this.currentStage = stage;

    this.renderStageInfo();
  }

  private renderStageInfo(): void {
    const stageInfo = this.shadowRoot!.getElementById('stage-info')!;
    const swiper = this.shadowRoot!.querySelector('rd-swiper')! as Swiper;
    const approveDenyContainer = this.shadowRoot!.getElementById('approve-deny-container')!;
    const reportMoreContainer = this.shadowRoot!.getElementById('report-more-container')!;

    approveDenyContainer.hidden = true;
    reportMoreContainer.hidden = true;
    swiper.style.pointerEvents = 'none';

    if (this.currentStage === 'draw') {
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
