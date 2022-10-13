import { getPlatforms, getProperDate, getRandomStrings, IPatchInfo, IPatchNote } from './utils.ts';

const baseFeedbackUrl = 'https://feedback.minecraft.net/';
const baseBetaPreviewChangesUrl = 'https://feedback.minecraft.net/hc/en-us/sections/360001185332-Beta-and-Preview-Information-and-Changelogs';

let numPages = 1;
if (Deno.args.includes('--pages')) {
  const num = Deno.args[Deno.args.indexOf('--pages') + 1];
  if (num !== undefined && Number(num) > 0) {
    numPages = Number(num);
  }
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

async function tryGetBetaPreviewDateFromMCWiki(version: string) {
  let ver = version;
  if (ver.includes('/')) {
    ver = version.substring(0, version.indexOf('/'));
  }

  const dateRegex = /(?<=(<th>Release\s*date[\s\n]*<\/th>[\s\n]*<td>[\s\n]*<p>[\s\n]*<b>.+<\/b>)).+(?=([\s\n]*<\/p>[\s\n]*<\/td>[\s\n]*<\/tr>))/g;
  const html = await (await fetch('https://minecraft.fandom.com/wiki/Bedrock_Edition_beta_' + ver)).text();

  const dateMatch = html.match(dateRegex);

  if (dateMatch) {
    return getProperDate(dateMatch[0]);
  }

  return '';
}

async function generateBetaPreviewPatchNote(info: IPatchInfo): Promise<IPatchNote | null> {
  const bodyRegex = /(?<=(<div\s*class="article-body">))(.|\n)+(?=(<\/div>[ \n]*<div\s*class="article-attachments">))/g;
  const dateRegex = /(?<=(<p>.+<\/strong>)).+(?=<\/p>)/g;
  const dateHtmlRegex = /<p><strong>Posted:\s*<\/strong>.+<\/p>/g;
  const dateSupHtmlRegex = /<sup>.+<\/sup>\s*&nbsp;/g;
  const alinkRegex = /<a\s*href=".+">.+<\/a>/g;

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
    date = date.trim();

    if (date === '') {
      date = await tryGetBetaPreviewDateFromMCWiki(info.version);
    }

    return {
      title: info.type === 'Preview & Beta' ? 'Minecraft ' : 'Minecraft: Bedrock Edition ' + info.version + ' ' + info.type,
      version: info.version,
      date: date,
      body: body.trim().replace(/\n/g, ''),
      platforms: getPlatforms(info)
    };
  }

  return null;
}

async function generateBetaPreviewPatchNotes() {
  const entries: IPatchNote[] = [];

  const list: IPatchInfo[] = [];

  for (let page = 1; page <= numPages; page++) {
    list.push(...(await fetchBetaPreviewPageForList(page)));
  }

  Deno.writeTextFileSync('list.temp.json', JSON.stringify(list, null, 2));

  for (const item of list) {
    const patch = await generateBetaPreviewPatchNote(item);
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
  'out/bugrockBetaPatchNotes.json',
  JSON.stringify(
    {
      entries: await generateBetaPreviewPatchNotes()
    },
    null,
    2
  )
);
