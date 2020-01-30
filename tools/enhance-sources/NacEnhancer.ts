import { URL, URLSearchParams } from 'url';
import * as puppeteer from 'puppeteer';
import debugFactory from 'debug';
import * as assert from 'assert';
import * as _ from 'lodash';
import AttachmentDownloader from './AttachmentDownloader';

const debug = debugFactory('history-threads:enhance:nac');

export default class NacEnhancer {
  async enhance(resource: string) {
    const parsed = new URL(resource);
    const { host, pathname } = parsed;

    if (host !== 'audiovis.nac.gov.pl') {
      return null;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(
      resource
    );

    const attributeRecords = await page.$$eval(
      '.box_title',
      (divs: HTMLDivElement[]) => divs.map(d => d.innerText)
    );

    const attributes = _(attributeRecords)
      .map(attr => attr.split(':'))
      .fromPairs()
      .mapValues(v => v.trim())
      .value();

    const data = {
      images: [
        {
          url: await page.$eval('.photo a', (a: HTMLAnchorElement) => a.href),
        },
      ],
      resourceId: `NAC:${attributes.Sygnatura}`,
      nac: {
        attributes,
      },
    };

    await browser.close();

    return data;
  }
}
