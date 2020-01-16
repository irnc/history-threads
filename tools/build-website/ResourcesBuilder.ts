import FileIterator from '../sources/FileIterator';
import makeDir = require('make-dir');
import { promises as fs } from 'fs';
import { basename } from 'path';
import * as YAML from 'yaml';

const slugify = (filename: string) => basename(filename).replace('.yml', '');

export default class ResourcesBuilder {
  fileIterator: FileIterator;
  projectRoot: string;

  constructor({ fileIterator, projectRoot }) {
    this.fileIterator = fileIterator;
    this.projectRoot = projectRoot;
  }

  async build() {
    await this.buildDataResources();

    const { fileIterator, projectRoot } = this;
    const updates = await fileIterator.stat();
    const dir = `${projectRoot}/website/content/resources`;

    await makeDir(dir);

    const writePromises = updates.map(async ({ file, stats }) => {
      const data = FileIterator.readYaml(file);

      return await fs.writeFile(
        `${dir}/${basename(file).replace('.yml', '.md')}`,
        '---\n' +
        YAML.stringify({
          // title is used by Hugo
          title: slugify(file),
          // We use slug in templates to read resource from data file.
          slug: slugify(file),
          tags: data.threads.sort(),
          date: stats.birthtime,
          lastmod: stats.mtime,
        }) +
        '---\n' +
        '\n' +
        '<!-- Замяніце гэты радок-каментар на артыкул. -->' +
        '\n'
      );
    });

    return Promise.all(writePromises);
  }

  async buildDataResources() {
    const { fileIterator, projectRoot } = this;
    const dataDir = `${projectRoot}/website/data/resources`;
    const resources = await fileIterator.glob();

    await makeDir(dataDir);

    const writePromises = resources.map(absoluteFilname => {
      const slug = slugify(absoluteFilname);
      fs.copyFile(absoluteFilname, `${dataDir}/${slug}.yml`);
    });

    return Promise.all(writePromises);
  }
}
