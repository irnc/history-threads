import FileIterator from './sources/FileIterator';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import * as _ from 'lodash';
import slugify from 'slugify';
import * as makeDir from 'make-dir';
import UpdatesBuilder from './build-website/UpdatesBuilder';
import ResourcesBuilder from './build-website/ResourcesBuilder';

/*

- read src/
- aggregate by thread
- generate thread data files for Hugo
  - md files would be manually edited

*/

const run = async ({ projectRoot }) => {
  const fileIterator = new FileIterator({ projectRoot });
  const files = await fileIterator.globRelative();
  const threadIndex = [];

  files.forEach((relativeFilePath, i) => {
    const absFile = fileIterator.absolute(relativeFilePath);
    const data = FileIterator.readYaml(absFile);

    if (!Array.isArray(data.threads)) {
      throw new Error(`threads is not an array in '${files[i]}'`);
    }

    data.threads.forEach((thread) => {
      if (!threadIndex[thread]) {
        threadIndex[thread] = [];
      }

      threadIndex[thread].push({ ...data, src: relativeFilePath });
    });
  });

  Object.keys(threadIndex).forEach(async (thread) => {
    const slug = slugify(thread).toLowerCase();
    const data = threadIndex[thread];
    const dir = `${projectRoot}/website/data/threads`;

    await makeDir(dir);
    fs.writeFileSync(`${dir}/${slug}.yml`, YAML.stringify(data));

    const threadsDir = `${projectRoot}/website/content/threads`;

    await makeDir(threadsDir);
    fs.writeFileSync(
      `${threadsDir}/${slug}.md`,
      '---\n' +
      YAML.stringify({
        // title is used by Hugo
        title: thread,
        thread,
        tags: _.uniq(_.flatten(_.map(data, 'threads'))),
        slug,
        // TODO add dates from file metadata
      }) +
      '---\n'
    );
  });

  // Write website/content/updates/
  const updatesBuilder = new UpdatesBuilder({ fileIterator, projectRoot });
  await updatesBuilder.build();

  // Write website/content/resources/
  const resourcesBuilder = new ResourcesBuilder({ fileIterator, projectRoot });
  await resourcesBuilder.build();
};

run({ projectRoot: path.join(__dirname, '..') });
