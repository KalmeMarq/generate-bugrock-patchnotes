import { decode, Image } from 'https://deno.land/x/imagescript@v1.2.14/mod.ts';

export const baseFeedbackUrl = 'https://feedback.minecraft.net';
export const baseReleaseChangesUrl = 'https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs';
export const baseBetaPreviewChangesUrl = 'https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs';

export const getRandomStrings = async (amount: number) => {
  const data = await (await fetch(`https://www.random.org/strings/?num=${amount}&len=20&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new`)).text();

  const start = data.indexOf('<pre class="data">') + '<pre class="data">'.length;
  const end = data.indexOf('</pre>\n<p>', start);

  return data
    .substring(start, end)
    .split('\n')
    .filter((line) => line !== '');
};

export interface IPatchInfo {
  name: string;
  type: 'Preview' | 'Beta' | 'Preview & Beta' | 'Release';
  version: string;
  link: string;
}

type Platforms = 'All' | 'Windows' | 'iOS' | 'Android' | 'Xbox' | 'Amazon' | 'Switch' | 'PS4';

export interface IPatchNote {
  title: string;
  version: string;
  type: 'beta' | 'release' | 'preview';
  date: string;
  body: string;
  id?: string;
  image?: {
    url: string;
    title: string;
  };
  platforms: Platforms[];
}

export function getPlatforms({ name }: IPatchInfo) {
  const platforms: Platforms[] = [];

  if (name.includes('Bedrock')) {
    platforms.push('All');
    return platforms;
  }

  if (name.includes('Xbox One')) platforms.push('Xbox');
  if (name.includes('Android')) platforms.push('Android');
  if (name.includes('PS4')) platforms.push('PS4');
  if (name.includes('Switch')) platforms.push('Switch');
  if (name.includes('iOS')) platforms.push('iOS');
  if (name.includes('Amazon')) platforms.push('Amazon');
  if (name.includes('Windows 10') || name.includes('Windows')) platforms.push('Windows');

  if (platforms.length === 0) platforms.push('All');
  return platforms;
}

export function getProperDate(date: string) {
  let newDate = new Date(date.replace(/(th|rd|st|nd)/g, '')).toJSON();
  if (newDate == null) {
    return '';
  }

  newDate = newDate.substring(0, newDate.indexOf('T'));
  let day = `${Number(newDate.substring(newDate.lastIndexOf('-') + 1)) + 1}`;
  if (day.length === 1) day = '0' + day;
  newDate = newDate.substring(0, newDate.lastIndexOf('-')) + '-' + day;
  return newDate;
}

export async function tryGetDateFromMCWiki(version: string, isBeta: boolean) {
  let ver = version;
  if (ver.includes('/')) {
    ver = version.substring(0, version.indexOf('/'));
  }

  const dateRegex = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*<b>.+<\/b>)).+(?=([\s\n]*<\/p>[\s\n]*<\/td>[\s\n]*<\/tr>))/g;
  const dateRegex1 = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*)).+(?=([\s\n]*<\/p>[\s\n]*<\/td>[\s\n]*<\/tr>))/g;
  const dateRegex2 = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*<b>.+<\/b>)).+(?=([\s\n]*<br\s*\/?\s*>[\s\n]*<b>))/g;

  const html = await (await fetch('https://minecraft.fandom.com/wiki/Bedrock_Edition_' + (isBeta ? 'beta_' : '') + ver)).text();

  const dateMatch = html.match(dateRegex);

  let date = '';

  if (dateMatch) {
    date = getProperDate(dateMatch[0]);
    if (date !== '') return date;
  }

  const dateMatch1 = html.match(dateRegex1);

  if (dateMatch1) {
    date = getProperDate(dateMatch1[0]);
    if (date !== '') return date;
  }

  const dateMatch2 = html.match(dateRegex2);

  if (dateMatch2) {
    date = getProperDate(dateMatch2[0]);
  }

  return date;
}

export async function fetchImageToBase64SquaredImage(url: string) {
  const data = await (await fetch(url)).arrayBuffer();

  let img = (await decode(new Uint8Array(data))) as Image;

  while (img.height / 2 > 240 && img.width / 2 > 240) {
    img = img.resize(img.width / 2, img.height / 2);
  }

  const size = img.width > img.height ? img.height : img.width;

  const square = img.crop(img.width / 2 - size / 2, img.height - size, size, size);

  const squareData = await square.encode(3);

  function Uint8ToString(u8a: any) {
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
      c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join('');
  }

  return btoa(Uint8ToString(squareData));
}

