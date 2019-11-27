import FacebookEnhancer from './FacebookEnhancer';

const photo = 'https://www.facebook.com/photo.php?fbid=2337466862959901&set=a.348512821855325&type=1&theater';
const photoWithProfileId = 'https://www.facebook.com/photo.php?fbid=929631154103885';

describe('FacebookEnhancer', () => {
  it('should enhance photo resource', async () => {
    jest.setTimeout(15000);

    const enhancer = new FacebookEnhancer();
    const data = await enhancer.enhance(photo);

    expect(data).toHaveProperty('canonicalPhotoUrl');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('imageBuffer');

    expect(data.content).toMatchObject({
      author: {
        name: 'Rasl Kulevich',
        url: 'https://www.facebook.com/susanin.grodno',
      },
      comments: {
        count: 12,
        url: 'https://www.facebook.com/susanin.grodno/posts/2337470272959560',
      },
      time: {
        utime: 1555912177,
        formatted: '4/22/19, 8:49 AM',
      }
    });

    expect(Buffer.isBuffer(data.imageBuffer)).toBeTruthy();
  });

  it('should preserve profile id in content.authod.url', async () => {
    jest.setTimeout(15000);

    const enhancer = new FacebookEnhancer();
    const data = await enhancer.enhance(photoWithProfileId);

    expect(data.content).toMatchObject({
      author: {
        url: 'https://www.facebook.com/profile.php?id=100011710280346',
      },
    });
  });
});
