// Two sources of 404 noise, both enumerated in .mossy/parity/317-318/.
//
// 1. Fixture images. 72 image paths across 21 test files 404 on the test server. Not one is
//    backed by a file in this repo, served by main--contitires--cloudadoption.aem.live, or
//    served by continentaltire.com: the pipeline rewrites every authored image to
//    ./media_<hash>.ext, so an authored path is never a URL and no site page is missing.
//    The answer is 200 with an EMPTY body rather than a placeholder image. A placeholder
//    gives the img an intrinsic size and moves layout: a 1x1 pixel took
//    media-gallery-leading's name column from live's 430px to 800px. An empty body renders
//    the same broken image a 404 does, so every measurement reads what it read before.
//    The cost, stated because it is real: a genuine missing image no longer shows either.
//    These tests assert on the markup a block builds and never on image bytes, and a 404 on
//    a page, a script or a JSON still shows, which is where a real defect appears.
//
// 2. The RUM sampler. sampleRUM fires one beacon in a hundred, so .rum/100 turned up in one
//    run in seven. 'off' is aem.js's own switch, resolving to weight 0, which leaves
//    isSelected false and sends nothing. aem.js is not modified, and
//    test/scripts/rum-sampling.test.js holds it.

const IMAGE = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

export default {
  middleware: [
    async (ctx, next) => {
      await next();
      if (ctx.status === 404 && IMAGE.test(ctx.path)) {
        ctx.status = 200;
        ctx.type = 'image/png';
        ctx.length = 0;
        ctx.body = Buffer.alloc(0);
      }
    },
  ],
  testRunnerHtml: (testFramework) => `<!DOCTYPE html>
<html>
  <body>
    <script>window.SAMPLE_PAGEVIEWS_AT_RATE = 'off';</script>
    <script type="module" src="${testFramework}"></script>
  </body>
</html>`,
};
