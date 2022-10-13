import { generateBetaPreviewPatchNotes, generateReleasePatchNotes, getArgs, IPatchNote } from './utils.ts';

const args = getArgs();

Deno.mkdirSync('out', { recursive: true });

if (args.releases && args.betas) {
  let patchNotes: IPatchNote[] = [];
  patchNotes.push(...(await generateReleasePatchNotes(args.numPages, args.tryHeaderImage, args.tryHeaderImageBase64, args.tryHeaderImageGen)));
  patchNotes.push(...(await generateBetaPreviewPatchNotes(args.numPages, args.tryHeaderImage, args.tryHeaderImageBase64, args.tryHeaderImageGen)));
  patchNotes = patchNotes.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  Deno.writeTextFileSync('out/bugrockPatchNotes.json', JSON.stringify({ entries: patchNotes }, null, 2));
} else if (args.releases) {
  Deno.writeTextFileSync('out/bugrockReleasePatchNotes.json', JSON.stringify({ entries: await generateReleasePatchNotes(args.numPages, args.tryHeaderImage, args.tryHeaderImageBase64, args.tryHeaderImageGen) }, null, 2));
} else if (args.betas) {
  Deno.writeTextFileSync('out/bugrockBetaPatchNotes.json', JSON.stringify({ entries: await generateBetaPreviewPatchNotes(args.numPages, args.tryHeaderImage, args.tryHeaderImageBase64, args.tryHeaderImageGen) }, null, 2));
}
