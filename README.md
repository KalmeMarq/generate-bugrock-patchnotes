# Generate Minecraft Bugrock Patch Notes from MC Feedback Website
Deno is required.

## Generate Only Previews and Betas versions
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
deno task generateBetas --pages 3
```

### Output patch note file

```
{
  entries: {
    id: string;
    title: string;
    versions: string;
    date: string;
    body: string;
    platforms: ('All' | 'Windows' | 'iOS' | 'Android' | 'Xbox')[];
  }[]
}
```