export async function fetchImageDownloadToSquaredImage(url: string, version: string) {
  const data = await (await fetch(url)).arrayBuffer();

  let img = (await decode(new Uint8Array(data))) as Image;

  while (img.height / 2 > 240 && img.width / 2 > 240) {
    img = img.resize(img.width / 2, img.height / 2);
  }

  const size = img.width > img.height ? img.height : img.width;
  const square = img.crop(img.width / 2 - size / 2, img.height - size, size, size);

  const squareData = await square.encode(3);

  let ver = version;
  if (ver.includes('/')) {
    ver = version.substring(0, version.indexOf('/'));
  }

  Deno.writeFileSync('out/images/mcbugrock_' + ver + '.png', squareData);
}

export function getArgs() {
  let numPages = 1;
  let tryHeaderImage = false;
  let tryHeaderImageBase64 = false;
  let tryHeaderImageGen = false;
  let releases = false;
  let betas = false;

  if (Deno.args.includes('--pages')) {
    const num = Deno.args[Deno.args.indexOf('--pages') + 1];
    if (num !== undefined && Number(num) > 0) {
      numPages = Number(num);
    }
  }
  if (Deno.args.includes('--tryHeaderImage')) {
    tryHeaderImage = true;
  } else if (Deno.args.includes('--tryHeaderImageBase64')) {
    tryHeaderImageBase64 = true;
  } else if (Deno.args.includes('--tryHeaderImageGen')) {
    tryHeaderImageGen = true;
  }

  if (Deno.args.includes('--releases')) {
    releases = true;
  }

  if (Deno.args.includes('--betas')) {
    betas = true;
  }

  return {
    releases,
    betas,
    numPages,
    tryHeaderImage,
    tryHeaderImageBase64,
    tryHeaderImageGen
  };
}

