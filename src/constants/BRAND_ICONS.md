# Brand icons

`brand-icons.json` vendors the SVG Logos catalogue from
`https://cdn.jsdelivr.net/npm/@iconify-json/logos@1.2.0/icons.json`.
It contains 2,044 SVG logo variants and is minified without changing icon data.

Author: Gil Barbara and contributors (https://github.com/gilbarbara/logos).
Catalogue licence: CC0 1.0 Universal
(https://github.com/gilbarbara/logos/blob/main/LICENSE.txt).

The catalogue is bundled so rendering and name matching work offline. No API
key, runtime network request, or additional npm package is required.
`src/lib/brandIconMatcher.ts` matches names regardless of casing, spacing,
punctuation, and common plan suffixes, with explicit aliases for common names.
Unknown names retain the existing wallet icon. Logo artwork is rendered using
the project's installed `react-native-svg` package.
