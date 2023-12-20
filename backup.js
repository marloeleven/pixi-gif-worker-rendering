const canvas = document.querySelector("canvas");
const input = document.querySelector("input");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function worker() {
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

}

function local() {
  const canvasContext = canvas.getContext("2d");

  async function decodeFrame(imageDecoder, frameIndex, frameCount) {
    const result = await imageDecoder.decode({ frameIndex });

    canvasContext.drawImage(result.image, 0, 0);
    await sleep(result.image.duration / 1000);

    if (frameIndex + 1 < frameCount) {
      decodeFrame(imageDecoder, frameIndex + 1, frameCount)
      return
    }

    decodeFrame(imageDecoder, 0, frameCount)
  }

  function onReady(cb) {
    return new Promise(resolve => {
      const interv = setInterval(async () => {
        const res = await cb();

        if (res) {
          clearInterval(interv);
          resolve(1);
        }
      }, 100)
    })
  }

  async function decodeImage(arrayBuffer) {
    const imageDecoder = new ImageDecoder({ data: arrayBuffer, type: "image/gif" });

    await onReady(async () => {
      await imageDecoder.completed;

      return imageDecoder.tracks?.selectedTrack?.frameCount;
    })

    decodeFrame(imageDecoder, 0, imageDecoder.tracks.selectedTrack.frameCount)
  }

  // fetch("./cat.gif").then((response) => {
  //   console.log('body', typeof response.body, response.body)
  //   decodeImage(response.body)
  // });

  input.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) {
      return;
    }

    const buffer = await e.target.files[0].arrayBuffer()

    decodeImage(buffer)
  })
}

// local();

worker();