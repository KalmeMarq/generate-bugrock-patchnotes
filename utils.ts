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

type Platforms = 'Windows' | 'All' | 'iOS' | 'Android' | 'Xbox' | 'Amazon' | 'Switch' | 'PS4';

export interface IPatchNote {
  title: string;
  version: string;
  date: string;
  body: string;
  id?: string;
  platforms: Platforms[];
}

export function getPlatforms({ name }: IPatchInfo) {
  const platforms: Platforms[] = [];

  if (name.includes('Bedrock')) {
    platforms.push('All');
    return platforms;
  }

  if (name.includes('Xbox One')) {
    platforms.push('Xbox');
  }

  if (name.includes('Android')) {
    platforms.push('Android');
  }

  if (name.includes('PS4')) {
    platforms.push('PS4');
  }

  if (name.includes('Switch')) {
    platforms.push('Switch');
  }

  if (name.includes('iOS')) {
    platforms.push('iOS');
  }

  if (name.includes('Amazon')) {
    platforms.push('Amazon');
  }

  if (name.includes('Windows 10') || name.includes('Windows')) {
    platforms.push('Windows');
  }

  if (platforms.length === 0) {
    platforms.push('All');
  }

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
