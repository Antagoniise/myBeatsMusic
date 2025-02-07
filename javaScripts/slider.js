const progressEl = document.querySelector('input[type="range"]');
let mouseDownOnSlider = false;

audio.addEventListener("loadeddata", () => {
  progressEl.value = 0;
});
audio.addEventListener("timeupdate", () => {
  if (!mouseDownOnSlider) {
    progressEl.value = audio.currentTime / audio.duration * 100;
  }
});

progressEl.addEventListener("change", () => {
  const pct = progressEl.value / 100;
  audio.currentTime = (audio.duration || 0) * pct;
});
progressEl.addEventListener("mousedown", () => {
  mouseDownOnSlider = true;
});
progressEl.addEventListener("mouseup", () => {
  mouseDownOnSlider = false;
});