import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Page } from 'puppeteer';

export default class AttachmentDownloader {
  async download(page: Page, trigger: () => Promise<any>) {
    const downloadPath = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'attachment-downloader-')
    );

    // https://github.com/puppeteer/puppeteer/issues/299
    // Use private API to save attachment to downloads.
    await (<any>page)._client.send(
      'Page.setDownloadBehavior',
      {
        behavior: 'allow',
        downloadPath,
      },
    );

    await trigger();

    const filename = await this.waitForFileToDownload(page, downloadPath);
    const buffer = await fs.promises.readFile(path.resolve(downloadPath, filename));

    // Clean up temporary folder.
    await fs.promises.rmdir(downloadPath, { recursive: true });

    return buffer;
  }

  async waitForFileToDownload(page: Page, downloadPath: string) {
    let filename: string;

    while (!filename || filename.endsWith('.crdownload')) {
      // NOTE for some reason fs.promises.readdir newer sees a file
      filename = fs.readdirSync(downloadPath)[0];
      await page.waitFor(1000);
    }

    return filename;
  }
}
