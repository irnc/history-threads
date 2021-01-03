import * as glob from 'glob-promise';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'yaml';

export default class FileIterator {
  projectRoot: string;
  pattern: string;

  constructor({ projectRoot, pattern = 'src/**/*.yml' }) {
    this.projectRoot = projectRoot;
    this.pattern = pattern;
  }

  /**
   * @returns {string[]} Absolute filenames
   */
  async glob() {
    const { projectRoot } = this;
    const files = await this.globRelative();
    return files.map(relativePath => path.join(projectRoot, relativePath));
  }

  globRelative() {
    const { projectRoot, pattern } = this;
    return glob.promise(pattern, { cwd: projectRoot });
  }

  absolute(file: string) {
    return path.join(this.projectRoot, file);
  }

  async stat() {
    const files = await this.glob();
    return files.map(file => ({
      file,
      stats: fs.statSync(file),
    }));
  }

  static readYaml(file: string) {
    const str = fs.readFileSync(file, { encoding: 'utf-8' });
    return YAML.parse(str);
  }
}
