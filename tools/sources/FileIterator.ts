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

  async glob() {
    const { projectRoot, pattern } = this;
    const files = await glob.promise(pattern, { cwd: projectRoot });
    return files.map(relativePath => path.join(projectRoot, relativePath));
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
