import World from './World.js';

function main(){
  console.log("hello world!");
  const world = new World();
  world.start(document.getElementById('game'));
}

main();