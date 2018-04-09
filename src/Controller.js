import World from './World.js';

export class Controller {
  /**
   * 
   * @param {World} world 
   */
  constructor(world) {
    /** @public */
    this.world = world;
  }
}

export class AhoController extends Controller{
  /**
   * 
   * @param {World} world 
   */
  constructor(world) {
    super(world);
  }
}
