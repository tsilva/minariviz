# Catalog fonts

The catalog uses Latin WOFF2 builds of Geist 1.800 and Geist Mono 1.701 with
weights from 400 through 700. The regular Next.js Geist fonts provide extended
character coverage. Keep the Latin font files in sync if the catalog starts
using a weight outside that range.

Both local fonts are preloaded because the catalog's first screen uses sans
text and monospace counters. Extended-character fallback fonts are not preloaded.

The local files derive from the Google Fonts Latin WOFF2 files served by
MinariViz at `f41c3f7fab3f1ee8703feccefa481fa47f9764bd`. Both originals and the
modified fonts use the [SIL Open Font License](../app/fonts/OFL.txt).

| Original font | SHA-256 |
| --- | --- |
| [Geist](https://minariviz.tsilva.eu/_next/static/immutable/media/605ce01b664af129-s.p.0zr6hhvz-h9nw.woff2) | `9b6f5ff45b278c744b5f379a2c4ecbaf858a842b8eaf82ac8d21b699ca16c608` |
| [Geist Mono](https://minariviz.tsilva.eu/_next/static/immutable/media/07a39a8a4660cc7c-s.1v5bejj26fx9h.woff2) | `5f3d6ad60f29d6cb708414ec6887163d63bf197377ef5417d2483ff31ace6c3b` |

To generate an updated WOFF2 from a verified source, use FontTools
`varLib.instancer` with `wght=400:700`. Check that the character map matches the
source and that regular, medium, semibold, and bold retain their metrics.
