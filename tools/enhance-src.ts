// TODO
// accept dir or file path
// read YAML
// fetch additional data about resources
// store updated YAML

/*

How to use:
1. copy .env.sample to .env and provide your credentials
2. npm run enhance-src src/2019/11/2019-11-29-fara-rasl.yml

Options:
- `DEBUG=history-threads:enhance:facebook` to see progress with Facebook

*/

import debugFactory from 'debug';
import FileIterator from './sources/FileIterator';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import * as _ from 'lodash';
import slugify from 'slugify';
import * as makeDir from 'make-dir';
import UpdatesBuilder from './build-website/UpdatesBuilder';
import FacebookEnhancer from './enhance-sources/FacebookEnhancer';
import SourceFile from './sources/SourceFile';
import NacEnhancer from './enhance-sources/NacEnhancer';

require('dotenv').config();

const debug = debugFactory('history-threads:enhance');

const run = async ({ projectRoot, pattern }) => {
  const fileIterator = new FileIterator({ projectRoot, pattern });
  const files = await fileIterator.glob();

  const readYaml = (file) => {
    try {
      return FileIterator.readYaml(file);
    } catch (err) {
      throw new Error(`failed to parse YAML from '${file}': ${err.message}`);
    }
  };

  debug(`running enhance on ${files.length} files`);

  files.map(readYaml).forEach(async (data, i) => {
    const sourceFile = files[i];
    const mainResourceUrl = new URL(data.resource[0]);

    debug(`enhancing ${path.basename(sourceFile)} using ${mainResourceUrl.host}`);

    if (mainResourceUrl.host.endsWith('facebook.com')) {
      const enhancer = new FacebookEnhancer();
      const facebook = await enhancer.enhance(mainResourceUrl.href);

      fs.promises.writeFile(sourceFile.replace('.yml', '.jpg'), facebook.imageBuffer);
      const fileX = new SourceFile(sourceFile);
      fileX.merge({ facebook: _.omit(facebook, 'imageBuffer') });
    } else if (mainResourceUrl.host === 'audiovis.nac.gov.pl') {
      const enhancer = new NacEnhancer();
      const data = await enhancer.enhance(mainResourceUrl.href);

      const fileX = new SourceFile(sourceFile);
      fileX.merge(data);
    }
  });
};

run({
  projectRoot: path.join(__dirname, '..'),
  pattern: process.argv[2],
});
