import * as PIXI from 'pixi.js';
import p2 from 'p2';

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
    
    /** @private */
    this.groundBody_ = new p2.Body();
    /** @private */
    this.groundShape_ = new p2.Plane({
      material: new p2.Material()
    });
    this.groundBody_.addShape(this.groundShape_);
    this.world.addBody(this.groundBody_);

    /* ******** ball ******** */
    /** @private */
    this.ballBody_ = new p2.Body({
      position: [this.renderer.width/2/SCALE, 4],
      mass: 1 // Setting mass to 0 makes the body static
    });
    /** @private */
    this.ballShape_ = new p2.Circle({
      radius: 0.5,
    });
    this.ballBody_.addShape(this.ballShape_);
    this.world.addBody(this.ballBody_);

    this.ballEntity_ = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.ballEntity_.anchor.x = 0.5;
    this.ballEntity_.anchor.y = 0.5;

    /* ******** pole ******** */

    /** @private */
    const poleHeight = (4-0.5);
    this.poleShape_ = new p2.Box({
      width: 0.2,
      height: poleHeight,
    });
    /** @private */
    this.poleBody_ = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5 + poleHeight/2],
      mass: 1 // Setting mass to 0 makes the body static
    });
    this.poleBody_.addShape(this.poleShape_);
    this.world.addBody(this.poleBody_);
    this.poleEntity_ = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x527cbf, 1);
      g.drawRect(0,0,0.2 * SCALE,poleHeight * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.poleEntity_.anchor.x = 0.5;
    this.poleEntity_.anchor.y = 0.5;

    /* ******** wheel ******** */

    /** @private */
    this.wheelBody_ = new p2.Body({
      position: [this.renderer.width/2/SCALE, 0.5],
      mass: 1 // Setting mass to 0 makes the body static
    });
    /** @private */
    this.wheelShape_ = new p2.Circle({
      radius: 0.5,
      material: new p2.Material()
    });
    this.wheelBody_.addShape(this.wheelShape_);
    this.world.addBody(this.wheelBody_);
    this.wheelEntity_ = (() => {
      const g = new PIXI.Graphics();
      g.beginFill(0x22222, 1);
      g.drawCircle(0.5 * SCALE, 0.5 * SCALE, 0.5 * SCALE);
      const rt = PIXI.RenderTexture.create(g.width, g.height);
      this.renderer.render(g, rt);
      return new PIXI.Sprite(rt);
    })();
    this.wheelEntity_.anchor.x = 0.5;
    this.wheelEntity_.anchor.y = 0.5;

    /* ** Joints ** */
    this.stage.addChild(this.ballEntity_);
    this.stage.addChild(this.wheelEntity_);
    this.stage.addChild(this.poleEntity_);

    /** @private */
    this.ballJoint_ = new p2.RevoluteConstraint(this.ballBody_, this.poleBody_, {
      localPivotA: [0, 0],
      localPivotB: [0, poleHeight/2],
      collideConnected: false
    });
    this.world.addConstraint(this.ballJoint_);

    /** @private */
    this.wheelJoint_ = new p2.RevoluteConstraint(this.wheelBody_, this.poleBody_, {
      localPivotA: [0, 0],
      localPivotB: [0, -poleHeight/2],
      collideConnected: false,
      maxForce: 40,
    });
    this.world.addConstraint(this.wheelJoint_);
    this.wheelJoint_.motorEnabled = true;
    this.wheelJoint_.motorSpeed = 10;

    /** @private */
    this.frictionContactMaterial_ = new p2.ContactMaterial(
      this.wheelShape_.material,
      this.groundShape_.material,
      {
        friction: 100
      }
    );
    this.world.addContactMaterial(this.frictionContactMaterial_);

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
    p2.vec2.add(this.ballBody_.force, this.ballBody_.force, p2.vec2.fromValues((Math.random()-0.5)*10, (Math.random()-0.5)*10));

    this.wheelJoint_.motorSpeed = this.poleBody_.angle * 100;

    const deltaTime = this.lastTime ? (time - lastTime) / 1000 : 0;
    this.world.step(1.0/60, deltaTime, 10);

    /** @type {number} posX */
    /** @type {number} posY */
    let posX, posY = 0;
    // Render
    [posX, posY] = this.worldToScreen(this.ballBody_.position);
    this.ballEntity_.position.x = posX;
    this.ballEntity_.position.y = posY;

    [posX, posY] = this.worldToScreen(this.poleBody_.position);
    this.poleEntity_.position.x = posX;
    this.poleEntity_.position.y = posY;
    this.poleEntity_.rotation = -this.poleBody_.angle;

    [posX, posY] = this.worldToScreen(this.wheelBody_.position);
    this.wheelEntity_.position.x = posX;
    this.wheelEntity_.position.y = posY;

    // render
    this.renderer.render(this.stage);
  }
}