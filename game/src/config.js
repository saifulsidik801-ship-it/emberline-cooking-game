// EMBERLINE — Wood-Fired Kitchen Rush: tuning, palette, recipes and the kitchen layout.
// One file, one job: every number the rest of the game reads lives here.

export const W = 1280;
export const H = 720;
export const HUD_H = 92;
export const STEP = 1 / 60;

export const SHIFT_SECONDS = 150;
export const RUSH_AT = 60; // seconds elapsed when rush hour starts
export const RUSH_LENGTH = 30;
export const SPAWN_EVERY = 8; // seconds between new orders, calm
export const SPAWN_RUSH = 4.5; // seconds between new orders, rush
export const MAX_ORDERS = 4;
export const ORDER_PATIENCE = 48; // seconds before a ticket walks out
export const CHOP_SECONDS = 2;
export const GRILL_SECONDS = 4;
export const FRY_SECONDS = 3;
export const BURN_AFTER = 7; // seconds past done before food burns
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 17;
export const INTERACT_RANGE = 78;

export const PALETTE = {
  floorA: '#c98d5f',
  floorB: '#bd7f52',
  floorLine: '#a96f45',
  wall: '#234434',
  wallTrim: '#f2c14e',
  counterWood: '#7a4a2b',
  counterTop: '#a9713f',
  counterEdge: '#5d3419',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  brass: '#e8b64c',
  cream: '#fff6e3',
  paper: '#fdf3d8',
  ink: '#2b1d12',
  ember: '#ff7a2f',
  flame: '#ffb347',
  red: '#d94f3d',
  green: '#4da34d',
  gold: '#f2c14e',
};

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e2483a', chop: true },
  lettuce: { name: 'Lettuce', color: '#58b368', chop: true },
  cheese: { name: 'Cheese', color: '#f6c945' },
  patty: { name: 'Patty', color: '#8a5a33', grill: true },
  bun: { name: 'Bun', color: '#e8b06a' },
  potato: { name: 'Potato', color: '#e8d27a', fry: true },
  mushroom: { name: 'Mushroom', color: '#c9a98c', grill: true },
  dough: { name: 'Dough', color: '#f2e3c2', grill: true },
};

// A recipe item is { ing, prep }: prep is raw | chopped | grilled | fried.
export const RECIPES = {
  salad: {
    name: 'Garden Salad',
    price: 6,
    items: [
      { ing: 'lettuce', prep: 'chopped' },
      { ing: 'tomato', prep: 'chopped' },
    ],
  },
  burger: {
    name: 'Ember Burger',
    price: 12,
    items: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'patty', prep: 'grilled' },
      { ing: 'cheese', prep: 'raw' },
      { ing: 'lettuce', prep: 'chopped' },
    ],
  },
  fries: {
    name: 'Golden Fries',
    price: 5,
    items: [{ ing: 'potato', prep: 'fried' }],
  },
  flatbread: {
    name: 'Margherita Flatbread',
    price: 10,
    items: [
      { ing: 'dough', prep: 'grilled' },
      { ing: 'tomato', prep: 'chopped' },
      { ing: 'cheese', prep: 'raw' },
    ],
  },
  melt: {
    name: 'Shroom Melt',
    price: 9,
    items: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'mushroom', prep: 'grilled' },
      { ing: 'cheese', prep: 'raw' },
    ],
  },
  platter: {
    name: 'Ember Platter',
    price: 16,
    items: [
      { ing: 'bun', prep: 'raw' },
      { ing: 'patty', prep: 'grilled' },
      { ing: 'cheese', prep: 'raw' },
      { ing: 'potato', prep: 'fried' },
    ],
  },
};

export const RECIPE_ORDER = ['salad', 'burger', 'fries', 'flatbread', 'melt', 'platter'];
// Early shift leans on easy dishes; the platter only appears once the kitchen is warm.
export const RECIPE_UNLOCK_AT = { salad: 0, burger: 0, fries: 0, flatbread: 25, melt: 45, platter: 70 };

// Stations live around the edges; the middle of the floor stays open for the chef.
export const STATIONS = {
  pantry: [
    { ing: 'tomato', x: 48, y: 104, w: 88, h: 62 },
    { ing: 'lettuce', x: 146, y: 104, w: 88, h: 62 },
    { ing: 'cheese', x: 244, y: 104, w: 88, h: 62 },
    { ing: 'patty', x: 342, y: 104, w: 88, h: 62 },
    { ing: 'bun', x: 440, y: 104, w: 88, h: 62 },
    { ing: 'potato', x: 538, y: 104, w: 88, h: 62 },
    { ing: 'mushroom', x: 636, y: 104, w: 88, h: 62 },
    { ing: 'dough', x: 734, y: 104, w: 88, h: 62 },
  ],
  serve: { x: 860, y: 100, w: 372, h: 76 },
  chop: [
    { x: 48, y: 200, w: 190, h: 84 },
    { x: 48, y: 296, w: 190, h: 84 },
  ],
  grill: { x: 1042, y: 200, w: 190, h: 100 },
  fryer: { x: 1042, y: 312, w: 190, h: 100 },
  plates: { x: 48, y: 560, w: 132, h: 80 },
  plating: { x: 300, y: 560, w: 680, h: 100 },
  trash: { x: 1000, y: 560, w: 130, h: 80 },
  sink: { x: 1140, y: 560, w: 92, h: 80 },
};

export function stationCenter(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

// Stars for the shift report, by coins earned.
export function starsForCoins(coins) {
  if (coins >= 160) return 3;
  if (coins >= 110) return 2;
  if (coins >= 60) return 1;
  return 0;
}
