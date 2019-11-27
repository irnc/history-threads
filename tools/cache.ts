const cacheManager = require('cache-manager');
const fsHashStore = require('cache-manager-fs-hash');
const fsBinaryStore = require('cache-manager-fs-binary');

const CACHE_DIR = `${__dirname}/../.cache`;

const temporaryCache = cacheManager.caching({
  store: fsHashStore,
  options: {
    ttl: 60 * 60 * 24 /* seconds */,
    maxsize: 1000 * 1000 * 1000 /* max size in bytes on disk */,
    path: `${CACHE_DIR}/temporary`,
    subdirs: true,
  }
});

const imageCache = cacheManager.caching({
  store: fsBinaryStore,
  options: {
      reviveBuffers: false,
      binaryAsStream: true,
      ttl: 60 * 60 * 24 /* seconds */,
      maxsize: 1000 * 1000 * 1000 /* max size in bytes on disk */,
      path: `${CACHE_DIR}/image`,
      preventfill: false
  }
});

module.exports = { temporaryCache, imageCache };
