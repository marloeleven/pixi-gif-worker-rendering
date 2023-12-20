const canvas = document.querySelector("canvas");
const input = document.querySelector("input");

const worker = new Worker('worker.js');

const options = {
  background: 0x00000000,
  width: 1280,
  height: 720,
  resolution: window.devicePixelRatio,
  view: canvas.transferControlToOffscreen(),
  backgroundAlpha: 0,
}

worker.postMessage({ type: 'INIT', payload: { options } }, [options.view]);

input.addEventListener("change", async (e) => {
  if (e.target.files.length === 0) {
    return;
  }

  const buffer = await e.target.files[0].arrayBuffer()

  worker.postMessage({
    type: 'LOAD-GIF',
    payload: buffer
  }, [buffer])
})