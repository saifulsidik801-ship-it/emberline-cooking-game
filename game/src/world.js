// EMBERLINE world: the whole game state and its rules. Rendering never mutates this;
// input and the main loop call step() and interact(), and read the state to draw it.
import {
  BURN_AFTER,
  CHEF_RADIUS,
  CHEF_SPEED,
  CHOP_SECONDS,
  FRY_SECONDS,
  GRILL_SECONDS,
  HUD_H,
  INGREDIENTS,
  INTERACT_RANGE,
  MAX_ORDERS,
  ORDER_PATIENCE,
  RECIPES,
  RECIPE_ORDER,
  RECIPE_UNLOCK_AT,
  RUSH_AT,
  RUSH_LENGTH,
  SHIFT_SECONDS,
  SPAWN_EVERY,
  SPAWN_RUSH,
  STATIONS,
  W,
  H,
} from './config.js';
import { mulberry32, pick } from './random.js';
import { setSizzle, sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function plateKey(items) {
  return items
    .map((it) => `${it.ing}:${it.prep}`)
    .sort()
    .join('|');
}

function recipeKey(recipe) {
  return recipe.items.map((it) => `${it.ing}:${it.prep}`).sort().join('|');
}

export function newPlate() {
  return { kind: 'plate', items: [] };
}

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.random = mulberry32(this.seed);
    this.screen = SCREEN_TITLE;
    this.time = 0; // seconds since the shift started
    this.timeLeft = SHIFT_SECONDS;
    this.coins = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.served = 0;
    this.perfect = 0;
    this.lost = 0;
    this.spawnTimer = 3; // first ticket arrives quickly
    this.rush = false;
    this.rushAnnounced = false;
    this.banner = null; // { text, sub, t }
    this.orders = [];
    this.nextOrderId = 1;
    this.chef = {
      x: W / 2,
      y: 470,
      dir: 1,
      moving: false,
      carrying: null, // a plate or a single ingredient
      hand: null, // an ingredient held alongside a plate (the other hand)
      target: null,
      pending: null, // station descriptor to use on arrival
      bob: 0,
    };
    // Cooking slots: { ing, prep, progress, done, burnt } or null.
    this.chop = [null, null];
    this.grill = [null, null];
    this.fryer = [null, null];
    this.plating = [null, null, null]; // plates waiting on the plating counter
    this.particles = [];
    this.floats = []; // { x, y, text, color, t, life }
    this.shake = 0;
    this.paused = false;
    this.best = 0;
    this.lastTickSecond = -1;
  }

  get shiftProgress() {
    return Math.min(1, this.time / SHIFT_SECONDS);
  }

  get rushActive() {
    return this.time >= RUSH_AT && this.time < RUSH_AT + RUSH_LENGTH;
  }

  // ---- orders -------------------------------------------------------------
  availableRecipes() {
    return RECIPE_ORDER.filter((id) => RECIPE_UNLOCK_AT[id] <= this.time);
  }

  spawnOrder(forceRecipe = null) {
    if (this.orders.length >= MAX_ORDERS) return null;
    const pool = this.availableRecipes();
    const id = forceRecipe ?? pick(this.random, pool);
    const order = {
      id: this.nextOrderId,
      recipe: id,
      patience: ORDER_PATIENCE,
      max: ORDER_PATIENCE,
      born: this.time,
    };
    this.nextOrderId += 1;
    this.orders.push(order);
    return order;
  }

  // ---- chef ---------------------------------------------------------------
  nearestStation() {
    const c = this.chef;
    let best = null;
    let bestD = INTERACT_RANGE;
    const consider = (rect, station) => {
      const cx = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
      const cy = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
      const d = Math.hypot(c.x - cx, c.y - cy);
      if (d < bestD) {
        bestD = d;
        best = station;
      }
    };
    STATIONS.pantry.forEach((bin) => consider(bin, { type: 'pantry', ing: bin.ing, rect: bin }));
    consider(STATIONS.serve, { type: 'serve', rect: STATIONS.serve });
    STATIONS.chop.forEach((rect, i) => consider(rect, { type: 'chop', slot: i, rect }));
    consider(STATIONS.grill, { type: 'grill', rect: STATIONS.grill });
    consider(STATIONS.fryer, { type: 'fryer', rect: STATIONS.fryer });
    consider(STATIONS.plates, { type: 'plates', rect: STATIONS.plates });
    consider(STATIONS.plating, { type: 'plating', rect: STATIONS.plating });
    consider(STATIONS.trash, { type: 'trash', rect: STATIONS.trash });
    return best;
  }

  stationAtPoint(x, y) {
    const inside = (rect) => x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    for (const bin of STATIONS.pantry) {
      if (inside(bin)) return { type: 'pantry', ing: bin.ing, rect: bin };
    }
    if (inside(STATIONS.serve)) return { type: 'serve', rect: STATIONS.serve };
    for (let i = 0; i < STATIONS.chop.length; i += 1) {
      if (inside(STATIONS.chop[i])) return { type: 'chop', slot: i, rect: STATIONS.chop[i] };
    }
    if (inside(STATIONS.grill)) return { type: 'grill', rect: STATIONS.grill };
    if (inside(STATIONS.fryer)) return { type: 'fryer', rect: STATIONS.fryer };
    if (inside(STATIONS.plates)) return { type: 'plates', rect: STATIONS.plates };
    if (inside(STATIONS.plating)) return { type: 'plating', rect: STATIONS.plating };
    if (inside(STATIONS.trash)) return { type: 'trash', rect: STATIONS.trash };
    return null;
  }

  approachPoint(rect) {
    // The spot on the floor just below a station, where the chef stands to use it.
    const cx = rect.x + rect.w / 2;
    if (rect.y < 300) return { x: cx, y: rect.y + rect.h + CHEF_RADIUS + 8 };
    return { x: cx, y: rect.y - CHEF_RADIUS - 8 };
  }

  // The ingredient the chef can put down right now: one in hand, or the carried one.
  heldIngredient() {
    const chef = this.chef;
    if (chef.carrying && chef.carrying.kind === 'ing') return { where: 'carrying' };
    if (chef.carrying && chef.carrying.kind === 'plate' && chef.hand) return { where: 'hand' };
    return null;
  }

  clearHeldIngredient() {
    if (this.chef.carrying && this.chef.carrying.kind === 'ing') this.chef.carrying = null;
    else this.chef.hand = null;
  }

  // ---- interactions -------------------------------------------------------
  interact() {
    const station = this.nearestStation();
    if (station) this.useStation(station);
  }

  useStation(station) {
    const chef = this.chef;
    const carrying = chef.carrying;
    switch (station.type) {
      case 'pantry': {
        const needsPrep = INGREDIENTS[station.ing].chop || INGREDIENTS[station.ing].grill || INGREDIENTS[station.ing].fry;
        if (carrying && carrying.kind === 'plate' && !chef.hand) {
          if (!needsPrep && carrying.items.length < 4) {
            // Bun and cheese go straight onto the plate, no prep needed.
            carrying.items.push({ ing: station.ing, prep: 'raw' });
            sfx.place();
          } else if (needsPrep) {
            // The other hand fetches it raw; it still needs chopping, grilling or frying.
            chef.hand = { kind: 'ing', ing: station.ing, prep: 'raw' };
            sfx.pickup();
          }
        } else if (!carrying) {
          chef.carrying = { kind: 'ing', ing: station.ing, prep: 'raw' };
          sfx.pickup();
          this.burst(station.rect.x + station.rect.w / 2, station.rect.y + station.rect.h, INGREDIENTS[station.ing].color, 6);
        }
        break;
      }
      case 'chop': {
        const slot = this.chop[station.slot];
        const held = this.heldIngredient();
        const heldIng = held ? (held.where === 'carrying' ? chef.carrying : chef.hand) : null;
        if (!slot && heldIng && INGREDIENTS[heldIng.ing].chop && heldIng.prep === 'raw') {
          this.chop[station.slot] = { ing: heldIng.ing, progress: 0, done: false, burnt: false };
          this.clearHeldIngredient();
          sfx.place();
        } else if (slot && slot.done && carrying && carrying.kind === 'plate' && carrying.items.length < 4) {
          // Prepped food goes straight onto the plate in hand.
          carrying.items.push({ ing: slot.ing, prep: 'chopped' });
          this.chop[station.slot] = null;
          sfx.place();
        } else if (slot && slot.done && carrying && carrying.kind === 'plate' && !chef.hand) {
          chef.hand = { kind: 'ing', ing: slot.ing, prep: 'chopped' };
          this.chop[station.slot] = null;
          sfx.place();
        } else if (slot && slot.done && !carrying) {
          chef.carrying = { kind: 'ing', ing: slot.ing, prep: 'chopped' };
          this.chop[station.slot] = null;
          sfx.pickup();
        }
        break;
      }
      case 'grill': {
        const idx = this.grill.findIndex((s) => s === null);
        const doneIdx = this.grill.findIndex((s) => s && s.done);
        const held = this.heldIngredient();
        const heldIng = held ? (held.where === 'carrying' ? chef.carrying : chef.hand) : null;
        if (heldIng && INGREDIENTS[heldIng.ing].grill && heldIng.prep === 'raw' && idx !== -1) {
          this.grill[idx] = { ing: heldIng.ing, progress: 0, done: false, burnt: false };
          this.clearHeldIngredient();
          sfx.place();
        } else if (doneIdx !== -1 && carrying && carrying.kind === 'plate' && carrying.items.length < 4) {
          const slot = this.grill[doneIdx];
          carrying.items.push({ ing: slot.ing, prep: slot.burnt ? 'burnt' : 'grilled' });
          this.grill[doneIdx] = null;
          sfx.place();
        } else if (doneIdx !== -1 && carrying && carrying.kind === 'plate' && !chef.hand) {
          const slot = this.grill[doneIdx];
          chef.hand = { kind: 'ing', ing: slot.ing, prep: slot.burnt ? 'burnt' : 'grilled' };
          this.grill[doneIdx] = null;
          sfx.place();
        } else if (!carrying && doneIdx !== -1) {
          const slot = this.grill[doneIdx];
          chef.carrying = { kind: 'ing', ing: slot.ing, prep: slot.burnt ? 'burnt' : 'grilled' };
          this.grill[doneIdx] = null;
          sfx.pickup();
        }
        break;
      }
      case 'fryer': {
        const idx = this.fryer.findIndex((s) => s === null);
        const doneIdx = this.fryer.findIndex((s) => s && s.done);
        const held = this.heldIngredient();
        const heldIng = held ? (held.where === 'carrying' ? chef.carrying : chef.hand) : null;
        if (heldIng && INGREDIENTS[heldIng.ing].fry && heldIng.prep === 'raw' && idx !== -1) {
          this.fryer[idx] = { ing: heldIng.ing, progress: 0, done: false, burnt: false };
          this.clearHeldIngredient();
          sfx.place();
        } else if (doneIdx !== -1 && carrying && carrying.kind === 'plate' && carrying.items.length < 4) {
          const slot = this.fryer[doneIdx];
          carrying.items.push({ ing: slot.ing, prep: slot.burnt ? 'burnt' : 'fried' });
          this.fryer[doneIdx] = null;
          sfx.place();
        } else if (doneIdx !== -1 && carrying && carrying.kind === 'plate' && !chef.hand) {
          const slot = this.fryer[doneIdx];
          chef.hand = { kind: 'ing', ing: slot.ing, prep: slot.burnt ? 'burnt' : 'fried' };
          this.fryer[doneIdx] = null;
          sfx.place();
        } else if (!carrying && doneIdx !== -1) {
          const slot = this.fryer[doneIdx];
          chef.carrying = { kind: 'ing', ing: slot.ing, prep: slot.burnt ? 'burnt' : 'fried' };
          this.fryer[doneIdx] = null;
          sfx.pickup();
        }
        break;
      }
      case 'plates': {
        if (!carrying) {
          chef.carrying = newPlate();
          sfx.pickup();
        }
        break;
      }
      case 'plating': {
        const idx = this.plating.findIndex((p) => p !== null);
        const empty = this.plating.findIndex((p) => p === null);
        const held = this.heldIngredient();
        const heldIng = held ? (held.where === 'carrying' ? chef.carrying : chef.hand) : null;
        if (heldIng && heldIng.prep !== 'burnt' && idx !== -1) {
          const plate = this.plating[idx];
          if (plate.items.length < 4) {
            plate.items.push({ ing: heldIng.ing, prep: heldIng.prep });
            this.clearHeldIngredient();
            sfx.place();
          }
        } else if (carrying && carrying.kind === 'plate' && empty !== -1) {
          this.plating[empty] = carrying;
          chef.carrying = null;
          sfx.place();
        } else if (!carrying && idx !== -1) {
          chef.carrying = this.plating[idx];
          this.plating[idx] = null;
          sfx.pickup();
        }
        break;
      }
      case 'serve': {
        if (carrying && carrying.kind === 'plate') {
          const key = plateKey(carrying.items);
          const order = this.orders.find((o) => recipeKey(RECIPES[o.recipe]) === key);
          if (order) this.serveOrder(order);
          else {
            sfx.deny();
            this.float(chef.x, chef.y - 44, 'No order needs this!', '#ff9a8a');
            this.shake = 0.25;
          }
        }
        break;
      }
      case 'trash': {
        if (chef.hand) {
          chef.hand = null;
          sfx.trash();
          this.burst(station.rect.x + station.rect.w / 2, station.rect.y + 10, '#8a8a8a', 8);
        } else if (carrying) {
          chef.carrying = null;
          sfx.trash();
          this.burst(station.rect.x + station.rect.w / 2, station.rect.y + 10, '#8a8a8a', 8);
        }
        break;
      }
      default:
        break;
    }
  }

  serveOrder(order) {
    const recipe = RECIPES[order.recipe];
    const patienceFrac = Math.max(0, order.patience / order.max);
    const tip = Math.round(recipe.price * 0.5 * patienceFrac);
    const streakBonus = Math.min(this.streak, 10);
    const earned = recipe.price + tip + streakBonus;
    this.coins += earned;
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.served += 1;
    if (patienceFrac > 0.6) this.perfect += 1;
    this.orders = this.orders.filter((o) => o !== order);
    this.chef.carrying = null;
    const cx = STATIONS.serve.x + STATIONS.serve.w / 2;
    this.float(cx, STATIONS.serve.y + 96, `+$${earned}`, '#ffd76a');
    if (patienceFrac > 0.6) this.float(cx, STATIONS.serve.y + 122, 'PERFECT!', '#8be28b');
    else if (this.streak >= 3) this.float(cx, STATIONS.serve.y + 122, `${this.streak} IN A ROW!`, '#ffb347');
    this.burst(cx, STATIONS.serve.y + 60, '#ffd76a', 14);
    sfx.serve();
    sfx.coin();
  }

  // ---- effects ------------------------------------------------------------
  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      const a = this.random() * Math.PI * 2;
      const speed = 30 + this.random() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 30,
        t: 0,
        life: 0.5 + this.random() * 0.4,
        color,
        size: 2 + this.random() * 3,
        kind: 'dot',
      });
    }
  }

  steam(x, y) {
    this.particles.push({
      x: x + (this.random() - 0.5) * 20,
      y,
      vx: (this.random() - 0.5) * 8,
      vy: -26 - this.random() * 14,
      t: 0,
      life: 0.9 + this.random() * 0.5,
      color: '#ffffff',
      size: 5 + this.random() * 5,
      kind: 'steam',
    });
  }

  float(x, y, text, color) {
    this.floats.push({ x, y, text, color, t: 0, life: 1.4 });
  }

  // ---- simulation ---------------------------------------------------------
  step(dt, input) {
    if (this.screen !== SCREEN_PLAY || this.paused) {
      this.updateFx(dt);
      return;
    }
    this.time += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.time);

    // Rush hour.
    if (this.rushActive && !this.rush) {
      this.rush = true;
      if (!this.rushAnnounced) {
        this.rushAnnounced = true;
        this.banner = { text: 'RUSH HOUR!', sub: 'Tickets are flying in — keep the line moving', t: 0 };
        sfx.rush();
      }
    } else if (!this.rushActive) {
      this.rush = false;
    }
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t > 2.6) this.banner = null;
    }

    // Orders.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnOrder();
      this.spawnTimer = this.rushActive ? SPAWN_RUSH : SPAWN_EVERY;
    }
    for (const order of this.orders) order.patience -= dt;
    const expired = this.orders.filter((o) => o.patience <= 0);
    if (expired.length > 0) {
      this.orders = this.orders.filter((o) => o.patience > 0);
      this.lost += expired.length;
      this.streak = 0;
      this.float(W / 2, 200, 'A customer walked out…', '#ff9a8a');
      sfx.deny();
    }

    // Cooking slots.
    this.stepSlot(this.chop, CHOP_SECONDS, dt, 'chop');
    this.stepSlot(this.grill, GRILL_SECONDS, dt, 'grill');
    this.stepSlot(this.fryer, FRY_SECONDS, dt, 'fryer');

    // Sizzle + steam while anything cooks.
    const cooking =
      this.grill.some((s) => s && !s.done) || this.fryer.some((s) => s && !s.done);
    setSizzle(cooking);
    if (cooking && this.random() < dt * 6) {
      const hot = this.grill.find((s) => s && !s.done) ?? this.fryer.find((s) => s && !s.done);
      const rect = hot === this.grill.find((s) => s && !s.done) ? STATIONS.grill : STATIONS.fryer;
      this.steam(rect.x + rect.w / 2 + (this.random() - 0.5) * 60, rect.y + 8);
    }

    // Chef movement.
    const chef = this.chef;
    let mx = 0;
    let my = 0;
    if (input) {
      const axis = input.axis();
      mx = axis.x;
      my = axis.y;
      if (mx !== 0 || my !== 0) {
        chef.target = null;
        chef.pending = null;
      }
    }
    if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        chef.target = null;
        if (chef.pending) {
          const station = chef.pending;
          chef.pending = null;
          this.useStation(station);
        }
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my) || 1;
      chef.x += (mx / len) * CHEF_SPEED * dt;
      chef.y += (my / len) * CHEF_SPEED * dt;
      chef.dir = mx < 0 ? -1 : mx > 0 ? 1 : chef.dir;
      chef.moving = true;
      chef.bob += dt * 12;
    } else {
      chef.moving = false;
    }
    this.collideChef();

    // End of shift.
    const second = Math.floor(this.time);
    if (second !== this.lastTickSecond) {
      this.lastTickSecond = second;
      if (this.timeLeft <= 10 && this.timeLeft > 0) sfx.tick();
    }
    if (this.timeLeft <= 0) {
      this.screen = SCREEN_OVER;
      setSizzle(false);
      this.best = Math.max(this.best, this.coins);
    }
    this.updateFx(dt);
  }

  stepSlot(slots, cookSeconds, dt, kind) {
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i];
      if (!slot || slot.done) {
        if (slot && slot.done && !slot.burnt) {
          slot.over = (slot.over ?? 0) + dt;
          if (slot.over > BURN_AFTER) {
            slot.burnt = true;
            const rect = kind === 'chop' ? STATIONS.chop[i] : kind === 'grill' ? STATIONS.grill : STATIONS.fryer;
            this.float(rect.x + rect.w / 2, rect.y - 8, 'BURNT!', '#ff7a5a');
            sfx.burn();
          }
        }
        continue;
      }
      slot.progress += dt;
      if (slot.progress >= cookSeconds) {
        slot.done = true;
        slot.over = 0;
        sfx.done();
      }
    }
  }

  collideChef() {
    const c = this.chef;
    const minX = 24 + CHEF_RADIUS;
    const maxX = W - 24 - CHEF_RADIUS;
    const minY = HUD_H + 8 + CHEF_RADIUS;
    const maxY = H - 16 - CHEF_RADIUS;
    c.x = Math.max(minX, Math.min(maxX, c.x));
    c.y = Math.max(minY, Math.min(maxY, c.y));
    const solids = [
      ...STATIONS.pantry,
      STATIONS.serve,
      ...STATIONS.chop,
      STATIONS.grill,
      STATIONS.fryer,
      STATIONS.plates,
      STATIONS.plating,
      STATIONS.trash,
      STATIONS.sink,
    ];
    for (const rect of solids) {
      const nx = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
      const ny = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
      const dx = c.x - nx;
      const dy = c.y - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < CHEF_RADIUS * CHEF_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2);
        c.x = nx + (dx / d) * CHEF_RADIUS;
        c.y = ny + (dy / d) * CHEF_RADIUS;
      } else if (d2 <= 0.01) {
        c.y = rect.y + rect.h + CHEF_RADIUS;
      }
    }
  }

  updateFx(dt) {
    for (const p of this.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 12 * dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const f of this.floats) {
      f.t += dt;
      f.y -= 34 * dt;
    }
    this.floats = this.floats.filter((f) => f.t < f.life);
    if (this.shake > 0) this.shake -= dt;
  }

  startShift() {
    this.reset();
    this.screen = SCREEN_PLAY;
    this.spawnOrder('salad');
    this.spawnOrder('burger');
    this.banner = { text: 'SHIFT START!', sub: 'Read the tickets — serve every table before patience runs out', t: 0 };
  }
}
