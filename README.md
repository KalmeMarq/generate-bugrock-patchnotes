# Generate Minecraft Bugrock Patch Notes from MC Feedback Website
Deno is required.

### Generate Only Previews and Betas versions
```
deno task generateBeta
```

### Generate Only Release versions
```
deno task generateRelease
```

### Args
```--pages``` is an optional arg that can be used to specify how many pages from each version type (Beta/Preview or Official).

Example:
```
deno task generateBeta --pages 3
```

```--tryHeaderImage``` is an optional arg that tries to get the image from the header of the changelog if present and use it has the patch note image. This arg exists because the image won't be a square as the official ones. **Note: If a version exists in the official bugrock patch notes file, it will use the image from there.**

```--tryHeaderImageBase64``` is an optional arg. Unlike ```--tryHeaderImage```, this will try to crop the header image, if present, into a square and then encode the image to base64. It can create some very long base64 so be careful.

```--tryHeaderImageGen``` is an optional arg. Unlike ```--tryHeaderImage``` and ```--tryHeaderImageBase64```, this will try to generate images from the header image, if present, to a folder and add an placeholder image url to the patch note. You can, for example, put that images folder into a github repo and replace the placecholder text with the repo url.

### Output patch note file

```
{
  entries: {
    id: string;
    title: string;
    type: 'release' | 'beta';
    image?: {
      url: string;
      title: string;
    };
    version: string;
    date: string;
    body: string;
    platforms: ('All' | 'Windows' | 'iOS' | 'Android' | 'Xbox' | 'Amazon' | 'Switch' | 'PS4')[];
  }[]
}
```