async function fetchBetaPreviewPageForList(page: number): Promise<IPatchInfo[]> {
  const html = await (await fetch(`${baseBetaPreviewChangesUrl}?page=${page}`)).text();

  const linkRegex = /<a href="\/hc\/en-us\/articles\/[0-9a-zA-Z-"= ]+>.+<\/a>/g;
  const hrefRegex = /(?!(href="))\/hc\/[a-zA-Z0-9-/]+(?=")/g;
  const nameRegex = /(?<=("\s*>)).+(?=<\/a>)/g;
  const versionRegex = /(?<=(-\s*))[0-9./]+/g;

  const list: IPatchInfo[] = [];

  let match: RegExpExecArray | null = null;
  while ((match = linkRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(hrefRegex);
    const nameMatch = match[0].match(nameRegex);

    if (hrefMatch && nameMatch) {
      const versionMatch = nameMatch[0].match(versionRegex);

      let type = 'Preview';
      if (nameMatch[0].includes('Beta') && nameMatch[0].includes('Preview')) {
        type = 'Preview & Beta';
      } else if (nameMatch[0].includes('Beta')) {
        type = 'Beta';
      } else if (nameMatch[0].includes('Preview')) {
        type = 'Preview';
      }

      if (versionMatch) {
        list.push({ name: nameMatch[0], type: type as any, version: versionMatch[0], link: `${baseFeedbackUrl}${hrefMatch[0]}` });
      }
    }
  }

  return list;
}

async function generateBetaPreviewPatchNote(info: IPatchInfo, tryHeaderImage: boolean, tryHeaderImageBase64: boolean, tryHeaderImageGen: boolean): Promise<IPatchNote | null> {
  const bodyRegex = /(?<=(<div\s*class="article-body">))(.|\n)+(?=(<\/div>[ \n]*<div\s*class="article-attachments">))/g;
  const dateRegex = /(?<=(<p>.+<\/strong>)).+(?=<\/p>)/g;
  const dateHtmlRegex = /<p><strong>Posted:\s*<\/strong>.+<\/p>/g;
  const dateSupHtmlRegex = /<sup>.+<\/sup>\s*&nbsp;/g;
  const alinkRegex = /<a\s*href=".+">.+<\/a>/g;
  const imgSrc = /(?!(<img src="))\/hc\/.+(?=("\s*(alt=".+)))/g;
  const headerImgSrc = /(?!(<p class="wysiwyg-text-align-center"><img\s*src="))\/hc\/.+(?=("\s*alt=".+"><\/p>))/g;

  const html = await (await fetch(info.link)).text();
  const bodyMatch = html.match(bodyRegex);

  if (bodyMatch) {
    const name = (info.type === 'Preview & Beta' ? 'Minecraft ' : 'Minecraft: Bedrock Edition ') + info.version + ' ' + info.type;

    let body = bodyMatch[0];

    let date = '';

    body = body.replace(dateHtmlRegex, (a) => {
      const dMatch = a.match(dateRegex);
      if (dMatch) {
        date = getProperDate(dMatch[0].replace(dateSupHtmlRegex, ''));
      }

      return '';
    });

    body = body.replace(alinkRegex, (l) => {
      const newL = l.substring(0, l.indexOf('href')) + ' target="_blank" rel="noopener noreferrer" ' + l.substring(l.indexOf('href'));
      return newL.replace(/ {2,}/g, ' ');
    });

    body = body.replace(imgSrc, (src) => {
      return baseFeedbackUrl + src;
    });

    body = body.replaceAll('\u2019', "'");
    body = body.replaceAll('\u2018', "'");
    body = body.replaceAll('\u2013', '-');
    body = body.replaceAll('\u202f', '');
    date = date.trim();

    if (date === '') {
      date = await tryGetDateFromMCWiki(info.version, true);
    }

    const headerImg = body.match(headerImgSrc);

    let image: undefined | { url: string; title: string };

    if (headerImg && tryHeaderImage) {
      image = {
        url: baseFeedbackUrl + headerImg[0],
        title: name
      };
    } else if (headerImg && tryHeaderImageBase64) {
      image = {
        url: await fetchImageToBase64SquaredImage(baseFeedbackUrl + headerImg[0]),
        title: name
      };
    } else if (headerImg && tryHeaderImageGen) {
      Deno.mkdirSync('out/images', { recursive: true });

      await fetchImageDownloadToSquaredImage(baseFeedbackUrl + headerImg[0], info.version);

      image = {
        url: '%PATCH_NOTES_IMAGES%/images/mcbugrock_' + info.version + '.png',
        title: name
      };
    }

    return {
      title: name,
      type: info.type === 'Beta' ? 'beta' : 'preview',
      version: info.version,
      date: date,
      image,
      body: body.trim().replace(/\n/g, ''),
      platforms: getPlatforms(info)
    };
  }

  return null;
}

export async function generateBetaPreviewPatchNotes(pages: number = 1, tryHeaderImage: boolean, tryHeaderImageBase64: boolean, tryHeaderImageGen: boolean) {
  const entries: IPatchNote[] = [];

  const list: IPatchInfo[] = [];

  for (let page = 1; page <= pages; page++) {
    list.push(...(await fetchBetaPreviewPageForList(page)));
  }

  for (const item of list) {
    const patch = await generateBetaPreviewPatchNote(item, tryHeaderImage, tryHeaderImageBase64, tryHeaderImageGen);
    if (patch !== null) {
      entries.push(patch);
    }
  }

  if (entries.length > 0) {
    const ids = await getRandomStrings(entries.length);
    for (let i = 0; i < ids.length; i++) {
      entries[i].id = ids[i];
    }
  }

  return entries;
}

async function fetchReleasePageForList(page: number): Promise<IPatchInfo[]> {
  const html = await (await fetch(`${baseReleaseChangesUrl}?page=${page}`)).text();
  const linkRegex = /<a href="\/hc\/en-us\/articles\/[0-9a-zA-Z-"= ]+>.+<\/a>/g;
  const nameRegex = /(?<=("\s*>)).+(?=<\/a>)/g;
  const hrefRegex = /(?!(href="))\/hc\/[a-zA-Z0-9-/]+(?=")/g;
  const versionRegex = /(?<=(-\s*))[0-9./]+/g;

  const list: IPatchInfo[] = [];

  let match: RegExpExecArray | null = null;
  while ((match = linkRegex.exec(html)) !== null) {
    const hrefMatch = match[0].match(hrefRegex);
    const nameMatch = match[0].match(nameRegex);

    if (hrefMatch && nameMatch) {
      const name = nameMatch[0];
      const versionMatch = nameMatch[0].match(versionRegex);

      if (!(name.includes('Bedrock') || name.includes('Switch') || name.includes('Amazon') || name.includes('PS4') || name.includes('PlayStation') || name.includes('iOS') || name.includes('Windows') || name.includes('Android'))) {
        continue;
      }

      if (versionMatch) {
        list.push({ name: nameMatch[0], type: 'Release', version: versionMatch[0], link: `${baseFeedbackUrl}${hrefMatch[0]}` });
      }
    }
  }

  return list;
}

async function generateReleasePatchNote(info: IPatchInfo, tryHeaderImage: boolean, tryHeaderImageBase64: boolean, tryHeaderImageGen: boolean): Promise<IPatchNote | null> {
  const bodyRegex = /(?<=(<div\s*class="article-body">))(.|\n)+(?=(<\/div>[ \n]*<div\s*class="article-attachments">))/g;
  const alinkRegex = /<a\s*href=".+">.+<\/a>/g;
  const dateRegex = /(?<=(<p>.+<\/strong>)).+(?=<\/p>)/g;
  const dateHtmlRegex = /<p><strong>Posted:\s*<\/strong>.+<\/p>/g;
  const dateSupHtmlRegex = /<sup>.+<\/sup>\s*&nbsp;/g;
  const imgSrc = /(?!(<img src="))\/hc\/.+\.png(?=("\s*(alt=".+")?>))/g;
  const headerImgSrc = /(?!(<p class="wysiwyg-text-align-center"><img\s*src="))\/hc\/.+(?=("\s*alt=".+"><\/p>))/g;

  const html = await (await fetch(info.link)).text();
  const bodyMatch = html.match(bodyRegex);

  if (bodyMatch) {
    let body = bodyMatch[0];
    const name = 'Minecraft: Bedrock Edition ' + info.version;

    let date = '';

    body = body.replace(dateHtmlRegex, (a) => {
      const dMatch = a.match(dateRegex);
      if (dMatch) {
        date = getProperDate(dMatch[0].replace(dateSupHtmlRegex, ''));
      }

      return '';
    });

    body = body.replace(alinkRegex, (l) => {
      const newL = l.substring(0, l.indexOf('href')) + ' target="_blank" rel="noopener noreferrer" ' + l.substring(l.indexOf('href'));
      return newL.replace(/ {2,}/g, ' ');
    });

    body = body.replace(imgSrc, (src) => {
      return baseFeedbackUrl + src;
    });

    body;

    body = body.replaceAll('\u2019', "'");
    body = body.replaceAll('\u2018', "'");
    body = body.replaceAll('\u2013', '-');
    body = body.replaceAll('\u202f', '');

    date = date.trim();

    if (date === '') {
      date = await tryGetDateFromMCWiki(info.version, false);
    }

    let image: undefined | { url: string; title: string };

    const headerImg = body.match(headerImgSrc);

    if (headerImg && tryHeaderImage) {
      image = {
        url: baseFeedbackUrl + headerImg[0],
        title: name
      };
    } else if (headerImg && tryHeaderImageBase64) {
      image = {
        url: await fetchImageToBase64SquaredImage(baseFeedbackUrl + headerImg[0]),
        title: name
      };
    } else if (headerImg && tryHeaderImageGen) {
      Deno.mkdirSync('out/images', { recursive: true });

      await fetchImageDownloadToSquaredImage(baseFeedbackUrl + headerImg[0], info.version);

      image = {
        url: '%PATCH_NOTES_IMAGES%/images/mcbugrock_' + info.version + '.png',
        title: name
      };
    }

    return {
      title: name,
      type: 'release',
      version: info.version,
      date: date,
      image,
      body: body.trim().replace(/\n/g, ''),
      platforms: getPlatforms(info)
    };
  }

  return null;
}

export async function generateReleasePatchNotes(pages: number = 1, tryHeaderImage: boolean, tryHeaderImageBase64: boolean, tryHeaderImageGen: boolean) {
  const entries: IPatchNote[] = [];

  const list: IPatchInfo[] = [];

  for (let page = 1; page <= pages; page++) {
    list.push(...(await fetchReleasePageForList(page)));
  }

  for (const item of list) {
    const patch = await generateReleasePatchNote(item, tryHeaderImage, tryHeaderImageBase64, tryHeaderImageGen);
    if (patch !== null) {
      entries.push(patch);
    }
  }

  const officialBugrockPatchNotes: { version: string; image: { url: string; title: string } }[] = (await (await fetch('https://launchercontent.mojang.com/bedrockPatchNotes.json')).json()).entries;

  if (entries.length > 0) {
    const ids = await getRandomStrings(entries.length);
    for (let i = 0; i < ids.length; i++) {
      entries[i].id = ids[i];

      const off = officialBugrockPatchNotes.find((p) => p.version === entries[i].version);

      if (off) {
        entries[i].image = {
          url: 'https://launchercontent.mojang.com' + off.image.url,
          title: entries[i].title
        };
      }
    }
  }

  return entries;
}
