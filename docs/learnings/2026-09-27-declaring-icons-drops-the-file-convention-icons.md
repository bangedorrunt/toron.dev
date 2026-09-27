# Declaring `icons` in metadata drops the file-convention icons

**What happened.** The root layout declared one icon:

```ts
icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
```

while `app/apple-icon.png` sat beside it as a file convention, built into a route and
served correctly at 180×180. The head was:

```html
<link rel="manifest" href="/manifest.webmanifest"/>
<link rel="icon" href="/favicon.ico?..."/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
```

No apple touch icon, so iOS fell back to a screenshot of the page. Nothing failed, no
warning was logged, and the file was right there in the build output — which is exactly
why it survived: the icon existed, so nothing looked missing.

The cause is in `next/dist/lib/metadata/resolve-metadata.js`: the leaf segment's static
icons are merged into `resolvedMetadata.icons` **only when that field is absent**. With
`icons` declared, the convention's `apple` entry is dropped on the floor. `favicon.ico`
survives because it is special-cased and unshifted into whatever `icons` the metadata
has, which is what made the head look nearly right.

**What to do instead.** Declare the whole set in the layout — the SVG, the PNG, and the
apple touch icon — and let the convention keep providing `favicon.ico`. Then assert the
head in a browser: the link's presence *and* the file behind it (load it and read
`naturalWidth`/`naturalHeight`), because a link to a file that 404s looks the same in
the source.

**Why it is worth remembering.** This is the failure mode where the more you configure,
the less you get. `favicon.ico` arriving anyway makes the head look plausible, and the
missing piece is the one platform (iOS, and the "add to home screen" path) that most
visitors never see in a desktop test. One `icons` declaration turned a whole convention
off silently.
