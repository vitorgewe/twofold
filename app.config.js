// app.json stays the single source of truth (release-please edits its version); this only chooses
// the web output.
//
// `expo export` runs with NODE_ENV=production and must be static: only the static export writes the
// cross-origin isolation headers from the expo-router plugin into dist/_expo/.routes.json, which is
// what EAS Hosting reads (ADR-0018). The dev server keeps `single`, because static server rendering
// of expo-sqlite's web worker fails there (ADR-0015).
module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, output: process.env.NODE_ENV === 'production' ? 'static' : 'single' },
});
