// TODO
// accept dir or file path
// read YAML
// fetch additional data about resources
// store updated YAML

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

const run = async ({ projectRoot, pattern }) => {
  const fileIterator = new FileIterator({ projectRoot, pattern });
  const files = await fileIterator.glob();

  files.map(FileIterator.readYaml).forEach(async (data, i) => {
    const sourceFile = files[i];
    const mainResourceUrl = new URL(data.resource[0]);

    if (mainResourceUrl.host.endsWith('facebook.com')) {
      const enhancer = new FacebookEnhancer();
      const facebook = await enhancer.enhance(mainResourceUrl.href);

      fs.promises.writeFile(sourceFile.replace('.yml', '.jpg'), facebook.imageBuffer);
      const fileX = new SourceFile(sourceFile);
      fileX.merge({ facebook: _.omit(facebook, 'imageBuffer') });
    }
  });
};

run({
  projectRoot: path.join(__dirname, '..'),
  pattern: process.argv[2],
});
