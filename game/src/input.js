// Keyboard and pointer input: WASD / arrows to walk, E or Space to use a station,
// click a station to walk over and use it, click the floor to walk there.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.moveTarget = null; // { x, y } in canvas pixels, or null
    this.pendingStation = null; // station descriptor to use on arrival, or null
    this.onInteract = null; // () => void, called for E / Space
    this.onAnyGesture = null; // () => void, first pointer/key gesture (audio unlock)
    this.onPause = null;
    this.onRestart = null;
    this.onStart = null;
    this._gestured = false;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
      this._gesture();
      if (event.repeat) return;
      this.keys.add(event.key.toLowerCase());
      if (event.key === 'e' || event.key === 'E' || event.key === ' ') {
        if (this.onInteract) this.onInteract();
      }
      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (this.onPause) this.onPause();
      }
      if (event.key === 'r' || event.key === 'R') {
        if (this.onRestart) this.onRestart();
      }
      if (event.key === 'Enter') {
        if (this.onStart) this.onStart();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    canvas.addEventListener('pointerdown', (event) => {
      this._gesture();
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
      if (this.onPointer) this.onPointer(x, y);
    });
  }

  _gesture() {
    if (!this._gestured) {
      this._gestured = true;
      if (this.onAnyGesture) this.onAnyGesture();
    }
  }

  // -1 / 0 / 1 per axis from the held movement keys.
  axis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    return { x, y };
  }

  get hasKeys() {
    return this.keys.size > 0;
  }
}
