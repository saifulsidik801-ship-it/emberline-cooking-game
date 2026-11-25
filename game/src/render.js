// EMBERLINE renderer: every pixel of the kitchen, drawn on one canvas.
// No images, no fonts from the network — all vector art, so the game runs offline.
import {
  H,
  HUD_H,
  INGREDIENTS,
  PALETTE,
  RECIPES,
  STATIONS,
  W,
  starsForCoins,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const TAU = Math.PI * 2;

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align = 'left', baseline = 'alphabetic') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

function shadow(ctx, x, y, rx, ry, alpha = 0.18) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

// ---- food ---------------------------------------------------------------

export function drawIngredient(ctx, ing, prep, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 32; // unit scale
  if (prep === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, 13 * u, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(-4 * u, -3 * u, 6 * u, 0, TAU);
    ctx.arc(5 * u, 2 * u, 5 * u, 0, TAU);
    ctx.fill();
    ctx.restore();
    return;
  }
  switch (ing) {
    case 'tomato': {
      if (prep === 'chopped') {
        ctx.fillStyle = '#e2483a';
        for (let i = -1; i <= 1; i += 1) {
          ctx.save();
          ctx.rotate(i * 0.5);
          ctx.beginPath();
          ctx.ellipse(i * 8 * u, 2 * u, 7 * u, 5 * u, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#c93327';
        ctx.beginPath();
        ctx.arc(-8 * u, 0, 2 * u, 0, TAU);
        ctx.arc(8 * u, 4 * u, 2 * u, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = '#e2483a';
        ctx.beginPath();
        ctx.arc(0, 1 * u, 13 * u, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#c93327';
        ctx.beginPath();
        ctx.arc(-4 * u, -4 * u, 4 * u, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3f8f4f';
        ctx.beginPath();
        ctx.moveTo(0, -10 * u);
        ctx.lineTo(-6 * u, -16 * u);
        ctx.lineTo(0, -13 * u);
        ctx.lineTo(6 * u, -16 * u);
        ctx.lineTo(0, -10 * u);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = prep === 'chopped' ? '#6cc47a' : '#58b368';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * TAU;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * 7 * u, Math.sin(a) * 6 * u, 7 * u, 5 * u, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#7ed18c';
      ctx.beginPath();
      ctx.arc(0, 0, 5 * u, 0, TAU);
      ctx.fill();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f6c945';
      ctx.beginPath();
      ctx.moveTo(-13 * u, 8 * u);
      ctx.lineTo(13 * u, 8 * u);
      ctx.lineTo(2 * u, -10 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d9a92e';
      ctx.beginPath();
      ctx.arc(-4 * u, 2 * u, 2 * u, 0, TAU);
      ctx.arc(5 * u, 4 * u, 1.6 * u, 0, TAU);
      ctx.fill();
      break;
    }
    case 'patty': {
      ctx.fillStyle = prep === 'grilled' ? '#5d3a1e' : '#a06a42';
      rr(ctx, -14 * u, -8 * u, 28 * u, 16 * u, 7 * u);
      ctx.fill();
      if (prep === 'grilled') {
        ctx.strokeStyle = '#3a2410';
        ctx.lineWidth = 2 * u;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(-10 * u + i * 8 * u, -7 * u);
          ctx.lineTo(-6 * u + i * 8 * u, 7 * u);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = '#c98d63';
        ctx.beginPath();
        ctx.arc(-5 * u, -2 * u, 3 * u, 0, TAU);
        ctx.arc(6 * u, 3 * u, 2.4 * u, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'bun': {
      ctx.fillStyle = '#e8b06a';
      ctx.beginPath();
      ctx.arc(0, 2 * u, 13 * u, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c98d4e';
      rr(ctx, -13 * u, 2 * u, 26 * u, 5 * u, 2 * u);
      ctx.fill();
      ctx.fillStyle = '#fff2cf';
      for (const [sx, sy] of [[-6, -6], [0, -9], [6, -6], [-2, -3], [4, -2]]) {
        ctx.beginPath();
        ctx.ellipse(sx * u, sy * u, 1.6 * u, 1 * u, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'potato': {
      if (prep === 'fried') {
        ctx.fillStyle = '#f2b93c';
        for (let i = -1; i <= 1; i += 1) {
          ctx.save();
          ctx.translate(i * 7 * u, 0);
          ctx.rotate(i * 0.22);
          rr(ctx, -3 * u, -12 * u, 6 * u, 24 * u, 2 * u);
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = '#d99a26';
        rr(ctx, -3 * u, 6 * u, 6 * u, 4 * u, 2 * u);
        ctx.fill();
      } else {
        ctx.fillStyle = '#e8d27a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 13 * u, 10 * u, 0.3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#c9a94e';
        ctx.beginPath();
        ctx.arc(-4 * u, -2 * u, 1.8 * u, 0, TAU);
        ctx.arc(5 * u, 3 * u, 1.8 * u, 0, TAU);
        ctx.arc(1 * u, -5 * u, 1.5 * u, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'mushroom': {
      ctx.fillStyle = prep === 'grilled' ? '#8a6a4a' : '#c9a98c';
      rr(ctx, -4 * u, -2 * u, 8 * u, 14 * u, 3 * u);
      ctx.fill();
      ctx.fillStyle = prep === 'grilled' ? '#6b4a2e' : '#a5764f';
      ctx.beginPath();
      ctx.arc(0, -3 * u, 12 * u, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2e3d0';
      ctx.beginPath();
      ctx.arc(-5 * u, -8 * u, 2 * u, 0, TAU);
      ctx.arc(4 * u, -10 * u, 2 * u, 0, TAU);
      ctx.fill();
      break;
    }
    case 'dough': {
      ctx.fillStyle = prep === 'grilled' ? '#e8b96a' : '#f2e3c2';
      ctx.beginPath();
      ctx.arc(0, 0, 13 * u, 0, TAU);
      ctx.fill();
      if (prep === 'grilled') {
        ctx.fillStyle = '#b97e35';
        for (const [sx, sy] of [[-6, -4], [5, -6], [0, 5], [7, 4], [-7, 6]]) {
          ctx.beginPath();
          ctx.arc(sx * u, sy * u, 2 * u, 0, TAU);
          ctx.fill();
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

export function drawPlate(ctx, items, x, y, s, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e8e4da';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.62, s * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -2, s * 0.52, s * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#c9c2b2';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -2, s * 0.52, s * 0.34, 0, 0, TAU);
  ctx.stroke();
  const n = items.length;
  items.forEach((it, i) => {
    const a = n === 1 ? -Math.PI / 2 : -Math.PI / 2 + (i - (n - 1) / 2) * 0.85;
    const px = Math.cos(a) * s * 0.26;
    const py = -2 + Math.sin(a) * s * 0.16 - (n > 2 ? 2 : 0);
    drawIngredient(ctx, it.ing, it.prep, px, py, s * 0.62);
  });
  void t;
  ctx.restore();
}

// ---- stations -------------------------------------------------------------

function stationLabel(ctx, str, x, y) {
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillStyle = '#2b1d12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function woodCounter(ctx, rect, top = PALETTE.counterTop) {
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = PALETTE.counterWood;
  ctx.fill();
  rr(ctx, rect.x + 3, rect.y + 3, rect.w - 6, 16, 5);
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = PALETTE.counterEdge;
  ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.stroke();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * TAU);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(x, y, r - 5, 0, TAU);
  ctx.fill();
}

function drawFlames(ctx, x, y, w, t, seed = 0) {
  for (let i = 0; i < 5; i += 1) {
    const fx = x + ((i + 0.5) / 5) * w;
    const flick = Math.sin(t * 9 + i * 2.1 + seed) * 3;
    const h = 14 + Math.sin(t * 7 + i * 1.7 + seed) * 4;
    ctx.fillStyle = i % 2 === 0 ? PALETTE.flame : PALETTE.ember;
    ctx.beginPath();
    ctx.moveTo(fx - 7, y);
    ctx.quadraticCurveTo(fx - 5, y - h - flick, fx, y - h - 6 - flick);
    ctx.quadraticCurveTo(fx + 5, y - h - flick, fx + 7, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawKitchen(ctx, world, t) {
  // Floor: warm checker tiles.
  const tile = 64;
  for (let ty = 0; ty < Math.ceil((H - HUD_H) / tile); ty += 1) {
    for (let tx = 0; tx < Math.ceil(W / tile); tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, HUD_H + ty * tile, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  for (let ty = 0; ty <= Math.ceil((H - HUD_H) / tile); ty += 1) {
    ctx.beginPath();
    ctx.moveTo(0, HUD_H + ty * tile);
    ctx.lineTo(W, HUD_H + ty * tile);
    ctx.stroke();
  }
  for (let tx = 0; tx <= Math.ceil(W / tile); tx += 1) {
    ctx.beginPath();
    ctx.moveTo(tx * tile, HUD_H);
    ctx.lineTo(tx * tile, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Centre rug.
  ctx.fillStyle = '#8a3b2e';
  ctx.beginPath();
  ctx.ellipse(640, 430, 185, 80, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a34a35';
  ctx.beginPath();
  ctx.ellipse(640, 430, 160, 66, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 430, 148, 58, 0, 0, TAU);
  ctx.stroke();

  // Chalk menu board, right wall.
  ctx.save();
  rr(ctx, 1042, 424, 190, 116, 8);
  ctx.fillStyle = '#2b3a32';
  ctx.fill();
  ctx.strokeStyle = '#c9a15a';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, "TODAY'S MENU", 1137, 448, '700 13px Georgia, serif', '#fdf3d8', 'center');
  ctx.strokeStyle = '#fdf3d8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1058, 458);
  ctx.lineTo(1216, 458);
  ctx.stroke();
  const menu = ['Salad $6', 'Burger $12', 'Fries $5', 'Flatbread $10', 'Melt $9', 'Platter $16'];
  menu.forEach((line, i) => {
    text(ctx, line, 1058, 476 + i * 11, '11px system-ui, sans-serif', '#e8dcc0');
  });
  ctx.restore();

  // Potted herb plant, bottom left.
  ctx.fillStyle = '#b4552d';
  rr(ctx, 196, 596, 56, 40, 6);
  ctx.fill();
  ctx.fillStyle = '#4da34d';
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i - 2) * 0.4;
    ctx.beginPath();
    ctx.ellipse(224 + Math.cos(a) * 16, 592 + Math.sin(a) * 16, 12, 7, a, 0, TAU);
    ctx.fill();
  }

  // Pantry bins.
  for (const bin of STATIONS.pantry) {
    const ing = INGREDIENTS[bin.ing];
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 7);
    ctx.fillStyle = '#8a5a33';
    ctx.fill();
    rr(ctx, bin.x + 4, bin.y + 4, bin.w - 8, bin.h - 8, 5);
    ctx.fillStyle = '#fff6e3';
    ctx.fill();
    drawIngredient(ctx, bin.ing, 'raw', bin.x + bin.w / 2, bin.y + 24, 30);
    stationLabel(ctx, ing.name.toUpperCase(), bin.x + bin.w / 2, bin.y + bin.h - 11);
  }

  // Serve window.
  const sv = STATIONS.serve;
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 8);
  ctx.fillStyle = '#3a2415';
  ctx.fill();
  rr(ctx, sv.x + 6, sv.y + 6, sv.w - 12, sv.h - 22, 5);
  const glow = ctx.createLinearGradient(sv.x, sv.y, sv.x, sv.y + sv.h);
  glow.addColorStop(0, '#ffdf9e');
  glow.addColorStop(1, '#e8a04c');
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(sv.x + 6, sv.y + 6, sv.w - 12, 10);
  text(ctx, 'SERVE  •  RING THE BELL', sv.x + sv.w / 2, sv.y + 26, '700 12px system-ui, sans-serif', '#5d3419', 'center');
  // Bell.
  ctx.fillStyle = PALETTE.brass;
  ctx.beginPath();
  ctx.arc(sv.x + sv.w - 34, sv.y + 44, 13, Math.PI, 0);
  ctx.fill();
  rr(ctx, sv.x + sv.w - 48, sv.y + 42, 28, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#8a6a1e';
  ctx.beginPath();
  ctx.arc(sv.x + sv.w - 34, sv.y + 50, 3, 0, TAU);
  ctx.fill();
  // Heat lamps.
  ctx.fillStyle = '#ff8a5a';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(sv.x + 30 + i * 26, sv.y + 44, 6, 0, TAU);
    ctx.fill();
  }

  // Chop boards.
  STATIONS.chop.forEach((rect, i) => {
    woodCounter(ctx, rect, '#c98d5f');
    rr(ctx, rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 34, 6);
    ctx.fillStyle = '#e8c89a';
    ctx.fill();
    ctx.strokeStyle = '#b98d5f';
    ctx.lineWidth = 2;
    ctx.stroke();
    const slot = world.chop[i];
    if (slot) {
      drawIngredient(ctx, slot.ing, slot.done ? 'chopped' : 'raw', rect.x + rect.w / 2 - 18, rect.y + rect.h / 2 - 4, 34);
      if (!slot.done) {
        // Small progress bar under the item.
        const frac = Math.min(1, slot.progress / 2);
        rr(ctx, rect.x + rect.w - 58, rect.y + rect.h / 2 + 12, 44, 7, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fill();
        rr(ctx, rect.x + rect.w - 58, rect.y + rect.h / 2 + 12, 44 * frac, 7, 3);
        ctx.fillStyle = '#4da34d';
        ctx.fill();
      } else {
        text(ctx, 'READY', rect.x + rect.w - 36, rect.y + rect.h / 2 + 18, '700 10px system-ui, sans-serif', '#2b7a2b', 'center');
      }
    } else {
      // Knife resting on the board.
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2 - 4);
      ctx.rotate(-0.5);
      rr(ctx, -26, -4, 34, 8, 3);
      ctx.fillStyle = '#c8ccd2';
      ctx.fill();
      rr(ctx, 8, -3, 18, 6, 3);
      ctx.fillStyle = '#5d3419';
      ctx.fill();
      ctx.restore();
    }
    stationLabel(ctx, 'CHOP', rect.x + rect.w / 2, rect.y + rect.h - 8);
  });

  // Grill.
  const gr = STATIONS.grill;
  rr(ctx, gr.x, gr.y, gr.w, gr.h, 8);
  ctx.fillStyle = '#26221f';
  ctx.fill();
  ctx.strokeStyle = '#4a4238';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawFlames(ctx, gr.x + 12, gr.y + gr.h - 12, gr.w - 24, t, 0);
  for (let i = 0; i < 2; i += 1) {
    const sx = gr.x + 48 + i * 94;
    const sy = gr.y + 42;
    const slot = world.grill[i];
    if (slot && !slot.done) {
      const glowG = ctx.createRadialGradient(sx, sy, 4, sx, sy, 44);
      glowG.addColorStop(0, 'rgba(255,122,47,0.4)');
      glowG.addColorStop(1, 'rgba(255,122,47,0)');
      ctx.fillStyle = glowG;
      ctx.beginPath();
      ctx.arc(sx, sy, 44, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = '#5a5148';
    ctx.lineWidth = 3;
    for (let g = 0; g < 5; g += 1) {
      ctx.beginPath();
      ctx.moveTo(sx - 34, sy - 18 + g * 9);
      ctx.lineTo(sx + 34, sy - 18 + g * 9);
      ctx.stroke();
    }
    if (slot) {
      drawIngredient(ctx, slot.ing, slot.done ? 'grilled' : 'raw', sx, sy - 6, 40);
      if (!slot.done) progressRing(ctx, sx + 30, sy - 26, 12, slot.progress / 4, '#ff7a2f');
      else if (slot.burnt) text(ctx, 'BURNT', sx, sy + 26, '700 10px system-ui, sans-serif', '#ff7a5a', 'center');
      else text(ctx, 'READY', sx, sy + 26, '700 10px system-ui, sans-serif', '#8be28b', 'center');
    }
  }
  stationLabel(ctx, 'GRILL', gr.x + gr.w / 2, gr.y + gr.h - 6);

  // Fryer.
  const fr = STATIONS.fryer;
  rr(ctx, fr.x, fr.y, fr.w, fr.h, 8);
  ctx.fillStyle = PALETTE.steel;
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 2; i += 1) {
    const bx = fr.x + 30 + i * 95;
    const by = fr.y + 22;
    rr(ctx, bx - 36, by, 72, 46, 5);
    ctx.fillStyle = '#e8a04c';
    ctx.fill();
    ctx.fillStyle = '#f6c945';
    ctx.beginPath();
    ctx.ellipse(bx, by + 8, 32, 8, 0, 0, TAU);
    ctx.fill();
    // Bubbles.
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let b = 0; b < 3; b += 1) {
      const bx2 = bx - 18 + ((b * 17 + Math.floor(t * 3 + i * 5 + b)) % 36);
      ctx.beginPath();
      ctx.arc(bx2, by + 8 - ((t * 14 + b * 9) % 14), 2.4, 0, TAU);
      ctx.fill();
    }
    const slot = world.fryer[i];
    if (slot) {
      drawIngredient(ctx, slot.ing, slot.done ? 'fried' : 'raw', bx, by - 4, 38);
      if (!slot.done) progressRing(ctx, bx + 32, by - 8, 11, slot.progress / 3, '#ff7a2f');
      else if (slot.burnt) text(ctx, 'BURNT', bx, by + 34, '700 10px system-ui, sans-serif', '#ff7a5a', 'center');
    }
  }
  stationLabel(ctx, 'FRYER', fr.x + fr.w / 2, fr.y + fr.h - 6);

  // Plate stack.
  const pl = STATIONS.plates;
  woodCounter(ctx, pl, '#c98d5f');
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = i === 3 ? '#ffffff' : '#e8e4da';
    ctx.beginPath();
    ctx.ellipse(pl.x + pl.w / 2, pl.y + 22 + i * 9, 34, 9, 0, 0, TAU);
    ctx.fill();
  }
  stationLabel(ctx, 'PLATES', pl.x + pl.w / 2, pl.y + pl.h - 8);

  // Plating counter.
  const pc = STATIONS.plating;
  woodCounter(ctx, pc);
  for (let i = 0; i < 3; i += 1) {
    const px = pc.x + 110 + i * 230;
    const py = pc.y + pc.h / 2 - 6;
    const plate = world.plating[i];
    if (plate) {
      drawPlate(ctx, plate.items, px, py, 74, t);
    } else {
      ctx.strokeStyle = 'rgba(255,246,227,0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.ellipse(px, py, 46, 30, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  stationLabel(ctx, 'PLATING  •  BUILD THE DISH HERE', pc.x + pc.w / 2, pc.y + pc.h - 8);

  // Trash.
  const tr = STATIONS.trash;
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8);
  ctx.fillStyle = '#4a4a52';
  ctx.fill();
  rr(ctx, tr.x + 8, tr.y + 8, tr.w - 16, 22, 4);
  ctx.fillStyle = '#33333a';
  ctx.fill();
  text(ctx, 'TRASH', tr.x + tr.w / 2, tr.y + 52, '700 12px system-ui, sans-serif', '#cfcfd6', 'center');

  // Sink (decorative, with running water).
  const sk = STATIONS.sink;
  rr(ctx, sk.x, sk.y, sk.w, sk.h, 8);
  ctx.fillStyle = PALETTE.steel;
  ctx.fill();
  rr(ctx, sk.x + 10, sk.y + 14, sk.w - 20, sk.h - 26, 5);
  ctx.fillStyle = '#7fb3d5';
  ctx.fill();
  ctx.strokeStyle = '#9aa0a8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sk.x + sk.w / 2, sk.y + 12);
  ctx.lineTo(sk.x + sk.w / 2, sk.y + 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sk.x + sk.w / 2, sk.y + 14);
  ctx.lineTo(sk.x + sk.w / 2, sk.y + 30 + Math.sin(t * 6) * 2);
  ctx.stroke();

  // Wall band between HUD and floor (top edge trim).
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, HUD_H, W, 4);
}

// ---- chef -----------------------------------------------------------------

function drawChef(ctx, world, t) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(c.bob) * 2 : Math.sin(t * 2) * 1;
  shadow(ctx, c.x, c.y + 22, 20, 7);
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // Body: white apron.
  rr(ctx, -16, -6, 32, 30, 10);
  ctx.fillStyle = '#f5f0e6';
  ctx.fill();
  ctx.strokeStyle = '#d8cfbc';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Apron straps + pocket.
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(-13, 6, 26, 4);
  rr(ctx, -7, 12, 14, 8, 2);
  ctx.fillStyle = '#c9402f';
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(-17, 6, 6, 0, TAU);
  ctx.arc(17, 6, 6, 0, TAU);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(0, -18, 13, 0, TAU);
  ctx.fill();
  // Eyes look in the walking direction.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(c.dir * 3 - 4, -19, 1.8, 0, TAU);
  ctx.arc(c.dir * 3 + 4, -19, 1.8, 0, TAU);
  ctx.fill();
  // Smile.
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(c.dir * 2, -14, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -30, 7, 0, TAU);
  ctx.arc(0, -34, 8, 0, TAU);
  ctx.arc(8, -30, 7, 0, TAU);
  ctx.fill();
  rr(ctx, -11, -32, 22, 7, 3);
  ctx.fill();
  // Red neckerchief.
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(0, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Carried item, held high above the toque.
  const carried = c.carrying;
  if (carried) {
    const cy = c.y - 52 + bob * 0.4;
    shadow(ctx, c.x, c.y - 34, 16, 4, 0.1);
    if (carried.kind === 'plate') drawPlate(ctx, carried.items, c.x, cy, 74, t);
    else drawIngredient(ctx, carried.ing, carried.prep, c.x, cy, 44);
  }
  // The other hand: an ingredient fetched while a plate is carried.
  if (world.chef.hand) {
    drawIngredient(ctx, world.chef.hand.ing, world.chef.hand.prep, c.x + c.dir * 24, c.y - 8, 26);
  }
}

// ---- HUD ------------------------------------------------------------------

function drawTicket(ctx, order, x, t) {
  const recipe = RECIPES[order.recipe];
  const frac = Math.max(0, order.patience / order.max);
  const urgent = frac < 0.28;
  const w = 196;
  const h = 76;
  ctx.save();
  if (urgent && Math.sin(t * 8) > 0) ctx.translate(0, 0);
  rr(ctx, x, 8, w, h, 8);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = urgent ? '#d94f3d' : '#c9a15a';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  // Order number tab.
  rr(ctx, x, 8, 34, 18, 6);
  ctx.fillStyle = urgent ? '#d94f3d' : '#2b3a32';
  ctx.fill();
  text(ctx, `#${order.id}`, x + 17, 21, '700 11px system-ui, sans-serif', '#fff6e3', 'center');
  text(ctx, recipe.name, x + 42, 22, '700 13px Georgia, serif', '#2b1d12');
  text(ctx, `$${recipe.price}`, x + w - 10, 22, '700 13px Georgia, serif', '#8a6a1e', 'right');
  // Needed items with check marks for what is already plated somewhere is not tracked;
  // the icons show the dish at a glance.
  recipe.items.forEach((it, i) => {
    drawIngredient(ctx, it.ing, it.prep, x + 22 + i * 34, 48, 26);
  });
  // Patience bar.
  rr(ctx, x + 10, h - 12, w - 20, 7, 3);
  ctx.fillStyle = '#e0d5bd';
  ctx.fill();
  rr(ctx, x + 10, h - 12, (w - 20) * frac, 7, 3);
  ctx.fillStyle = frac > 0.5 ? '#4da34d' : frac > 0.28 ? '#f2a93c' : '#d94f3d';
  ctx.fill();
  if (urgent) text(ctx, 'HURRY!', x + w - 12, 48, '700 11px system-ui, sans-serif', '#d94f3d', 'right');
  ctx.restore();
}

function drawHUD(ctx, world, t) {
  // Top bar.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, HUD_H - 4, W, 4);
  // Flame logo.
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.moveTo(28, 66);
  ctx.quadraticCurveTo(18, 50, 28, 34);
  ctx.quadraticCurveTo(32, 46, 38, 34);
  ctx.quadraticCurveTo(46, 52, 36, 66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.arc(30, 58, 5, 0, TAU);
  ctx.fill();
  text(ctx, 'EMBERLINE', 50, 34, '700 17px Georgia, serif', '#fff6e3');
  text(ctx, 'WOOD-FIRED KITCHEN', 50, 52, '600 9px system-ui, sans-serif', '#c9d6c9');
  text(ctx, `DAY 1`, 50, 68, '700 11px system-ui, sans-serif', '#f2c14e');

  // Order tickets.
  world.orders.forEach((order, i) => drawTicket(ctx, order, 168 + i * 204, t));
  if (world.orders.length === 0) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    rr(ctx, 168, 8, 196, 76, 8);
    ctx.fillStyle = 'rgba(255,246,227,0.12)';
    ctx.fill();
    text(ctx, 'No tickets —', 266, 40, '600 13px system-ui, sans-serif', '#c9d6c9', 'center');
    text(ctx, 'next order coming…', 266, 58, '600 13px system-ui, sans-serif', '#c9d6c9', 'center');
    ctx.restore();
  }

  // Right cluster: timer, coins, streak.
  const rx = 1000;
  const mm = Math.floor(world.timeLeft / 60);
  const ss = Math.floor(world.timeLeft % 60);
  const lowTime = world.timeLeft <= 15 && world.screen === SCREEN_PLAY;
  text(ctx, 'SHIFT', rx, 26, '700 10px system-ui, sans-serif', '#c9d6c9');
  text(
    ctx,
    `${mm}:${String(ss).padStart(2, '0')}`,
    rx,
    58,
    `700 30px Georgia, serif`,
    lowTime && Math.sin(t * 8) > 0 ? '#ff8a7a' : '#fff6e3',
  );
  // Shift progress bar.
  rr(ctx, rx, 66, 130, 8, 4);
  ctx.fillStyle = 'rgba(255,246,227,0.25)';
  ctx.fill();
  rr(ctx, rx, 66, 130 * world.shiftProgress, 8, 4);
  ctx.fillStyle = world.rushActive ? '#ff7a2f' : '#f2c14e';
  ctx.fill();
  if (world.rushActive) text(ctx, 'RUSH!', rx + 140, 74, '700 10px system-ui, sans-serif', '#ff7a2f');

  // Coins.
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1160, 30, 13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#b98a1e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, '$', 1160, 35, '700 14px Georgia, serif', '#8a6a1e', 'center');
  text(ctx, `${world.coins}`, 1180, 36, '700 22px Georgia, serif', '#fff6e3');
  // Streak.
  if (world.streak >= 2) {
    rr(ctx, 1140, 48, 112, 26, 13);
    ctx.fillStyle = '#d94f3d';
    ctx.fill();
    text(ctx, `STREAK x${world.streak}`, 1196, 66, '700 12px system-ui, sans-serif', '#fff6e3', 'center');
  } else {
    text(ctx, `Served ${world.served}`, 1196, 66, '600 12px system-ui, sans-serif', '#c9d6c9', 'center');
  }
}

// ---- overlays ---------------------------------------------------------------

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(20,14,8,${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

function panel(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(30,22,14,0.94)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTitle(ctx, world, t) {
  dim(ctx, 0.45);
  panel(ctx, 330, 150, 620, 420);
  // Flame logo big.
  ctx.fillStyle = PALETTE.flame;
  ctx.beginPath();
  ctx.moveTo(640, 250);
  ctx.quadraticCurveTo(610, 205, 640, 165);
  ctx.quadraticCurveTo(650, 195, 664, 165);
  ctx.quadraticCurveTo(680, 205, 660, 250);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'EMBERLINE', 640, 300, '700 54px Georgia, serif', '#fff6e3', 'center');
  text(ctx, 'WOOD-FIRED KITCHEN RUSH', 640, 330, '700 15px system-ui, sans-serif', '#f2c14e', 'center');
  const how = [
    'Walk with WASD / arrows — or click where to go.',
    'Grab ingredients, chop, grill & fry, build the dish on a plate.',
    'Serve at the window before the ticket walks out. Burnt food goes in the trash.',
  ];
  how.forEach((line, i) => text(ctx, line, 640, 372 + i * 24, '14px system-ui, sans-serif', '#e8dcc0', 'center'));
  const pulse = 0.75 + Math.sin(t * 4) * 0.25;
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS ENTER TO START', 640, 470, '700 18px system-ui, sans-serif', '#ffd76a', 'center');
  ctx.globalAlpha = 1;
  text(ctx, 'One shift: 2½ minutes. Rush hour hits at the one-minute mark.', 640, 502, '13px system-ui, sans-serif', '#c9d6c9', 'center');
  if (world.best > 0) text(ctx, `Best shift so far: $${world.best}`, 640, 532, '700 13px system-ui, sans-serif', '#f2c14e', 'center');
}

function drawResults(ctx, world) {
  dim(ctx, 0.55);
  panel(ctx, 380, 130, 520, 460);
  text(ctx, 'SHIFT COMPLETE', 640, 178, '700 34px Georgia, serif', '#fff6e3', 'center');
  const stars = starsForCoins(world.coins);
  for (let i = 0; i < 3; i += 1) {
    const sx = 640 + (i - 1) * 64;
    ctx.save();
    ctx.translate(sx, 226);
    ctx.fillStyle = i < stars ? '#f2c14e' : 'rgba(255,246,227,0.25)';
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const r = p % 2 === 0 ? 26 : 11;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const rows = [
    ['Coins earned', `$${world.coins}`],
    ['Dishes served', `${world.served}`],
    ['Perfect serves', `${world.perfect}`],
    ['Best streak', `x${world.bestStreak}`],
    ['Walked out', `${world.lost}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 292 + i * 32;
    text(ctx, label, 460, y, '15px system-ui, sans-serif', '#e8dcc0');
    text(ctx, value, 820, y, '700 16px Georgia, serif', '#fff6e3', 'right');
  });
  text(ctx, 'PRESS R TO COOK AGAIN', 640, 486, '700 16px system-ui, sans-serif', '#ffd76a', 'center');
  text(
    ctx,
    stars === 3 ? 'Three stars — the dining room is yours!' : stars === 2 ? 'Two stars — a strong shift!' : 'The kitchen will test you again tomorrow.',
    640, 522,
    '13px system-ui, sans-serif',
    '#c9d6c9',
    'center',
  );
}

function drawPause(ctx) {
  dim(ctx, 0.5);
  text(ctx, 'PAUSED', 640, 350, '700 44px Georgia, serif', '#fff6e3', 'center');
  text(ctx, 'Press P to keep cooking', 640, 390, '15px system-ui, sans-serif', '#c9d6c9', 'center');
}

function drawBanner(ctx, world, t) {
  const b = world.banner;
  if (!b) return;
  const inT = Math.min(1, b.t / 0.25);
  const outT = b.t > 2.1 ? Math.max(0, 1 - (b.t - 2.1) / 0.5) : 1;
  ctx.save();
  ctx.globalAlpha = Math.min(inT, outT);
  ctx.translate(640, 300);
  ctx.scale(0.9 + 0.1 * inT, 0.9 + 0.1 * inT);
  ctx.font = '700 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(20,14,8,0.85)';
  ctx.strokeText(b.text, 0, 0);
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(b.text, 0, 0);
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.lineWidth = 5;
  ctx.strokeText(b.sub, 0, 34);
  ctx.fillStyle = '#fff6e3';
  ctx.fillText(b.sub, 0, 34);
  ctx.restore();
}

// ---- main draw --------------------------------------------------------------

export function drawWorld(ctx, world, t) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 24, (Math.random() - 0.5) * world.shake * 24);
  }
  // Background wall behind the HUD area is drawn by the HUD; floor first.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, W, HUD_H);
  drawKitchen(ctx, world, t);
  // Steam / burst particles.
  for (const p of world.particles) {
    const a = Math.max(0, 1 - p.t / p.life);
    if (p.kind === 'steam') {
      ctx.fillStyle = `rgba(255,255,255,${a * 0.28})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.t * 0.6), 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  drawChef(ctx, world, t);
  // Floating score texts.
  for (const f of world.floats) {
    const a = Math.max(0, 1 - f.t / f.life);
    ctx.globalAlpha = a;
    ctx.font = '700 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(20,14,8,0.8)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }
  drawHUD(ctx, world, t);
  drawBanner(ctx, world, t);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world, t);
  if (world.screen === SCREEN_OVER) drawResults(ctx, world);
  if (world.paused && world.screen === SCREEN_PLAY) drawPause(ctx);
  ctx.restore();
}
