import { getPlatforms, getProperDate, getRandomStrings, IPatchInfo, IPatchNote } from './utils.ts';

const baseFeedbackUrl = 'https://feedback.minecraft.net/';
const baseReleaseChangesUrl = 'https://feedback.minecraft.net/hc/en-us/sections/360001186971-Release-Changelogs';

let numPages = 1;
if (Deno.args.includes('--pages')) {
  const num = Deno.args[Deno.args.indexOf('--pages') + 1];
  if (num !== undefined && Number(num) > 0) {
    numPages = Number(num);
  }
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

async function tryGetReleaseDateFromMCWiki(version: string) {
  let ver = version;
  if (ver.includes('/')) {
    ver = version.substring(0, version.indexOf('/'));
  }

  const dateRegex = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*<b>.+<\/b>)).+(?=([\s\n]*<\/p>[\s\n]*<\/td>[\s\n]*<\/tr>))/g;
  const dateRegex1 = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*)).+(?=([\s\n]*<\/p>[\s\n]*<\/td>[\s\n]*<\/tr>))/g;
  const dateRegex2 = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*<b>.+<\/b>)).+(?=([\s\n]*<br\s*\/?\s*>[\s\n]*<b>))/g;

  const html = await (await fetch('https://minecraft.fandom.com/wiki/Bedrock_Edition_' + ver)).text();

  const dateMatch = html.match(dateRegex);

  if (dateMatch) {
    return getProperDate(dateMatch[0]);
  }

  const dateMatch1 = html.match(dateRegex1);

  if (dateMatch1) {
    return getProperDate(dateMatch1[0]);
  }

  const dateMatch2 = html.match(dateRegex2);

  if (dateMatch2) {
    return getProperDate(dateMatch2[0]);
  }

  return '';
}

async function generateReleasePatchNote(info: IPatchInfo): Promise<IPatchNote | null> {
  const bodyRegex = /(?<=(<div\s*class="article-body">))(.|\n)+(?=(<\/div>[ \n]*<div\s*class="article-attachments">))/g;
  const alinkRegex = /<a\s*href=".+">.+<\/a>/g;
  const dateRegex = /(?<=(<p>.+<\/strong>)).+(?=<\/p>)/g;
  const dateHtmlRegex = /<p><strong>Posted:\s*<\/strong>.+<\/p>/g;
  const dateSupHtmlRegex = /<sup>.+<\/sup>\s*&nbsp;/g;

  const html = await (await fetch(info.link)).text();
  const bodyMatch = html.match(bodyRegex);

  if (bodyMatch) {
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

    body = body.replaceAll('\u2019', "'");
    body = body.replaceAll('\u2018', "'");
    body = body.replaceAll('\u2013', '-');
    body = body.replaceAll('\u202f', '');

    date = date.trim();

    if (date === '') {
      date = await tryGetReleaseDateFromMCWiki(info.version);
    }

    return {
      title: 'Minecraft: Bedrock Edition ' + info.version,
      version: info.version,
      date: date,
      body: body.trim().replace(/\n/g, ''),
      platforms: getPlatforms(info)
    };
  }

  return null;
}

async function generateReleasePatchNotes() {
  const entries: IPatchNote[] = [];

  const list: IPatchInfo[] = [];

  for (let page = 1; page <= numPages; page++) {
    list.push(...(await fetchReleasePageForList(page)));
  }

  // Deno.writeTextFileSync('list.temp.json', JSON.stringify(list, null, 2));

  for (const item of list) {
    const patch = await generateReleasePatchNote(item);
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

Deno.mkdirSync('out', { recursive: true });

Deno.writeTextFileSync(
  'out/bugrockPatchNotes.json',
  JSON.stringify(
    {
      entries: await generateReleasePatchNotes()
    },
    null,
    2
  )
);
