import World from './World';

export class Controller {
  private setPoint: number;
  private sum: number;
  private prev: number;
  constructor() {
    this.setPoint = 0.0;
    this.sum = 0.0;
    this.prev = 0.0;
  }
  public run(input: number, delta: number): number {
    if(delta === 0) {
      return 0.0
    }
    const diff = (input - this.setPoint);
    this.sum += ((input + this.prev) / 2.0) * delta;
    const p = diff * 100;
    const i = this.sum * 200;
    const d = (diff / delta) * 7;

    this.prev = input;
    return p + i + d;
  }
}
