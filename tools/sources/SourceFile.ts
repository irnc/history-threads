import { promises as fs } from 'fs';
import * as YAML from 'yaml';
import * as _ from 'lodash';

export default class SourceFile {
  filepath: string;
  data: object;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  async read() {
    if (!this.data) {
      const str = await fs.readFile(this.filepath, { encoding: 'utf-8' });
      this.data = YAML.parse(str);
    }

    return this.data;
  }

  async merge(partial: object) {
    await fs.writeFile(
      this.filepath,
      YAML.stringify(_.merge({}, await this.read(), partial)),
    );
  }
}
