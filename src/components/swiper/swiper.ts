import template from './swiper.html?raw';
import styles from './swiper.css?raw';
import { DIRECTION_COLOR, MAX_SWIPE_LENGTH } from "../../constants";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

export class Swiper extends HTMLElement {

  private startX: number = 0;
  private startY: number = 0;

  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');
    style.textContent = styles;

    shadow.appendChild(style);
    shadow.appendChild(templateElem.content.cloneNode(true));

    this.setupSwiping();
  }

  clearCanvas(): void {
    const canvas = this.shadowRoot!.getElementById('direction-canvas')! as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  private setupSwiping(): void {
    const swipeElement = this.shadowRoot!.getElementById('direction-canvas')!;

    swipeElement.addEventListener('touchstart', (event) => {
      this.start(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    });

    swipeElement.addEventListener('mousedown', (event) => {
      this.start(event.clientX, event.clientY);
    });

    swipeElement.addEventListener('touchend', (event) => {
      this.end(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    });

    swipeElement.addEventListener('mouseup', (event) => {
      this.end(event.pageX, event.pageY);
    });
  }

  private start(x: number, y: number): void {
    this.startX = x;
    this.startY = y;
  }

  private end(x: number, y: number): void {
    const length = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));

    if (length > MAX_SWIPE_LENGTH) {
      this.drawDirectionArrow(this.startX, this.startY, x, y);

      const heading = this.getHeading(this.startX, this.startY, x, y);
      this.fireHeadingChangedEvent(heading);
    }
  }

  private fireHeadingChangedEvent(heading: number): void {
    const event = new CustomEvent('heading', {
      detail: heading
    });

    this.dispatchEvent(event);
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
}
