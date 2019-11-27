const fs = require('fs');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const moment = require('moment');
const path = require('path');
const makeDir = require('make-dir');
const YAML = require('yaml');
const { temporaryCache, imageCache } = require('./cache');

const fetchText = async (url) => {
  const response = await fetch(url);
  return response.text();
}

const fetchImage = async (src) => {
  const { binary } = await imageCache.wrap(src, async () => {
    const response = await fetch(src);
    return {
      binary: {
        // cache-manager-fs-binary чакае Buffer, які мы тут ствараем з
        // ArrayBuffer.
        image: Buffer.from(await response.arrayBuffer()),
      },
    };
  });

  return binary.image;
}

const saveImage = async ({ url, file }) => {
  return new Promise(async (resolve) => {
    const parentDirectoryPromise = makeDir(path.dirname(file));
    const image = await fetchImage(url);
    const source = await parentDirectoryPromise && fs.createWriteStream(file);

    image.pipe(source).on('finish', resolve);
  });
};

const run = async ({ url }) => {
  const text = await temporaryCache.wrap(url, () => fetchText(url));
  const $ = cheerio.load(text);
  const offerId = $('.asi-offer__offer-id').text().trim().replace(/[\(\)]/g, '');
  // NOTE .jpg files are ignored by Git to reduce repo clone time for collaborators
  // TODO save images to dat archive
  const file = `src/allegro-archiwum/${offerId}.jpg`;
  const image = $('.asi-gallery__image').attr('src');
  const images = $('.asi-gallery__thumbnail-image').map((i, img) => $(img).attr('src')).get();
  const imagesArchive = images.map((url, i) => ({
    url,
    file: file.replace('.jpg', `-${i + 1}.jpg`),
  }))

  // Калі няма элементаў прадпрагляду, значыць только адна выява лота.
  if (images.length === 0) {
    await saveImage({
      url: image,
      file,
    });
  } else {
    await Promise.all(imagesArchive.map(saveImage));
  }

  // TODO create or update .yml
  const yamlFile = file.replace('.jpg', '.yml');
  const overwrite = {
    resource: [
      url
    ],
    images: images.length === 0 ? [ { url: image, file } ] : imagesArchive,
  };
  const data = {
    ...overwrite,
    threads: [
      'allegro',
    ],
  };

  if (fs.existsSync(yamlFile)) {
    const existingData = YAML.parse(fs.readFileSync(yamlFile, { encoding: 'utf-8' }));
    Object.assign(data, existingData, overwrite);
  }

  fs.writeFileSync(yamlFile, YAML.stringify(data));
};

const runTimeout = setTimeout(() => {
  console.error(new Error('run have not finished in 5 seconds'));
  process.exit(1);
}, 5000);

// Першы аргумент будзе мець індэкс 2.
run({ url: process.argv[2] }).then(() => clearTimeout(runTimeout));
