const b = /(?!(<p class="wysiwyg-text-align-center"><img\s*src="))\/hc\/.+(?=("\s*alt=".+"><\/p>))/g;
import { decode, Image } from 'https://deno.land/x/imagescript@v1.2.14/mod.ts';

fetch(`https://feedback.minecraft.net/hc/article_attachments/9527542833677`)
  .then((res) => res.arrayBuffer())
  .then(async (data) => {
    let img = (await decode(new Uint8Array(data))) as Image;

    while (img.height / 2 > 240 && img.width / 2 > 240) {
      img = img.resize(img.width / 2, img.height / 2);
    }

    const size = img.width > img.height ? img.height : img.width;

    const square = img.crop(img.width / 2 - size / 2, img.height - size, size, size);

    const squareData = await square.encode(3);

    Deno.writeFileSync('image.png', squareData);

    // function Uint8ToString(u8a: any) {
    //   var CHUNK_SZ = 0x8000;
    //   var c = [];
    //   for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
    //     c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    //   }
    //   return c.join('');
    // }

    // const base64Code = btoa(Uint8ToString(squareData));

    // Deno.writeTextFileSync('image.txt', base64Code);
  });
