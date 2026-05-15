/**
 * marp.config.js — build settings for the UniGE D3.js module decks
 *
 * Usage (run from this folder):
 *   marp lecture1.md            ->  lecture1.html
 *   marp lecture1.md --pdf      ->  lecture1.pdf
 *   marp -p -w lecture1.md      ->  live preview while editing
 *
 * Install Marp CLI once:
 *   npm install -g @marp-team/marp-cli
 */
module.exports = {
  // allow the inline <svg> / <div class="columns"> illustrations in the slides
  html: true,
  // register the custom course theme (referenced as `theme: unige` in front-matter)
  themeSet: ['./themes/unige.css'],
  // let the deck reference local files (e.g. data/) when exporting to PDF
  allowLocalFiles: true,
};
