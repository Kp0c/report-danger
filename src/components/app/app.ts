import template from './app.html?raw';
import styles from './app.css?raw';
import { GeolocationService } from "../../services/geolocation.service";
import { DIRECTION_COLOR, MAX_SWIPE_LENGTH } from "../../constants";
import { Coordinates } from "../../models/city";

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
    this.setupSwiping();
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
      this.clearCanvas();
      this.setStage('draw');
    });

    const reportMoreButton = this.shadowRoot!.getElementById('report-more-button')!;

    reportMoreButton.addEventListener('click', () => {
      this.clearCanvas();
      this.setStage('draw');
    });
  }

  private setupSwiping(): void {
    const swipeElement = this.shadowRoot!.getElementById('direction-canvas')!;

    let startX: number = 0;
    let startY: number = 0;
    let endX: number = 0;
    let endY: number = 0;

    swipeElement.addEventListener('touchstart', (event) => {
      startX = event.changedTouches[0].pageX;
      startY = event.changedTouches[0].pageY;
    });

    swipeElement.addEventListener('touchend', (event) => {
      endX = event.changedTouches[0].pageX;
      endY = event.changedTouches[0].pageY;

      const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));

      if (length > MAX_SWIPE_LENGTH) {
        this.drawDirectionArrow(startX, startY, endX, endY);

        this.drawnHeading = this.getHeading(startX, startY, endX, endY);

        console.log({arrowHeading: this.drawnHeading});

        this.setStage('approve');
      }
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

      console.log({compasHeading: this.currentHeading});
    });

    compass!.addEventListener('user-location', (event) => {
      // @ts-ignore
      this.userLocation = event.detail;
    });
  }

  private showError(error: string) {
    const errorElement = this.shadowRoot!.getElementById('error')!;

    errorElement.hidden = false;
    errorElement.innerHTML = error;
  }

  private clearCanvas(): void {
    const canvas = this.shadowRoot!.getElementById('direction-canvas')! as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Draw a direction arrow on the canvas with blue color.
   * @param {number} fromX - The x coordinate of the starting point.
   * @param {number} fromY - The y coordinate of the starting point.
   * @param {number} toX - The x coordinate of the ending point.
   * @param {number} toY - The y coordinate of the ending point.
   * @private
   */
  private drawDirectionArrow(fromX: number, fromY: number, toX: number, toY: number): void {
    const canvas = this.shadowRoot!.getElementById('direction-canvas')! as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;

    context.canvas.width = window.innerWidth;
    context.canvas.height = window.innerHeight;

    this.clearCanvas();

    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.strokeStyle = DIRECTION_COLOR;
    context.lineWidth = 5;
    context.stroke();

    this.drawArrowHead(toY, fromY, toX, fromX, context);
  }

  private drawArrowHead(toY: number, fromY: number, toX: number, fromX: number, context: CanvasRenderingContext2D): void {
    const arrowLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );

    context.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );

    context.lineTo(toX, toY);
    context.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    context.strokeStyle = DIRECTION_COLOR;
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = DIRECTION_COLOR;
    context.fill();
  }

  private getHeading(startX: number, startY: number, endX: number, endY: number): number {
    const deltaY = endY - startY;
    const deltaX = endX - startX;

    const circleDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    const northDegrees = circleDegrees + 90;

    return northDegrees < 0 ? 360 + northDegrees : northDegrees;
  }

  private setStage(stage: stages): void {
    this.currentStage = stage;

    this.renderStageInfo();
  }

  private renderStageInfo(): void {
    const stageInfo = this.shadowRoot!.getElementById('stage-info')!;
    const canvas = this.shadowRoot!.getElementById('direction-canvas')! as HTMLCanvasElement;
    const approveDenyContainer = this.shadowRoot!.getElementById('approve-deny-container')!;
    const reportMoreContainer = this.shadowRoot!.getElementById('report-more-container')!;

    approveDenyContainer.hidden = true;
    reportMoreContainer.hidden = true;
    canvas.style.pointerEvents = 'none';

    if (this.currentStage === 'draw') {
      stageInfo.innerHTML = 'Draw a dangerous item movement direction';
      canvas.style.pointerEvents = 'auto';
    } else if (this.currentStage === 'approve') {
      stageInfo.innerHTML = 'Approve the direction';
      approveDenyContainer.hidden = false;

      console.log({heading: (this.currentHeading + this.drawnHeading) % 360});
    } else if (this.currentStage === 'info') {
      const heading = (this.currentHeading + this.drawnHeading) % 360;
      const predictedCity = this.geoService.predictCity(this.userLocation, heading);

      console.log(this.drawnHeading, this.currentHeading);

      if (predictedCity) {
        stageInfo.innerHTML = `The item heading to the ${predictedCity.capital}. Distance: ${predictedCity.distance} km`;
      } else {
        stageInfo.innerHTML = 'The item heading to the unknown direction';
      }

      reportMoreContainer.hidden = false;
    }
  }
}
