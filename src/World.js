import * as PIXI from 'pixi.js';
import p2 from 'p2';
import { Controller } from './Controller.js';

const SCALE = 100.0;

export default class World {
  constructor() {
    /**
     * @type {PIXI.WebGLRenderer}
     * @public
     */
    this.renderer = PIXI.autoDetectRenderer(1024, 576, {antialias:true});
    this.renderer.backgroundColor = 0xffffffff;

    /**
     * @type {PIXI.Container}
     * @private
     */
    this.stage = new PIXI.Container();

    this.world = new p2.World({
      gravity:[0, -9.82]
    });
  }

  /**
   * @param {HTMLElement} parent 
   */
  start(parent) {
    /** @private */
    this.parent_ = parent;
    this.parent_.appendChild(this.renderer.view);

    this.init();
    window.requestAnimationFrame(this.run.bind(this));
  }
  init() {

    /* ******** ground ******** */
    
    /** @public */
    this.groundBody = new p2.Body();
    /** @public */
    this.groundShape = new p2.Plane({
      material: new p2.Material()
    });
    this.groundBody.addShape(this.groundShape);
    this.world.addBody(this.groundBody);

    /* ******** ball ******** */
    /** @public */
    this.ballBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 4],
      mass: 1 // Setting mass to 0 makes the body static
    });
    /** @public */
    this.ballShape = new p2.Circle({
      radius: 0.5,
    });
    this.ballBody.addShape(this.ballShape);
    this.world.addBody(this.ballBody);

    /** @public */
    this.ballEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.ballEntity.anchor.x = 0.5;
    this.ballEntity.anchor.y = 0.5;

    /* ******** pole ******** */

    const poleHeight = (4-0.5);
    /** @public */
    this.poleShape = new p2.Box({
      width: 0.2,
      height: poleHeight,
    });
    /** @public */
    this.poleBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5 + poleHeight/2],
      mass: 1 // Setting mass to 0 makes the body static
    });
    this.poleBody.addShape(this.poleShape);
    this.world.addBody(this.poleBody);
    /** @public */
    this.poleEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x527cbf, 1);
      g.drawRect(0,0,0.2 * SCALE,poleHeight * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.poleEntity.anchor.x = 0.5;
    this.poleEntity.anchor.y = 0.5;

    /* ******** wheel ******** */

    /** @public */
    this.wheelBody = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5],
      mass: 1 // Setting mass to 0 makes the body static
    });

    /** @public */
    this.wheelShape = new p2.Circle({
      radius: 0.5,
      material: new p2.Material()
    });
    this.wheelBody.addShape(this.wheelShape);
    this.world.addBody(this.wheelBody);

    /** @public */
    this.wheelEntity = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.wheelEntity.anchor.x = 0.5;
    this.wheelEntity.anchor.y = 0.5;

    /* ** Joints ** */
    this.stage.addChild(this.ballEntity);
    this.stage.addChild(this.wheelEntity);
    this.stage.addChild(this.poleEntity);

    /** @public */
    this.ballJoint = new p2.RevoluteConstraint(this.ballBody, this.poleBody, {
      localPivotA: [0, 0],
      localPivotB: [0, poleHeight/2],
      collideConnected: false
    });
    this.world.addConstraint(this.ballJoint);

    /** @public */
    this.wheelJoint = new p2.RevoluteConstraint(this.wheelBody, this.poleBody, {
      localPivotA: [0, 0],
      localPivotB: [0, -poleHeight/2],
      collideConnected: false,
      maxForce: 40,
    });
    this.world.addConstraint(this.wheelJoint);
    this.wheelJoint.motorEnabled = true;
    this.wheelJoint.motorSpeed = 10;

    /** @public */
    this.frictionContactMaterial = new p2.ContactMaterial(
      this.wheelShape.material,
      this.groundShape.material,
      {
        friction: 100
      }
    );
    this.world.addContactMaterial(this.frictionContactMaterial);

    /** @private */
    this.runner_ = this.run.bind(this);
  }
  /**
   * 
   * @param {number[]} pos 
   */
  worldToScreen(pos) {
    const [posX, posY] = pos;
    return [posX * SCALE, this.renderer.height - (posY * SCALE)];
  }
  run(time) {
    window.requestAnimationFrame(this.runner_);
    // Do Physics
    p2.vec2.add(this.ballBody.force, this.ballBody.force, p2.vec2.fromValues((Math.random()-0.5)*10, (Math.random()-0.5)*10));

    this.wheelJoint.motorSpeed = this.poleBody.angle * 100;

    const deltaTime = this.lastTime ? (time - lastTime) / 1000 : 0;
    this.world.step(1.0/60, deltaTime, 10);

    /** @type {number} posX */
    /** @type {number} posY */
    let posX, posY = 0;
    // Render
    [posX, posY] = this.worldToScreen(this.ballBody.position);
    this.ballEntity.position.x = posX;
    this.ballEntity.position.y = posY;

    [posX, posY] = this.worldToScreen(this.poleBody.position);
    this.poleEntity.position.x = posX;
    this.poleEntity.position.y = posY;
    this.poleEntity.rotation = -this.poleBody.angle;

    [posX, posY] = this.worldToScreen(this.wheelBody.position);
    this.wheelEntity.position.x = posX;
    this.wheelEntity.position.y = posY;

    // render
    this.renderer.render(this.stage);
  }
}