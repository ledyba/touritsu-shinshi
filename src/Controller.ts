import World from './World';

export class Controller {
  public readonly world: World;
  constructor(world: World) {
    this.world = world;
  }
}

export class AhoController extends Controller{
  constructor(world: World) {
    super(world);
  }
}
