import FileIterator from '../sources/FileIterator';
import makeDir = require('make-dir');
import { writeFileSync } from 'fs';
import { basename } from 'path';
import * as YAML from 'yaml';

export default class UpdatesBuilder {
  fileIterator: FileIterator;
  projectRoot: string;

  constructor({ fileIterator, projectRoot }) {
    this.fileIterator = fileIterator;
    this.projectRoot = projectRoot;
  }

  async build() {
    const { fileIterator, projectRoot } = this;
    const updates = await fileIterator.stat();
    const updatesDir = `${projectRoot}/website/content/updates`;

    await makeDir(updatesDir);

    updates.forEach(({ file, stats }) => {
      const data = FileIterator.readYaml(file);

      writeFileSync(
        `${updatesDir}/${basename(file).replace('.yml', '.md')}`,
        '---\n' +
        YAML.stringify({
          // title is used by Hugo
          title: `Змены ў ${basename(file).replace('.yml', '')}`,
          tags: data.threads.sort(),
          date: stats.birthtime,
          lastmod: stats.mtime,
        }) +
        '---\n' +
        '\n' +
        'TODO fetch commit history from GitHub?' +
        '\n'
      );
    });
  }
}
