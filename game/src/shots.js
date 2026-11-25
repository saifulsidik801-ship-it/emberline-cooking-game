// Staged screenshot scenes. Each one builds a real game state through the world's
// own objects — orders, cooking slots, plates, the chef's hands — then steps the
// simulation a few frames so flames, steam and timers settle. Same seed, same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { STATIONS } from './config.js';

function setSlot(slots, index, ing, progress, done, burnt = false) {
  slots[index] = { ing, progress, done, burnt, over: burnt ? 8 : 0 };
}

function orderWith(world, recipe, patience) {
  const order = world.spawnOrder(recipe);
  if (order) {
    order.patience = patience;
    order.max = 48;
  }
  return order;
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'serve') {
    world.screen = SCREEN_PLAY;
    world.time = 74;
    world.timeLeft = 76;
    world.coins = 96;
    world.streak = 4;
    world.bestStreak = 4;
    world.served = 7;
    world.perfect = 3;
    orderWith(world, 'burger', 30);
    orderWith(world, 'flatbread', 18);
    orderWith(world, 'fries', 40);
    world.chef.x = STATIONS.serve.x + 40;
    world.chef.y = STATIONS.serve.y + 150;
    world.chef.carrying = {
      kind: 'plate',
      items: [
        { ing: 'bun', prep: 'raw' },
        { ing: 'patty', prep: 'grilled' },
        { ing: 'cheese', prep: 'raw' },
        { ing: 'lettuce', prep: 'chopped' },
      ],
    };
    setSlot(world.grill, 0, 'mushroom', 4, true);
    setSlot(world.fryer, 0, 'potato', 3, true);
    world.float(1046, 230, '+$14', '#ffd76a');
    world.float(1046, 256, 'PERFECT!', '#8be28b');
    world.burst(1046, 190, '#ffd76a', 16);
    world.steam(1090, 210);
    world.steam(1140, 320);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    world.screen = SCREEN_OVER;
    world.time = 150;
    world.timeLeft = 0;
    world.coins = 132;
    world.served = 12;
    world.perfect = 5;
    world.bestStreak = 6;
    world.lost = 1;
    world.best = 132;
    return { screen: SCREEN_OVER };
  }
  if (name === 'start') {
    world.screen = SCREEN_TITLE;
    world.time = 12;
    world.coins = 0;
    orderWith(world, 'salad', 38);
    orderWith(world, 'burger', 30);
    setSlot(world.grill, 0, 'patty', 2.2, false);
    setSlot(world.chop, 0, 'tomato', 1.2, false);
    world.chef.x = 640;
    world.chef.y = 470;
    return { screen: SCREEN_TITLE };
  }
  // 'play' (the cover): a kitchen mid-rush — every required element in one frame.
  world.screen = SCREEN_PLAY;
  world.time = 78;
  world.timeLeft = 72;
  world.coins = 84;
  world.streak = 3;
  world.bestStreak = 3;
  world.served = 6;
  world.perfect = 2;
  orderWith(world, 'burger', 26);
  orderWith(world, 'salad', 14);
  orderWith(world, 'fries', 38);
  orderWith(world, 'platter', 8);
  // Dish mid-assembly in the chef's hands: burger missing its lettuce.
  world.chef.x = 640;
  world.chef.y = 500;
  world.chef.carrying = {
    kind: 'plate',
    items: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'patty', prep: 'grilled' },
      { ing: 'cheese', prep: 'raw' },
    ],
  };
  // Grill: patty mid-cook with flames; fryer: fries mid-fry.
  setSlot(world.grill, 0, 'patty', 2.6, false);
  setSlot(world.grill, 1, 'mushroom', 4, true);
  setSlot(world.fryer, 0, 'potato', 1.8, false);
  // Chopping board: tomato half-chopped; plating counter: a finished salad ready to serve.
  setSlot(world.chop, 0, 'tomato', 1.4, false);
  setSlot(world.chop, 1, 'lettuce', 2, true);
  world.plating[0] = {
    kind: 'plate',
    items: [
      { ing: 'lettuce', prep: 'chopped' },
      { ing: 'tomato', prep: 'chopped' },
    ],
  };
  world.plating[2] = {
    kind: 'plate',
    items: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'mushroom', prep: 'grilled' },
      { ing: 'cheese', prep: 'raw' },
    ],
  };
  world.steam(1090, 210);
  world.steam(1140, 320);
  return { screen: SCREEN_PLAY };
}
