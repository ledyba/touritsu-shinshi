import * as PIXI from 'pixi.js';
import p2 from 'p2';
import { Controller } from './Controller';

const SCALE = 100.0;

export default class World {
  public readonly renderer: PIXI.Renderer;
  private readonly stage: PIXI.Container;
  private readonly world: p2.World;
  private parent_: HTMLElement | null = null;
  private groundBody: p2.Body | null = null;
  private groundShape: p2.Plane | null = null;
  private ballBody: p2.Body | null = null;
  private ballShape: p2.Circle | null = null;
  private ballEntity: PIXI.Sprite | null = null;
  private poleShape: p2.Box | null = null;
  private poleBody: p2.Body | null = null;
  private poleEntity: PIXI.Sprite | null = null;
  private wheelBody: p2.Body | null = null;
  private wheelShape: p2.Circle | null = null;
  private wheelEntity: PIXI.Sprite | null = null;
  private ballJoint: p2.RevoluteConstraint | null = null;
  private wheelJoint: p2.RevoluteConstraint | null = null;
  private frictionContactMaterial: p2.ContactMaterial | null = null;
  private readonly runner_: (time: number) => void;
  lastTime: any;
  constructor() {
    this.renderer = PIXI.autoDetectRenderer({
      width: 1280,
      height: 720,
      antialias:true
    }) as PIXI.Renderer;
    this.renderer.backgroundColor = 0xffffffff;
    this.stage = new PIXI.Container();
    this.world = new p2.World({
      gravity:[0, -9.82]
    });

    this.runner_ = this.run.bind(this);
  }

  start(parent: HTMLElement) {
    /** @private */
    this.parent_ = parent;
    this.parent_.appendChild(this.renderer.view);

    this.init();
    window.requestAnimationFrame(this.run.bind(this));
  }
  init() {

    /* ******** ground ******** */
    
    this.groundBody = new p2.Body();
    this.groundShape = new p2.Plane();
    this.groundShape.material = new p2.Material(),
    this.groundBody.addShape(this.groundShape);
    this.world.addBody(this.groundBody);

    /* ******** ball ******** */
    this.ballBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 4],
      mass: 1 // Setting mass to 0 makes the body static
    });
    this.ballShape = new p2.Circle({
      radius: 0.5,
    });
    this.ballBody.addShape(this.ballShape);
    this.world.addBody(this.ballBody);

    this.ballEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      g.beginFill(0xffffff, 1.0);
      g.lineStyle(2).moveTo(0.5 * SCALE, 0).lineTo(0.5 * SCALE, 1.0*SCALE);
      g.lineStyle(2).moveTo(0, 0.5 * SCALE).lineTo(1.0*SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create({
        width: g.width,
        height: g.height,
      });
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.ballEntity.anchor.x = 0.5;
    this.ballEntity.anchor.y = 0.5;

    /* ******** pole ******** */

    const poleHeight = (4-0.5);
    this.poleShape = new p2.Box({
      width: 0.3,
      height: poleHeight,
    });
    this.poleBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5 + poleHeight/2],
      mass: 1 // Setting mass to 0 makes the body static
    });
    this.poleBody.addShape(this.poleShape);
    this.world.addBody(this.poleBody);
    this.poleEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x527cbf, 1);
      g.drawRect(0,0,0.3 * SCALE,poleHeight * SCALE);
      const rt = PIXI.RenderTexture.create({
        width: g.width,
        height: g.height,
      });
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.poleEntity.anchor.x = 0.5;
    this.poleEntity.anchor.y = 0.5;

    /* ******** wheel ******** */

    this.wheelBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5],
      mass: 1 // Setting mass to 0 makes the body static
    });

    this.wheelShape = new p2.Circle({
      radius: 0.5,
    });
    this.wheelShape.material = new p2.Material();
    this.wheelBody.addShape(this.wheelShape);
    this.world.addBody(this.wheelBody);

    this.wheelEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1.0);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      g.beginFill(0xffffff, 1.0);
      g.lineStyle(2).moveTo(0.5 * SCALE, 0).lineTo(0.5 * SCALE, 1.0*SCALE);
      g.lineStyle(2).moveTo(0, 0.5 * SCALE).lineTo(1.0*SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create({
        width: g.width,
        height: g.height,
      });
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.wheelEntity.anchor.x = 0.5;
    this.wheelEntity.anchor.y = 0.5;

    /* ** Joints ** */
    this.stage.addChild(this.ballEntity);
    this.stage.addChild(this.wheelEntity);
    this.stage.addChild(this.poleEntity);

    this.ballJoint = new p2.RevoluteConstraint(this.ballBody, this.poleBody, {
      localPivotA: [0, 0],
      localPivotB: [0, poleHeight/2],
      collideConnected: false
    });
    this.world.addConstraint(this.ballJoint);

    this.wheelJoint = new p2.RevoluteConstraint(this.wheelBody, this.poleBody, {
      localPivotA: [0, 0],
      localPivotB: [0, -poleHeight/2],
      collideConnected: false,
      maxForce: 40,
    });
    this.world.addConstraint(this.wheelJoint);
    this.wheelJoint.motorEnabled = true;
    this.wheelJoint.setMotorSpeed(10);

    this.frictionContactMaterial = new p2.ContactMaterial(
      this.wheelShape.material,
      this.groundShape.material,
      {
        friction: 100
      }
    );
    this.world.addContactMaterial(this.frictionContactMaterial);
  }

  worldToScreen(pos: [number, number]) {
    const [posX, posY] = pos;
    return [posX * SCALE, this.renderer.height - (posY * SCALE)];
  }
  run(time: number) {
    window.requestAnimationFrame(this.runner_);
    // Do Physics
    p2.vec2.add(this.ballBody!.force, this.ballBody!.force, p2.vec2.fromValues((Math.random()-0.5)*10, (Math.random()-0.5)*10));

    this.wheelJoint?.setMotorSpeed(this.poleBody!.angle * 100);

    const deltaTime = this.lastTime ? (time - this.lastTime) / 1000 : 0;
    this.world.step(1.0/60, deltaTime, 10);

    let posX: number = 0
    let posY: number = 0;

    // Render
    [posX, posY] = this.worldToScreen(this.ballBody!.position as [number, number]);
    this.ballEntity!.position.x = posX;
    this.ballEntity!.position.y = posY;
    this.ballEntity!.rotation = -this.ballBody!.angle;

    [posX, posY] = this.worldToScreen(this.poleBody!.position as [number, number]);
    this.poleEntity!.position.x = posX;
    this.poleEntity!.position.y = posY;
    this.poleEntity!.rotation = -this.poleBody!.angle;

    [posX, posY] = this.worldToScreen(this.wheelBody!.position as [number, number]);
    this.wheelEntity!.position.x = posX;
    this.wheelEntity!.position.y = posY;
    this.wheelEntity!.rotation = -this.wheelBody!.angle;

    // render
    this.renderer.render(this.stage);
  }
}