import { URL, URLSearchParams } from 'url';
import * as puppeteer from 'puppeteer';
import debugFactory from 'debug';
import * as assert from 'assert';
import AttachmentDownloader from './AttachmentDownloader';

const debug = debugFactory('history-threads:enhance:facebook');

const trimTrackingParams = (url: string) => {
  const parsed = new URL(url);
  const tracking = [
    'fref',
    '__tn__',
    'eid'
  ];
  tracking.forEach(param => parsed.searchParams.delete(param));
  return parsed.href;
}

export default class FacebookEnhancer {
  constructor() {
    assert(process.env.FACEBOOK_EMAIL, 'FACEBOOK_EMAIL env var not set');
    assert(process.env.FACEBOOK_PASSWORD, 'FACEBOOK_PASSWORD env var not set');
  }

  async enhance(resource: string) {
    const parsed = new URL(resource);
    const { host, pathname } = parsed;

    if (host !== 'www.facebook.com') {
      return null;
    }

    switch (pathname) {
      case '/photo.php':
        parsed.search = String(new URLSearchParams({
          fbid: parsed.searchParams.get('fbid'),
          // Without `_fb_noscript` parameter there is no .userContentWrapper
          // element in DOM. This element contains post.
          // Even with `_fb_noscript` there is no comments section or post id
          // related to a photo, only author. This fetch and cheerio is not
          // enought to get needed data for automatic citation. Puppeteer could
          // work for this task.
          // _fb_noscript: '1',
        }));

        const canonicalPhotoUrl = parsed.href;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // Login to download original image, i.e. the best resolution.
        debug('going to login page...');
        await page.goto(
          `https://www.facebook.com/login.php?next=${encodeURI(canonicalPhotoUrl)}`,
          { waitUntil: ['domcontentloaded', 'networkidle0'] }
        );
        const emailInput = await page.$('#email');
        await emailInput.type(process.env.FACEBOOK_EMAIL);
        const passwordInput = await page.$('#pass');
        await passwordInput.type(process.env.FACEBOOK_PASSWORD);

        debug('submitting login form...');
        await passwordInput.press('Enter');

        debug('waiting for content rendering on client...');
        await page.waitForSelector('.userContentWrapper');

        const content = await page.evaluate(() => {
          const content = document.querySelector('.userContentWrapper')
          const linkToComments = <HTMLAnchorElement>content.querySelector('a[href*="posts"]');
          // Query first anchor, which is an archor wrapping profile avatar image.
          const linkToAuthor = <HTMLAnchorElement>content.querySelector('a[data-hovercard]');
          const time = <HTMLAnchorElement>content.querySelector('abbr');

          const result = {
            comments: {},
            author: {
              name: linkToAuthor && linkToAuthor.getAttribute('title'),
              url: linkToAuthor && linkToAuthor.href,
            },
            time: {
              // TODO is it UTC?
              utime: Number(time.dataset.utime),
              // TODO what timezone is it?
              formatted: time.getAttribute('title'),
            }
          };

          if (linkToComments) {
            result.comments = {
              count: parseInt(linkToComments.textContent, 10),
              url: linkToComments.href,
            };
          } else {
            result.comments = {
              count: 0,
            };
          }

          return result;
        });

        // Click on Options to render menu with Download item.
        debug('waiting for Options link...');
        await page.waitForSelector('.bottomBarActions a');
        await page.click('.bottomBarActions a');
        // Sometimes Options menu takes time to render.
        debug('waiting for Download link...');
        await page.waitForSelector('a[href*="/photo/download/"]');

        // Attachments are not readable using response.buffer() on response event.
        debug('downloading image...');
        const downloader = new AttachmentDownloader();
        const imageBuffer = await downloader.download(page, () => page.click('a[href*="/photo/download/"]'));

        await browser.close();

        content.author.url = trimTrackingParams(content.author.url);

        return {
          canonicalPhotoUrl: parsed.href,
          content,
          imageBuffer,
        };
    }

    return {
      note: 'TODO improve FacebookEnhancer to handle this resource',
      pathname,
      query: parsed.searchParams,
    };
  }
}
