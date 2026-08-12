// Next ondersteunt deze mock expliciet via NEXT_FONT_GOOGLE_MOCKED_RESPONSES. CI hoeft daardoor
// niet van fonts.googleapis.com/fonts.gstatic.com afhankelijk te zijn; productie gebruikt deze
// variabele niet en blijft de echte fonts tijdens de build zelf hosten.
const css = `/* latin */
@font-face {
  font-family: 'CI Google Font Mock';
  font-style: normal;
  font-weight: 100 900;
  src: url(ci-font-mock.woff2) format('woff2');
}`;

module.exports = new Proxy({}, { get: () => css });
