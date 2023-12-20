const pixiVersionString = 'v7.2.0';
const pixiWebWorkerUrl = `https://d157l7jdn8e5sf.cloudfront.net/${pixiVersionString}/webworker.js`;

self.importScripts(new URL(pixiWebWorkerUrl).href);


const container = new PIXI.Container();

let sprite;
let imageBitmap;

self.onmessage = async ({
  data: { type, payload },
}) => {
  if (type === 'INIT') {
    const { options } = payload;

    app = new PIXI.Application(options);

    app.stage.addChild(container);

    activeResolution = { width: options.width, height: options.height };
  }


  if (type === 'LOAD-GIF') {
    decodeImage(payload);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function decodeFrame(imageDecoder, frameIndex, frameCount) {
  const result = await imageDecoder.decode({ frameIndex });

  const frame = result.image;

  imageBitmap?.close();
  imageBitmap = await createImageBitmap(frame);

  if (sprite?._texture) {
    sprite?.destroy(true);
  }

  const texture = PIXI.Texture.from(imageBitmap);

  sprite = new PIXI.Sprite(texture);
  
  container.addChild(sprite);

  await sleep(result.image.duration / 1000);

  if (frameIndex + 1 < frameCount) {
    decodeFrame(imageDecoder, frameIndex + 1, frameCount)
    return
  }

  decodeFrame(imageDecoder, 0, frameCount)
}

async function decodeImage(arrayBuffer) {
  const imageDecoder = new ImageDecoder({ data: arrayBuffer, type: "image/gif" });

  await onReady(async () => {
    await imageDecoder.completed;

    return imageDecoder.tracks?.selectedTrack?.frameCount;
  });

  decodeFrame(imageDecoder, 0, imageDecoder.tracks.selectedTrack.frameCount)
}