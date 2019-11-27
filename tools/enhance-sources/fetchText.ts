import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { temporaryCache } from '../cache';

const fetchText = async (url: string) => {
  const text = await temporaryCache.wrap(url, async () => {
    const response = await fetch(url);
    return response.text();
  });

  return cheerio.load(text);
};

export default fetchText;
