import World from './World';

function main(){
  console.log("hello world!");
  const world = new World();
  world.start(document.getElementById('game')!);
}

main();
