import * as fs from 'fs';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as moment from 'moment';
import * as path from 'path';
import * as makeDir from 'make-dir';
import * as YAML from 'yaml';
import { temporaryCache, imageCache } from './cache';

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

/**
 * Change scaled image URL to URL of originally uploaded image
 *
 * Somewhere between 2019-11-06 and 2019-11-28 Allegro Archiwum started to use
 * URLs to scaled images. Because we knew old URLs it is easy to construct them
 * again.
 *
 * @param url img src
 */
const toOriginal = (url: string) => {
  return url.replace('s1024', 'original');
}

const run = async ({ url }) => {
  const text = await temporaryCache.wrap(url, () => fetchText(url));
  const $ = cheerio.load(text);
  const offerId = $('.asi-offer__offer-id').text().trim().replace(/[\(\)]/g, '');
  // NOTE .jpg files are ignored by Git to reduce repo clone time for collaborators
  // TODO save images to dat archive
  const file = `src/allegro-archiwum/${offerId}.jpg`;
  const image = toOriginal($('.asi-gallery__image').attr('src'));
  const images = $('.asi-gallery__thumbnail-image').map((i, img) => toOriginal($(img).attr('src'))).get();
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
