import template from './swiper.html?raw';
import styles from './swiper.css?raw';
import { DIRECTION_COLOR, MIN_SWIPE_LENGTH } from "../../constants";

const templateElem = document.createElement('template');
templateElem.innerHTML = template;

/**
 * The swiper component
 */
export class Swiper extends HTMLElement {

  /**
   * The x coordinate of the starting point.
   * @private
   */
  private startX: number = 0;

  /**
   * The y coordinate of the starting point.
   * @private
   */
  private startY: number = 0;

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

    this.setupSwiping();
  }

  /**
   * Clears the canvas.
   */
  clearCanvas(): void {
    const canvas = this.shadowRoot!.getElementById('direction-canvas')! as HTMLCanvasElement;
    const context = canvas.getContext('2d')!;

    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Sets up the swiping functionality.
   * @private
   */
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

  /**
   * Start the swipe event handler
   * @param {number} x - The x coordinate of the starting point.
   * @param {number} y - The y coordinate of the starting point.
   * @private
   */
  private start(x: number, y: number): void {
    this.startX = x;
    this.startY = y;
  }

  /**
   * End the swipe event handler
   * @param {number} x - The x coordinate of the ending point.
   * @param {number} y - The y coordinate of the ending point.
   * @private
   */
  private end(x: number, y: number): void {
    const length = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));

    if (length > MIN_SWIPE_LENGTH) {
      this.drawDirectionArrow(this.startX, this.startY, x, y);

      const heading = this.getHeading(this.startX, this.startY, x, y);
      this.fireHeadingChangedEvent(heading);
    }
  }

  /**
   * Fire the heading changed event.
   *
   * @param {number} heading - The azimuthal angle in degrees.
   * @private
   */
  private fireHeadingChangedEvent(heading: number): void {
    const event = new CustomEvent('heading', {
      detail: heading
    });

    this.dispatchEvent(event);
  }

  /**
   * Draw a direction arrow on the canvas with blue color.
   *
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

  /**
   * Draw an arrow head on the canvas.
   * @param {number} toY - The y coordinate of the ending point.
   * @param {number} fromY - The y coordinate of the starting point.
   * @param {number} toX - The x coordinate of the ending point.
   * @param {number} fromX - The x coordinate of the starting point.
   * @param {CanvasRenderingContext2D} context - The canvas context.
   * @private
   */
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

  /**
   * Get the heading from the starting point to the ending point in azimuthal angle in degrees.
   * @param {number} startX - The x coordinate of the starting point.
   * @param {number} startY - The y coordinate of the starting point.
   * @param {number} endX - The x coordinate of the ending point.
   * @param {number} endY - The y coordinate of the ending point.
   * @private
   */
  private getHeading(startX: number, startY: number, endX: number, endY: number): number {
    const deltaY = endY - startY;
    const deltaX = endX - startX;

    const circleDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    const northDegrees = circleDegrees + 90;

    return northDegrees < 0 ? 360 + northDegrees : northDegrees;
  }
}
