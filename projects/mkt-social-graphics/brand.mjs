// brand.mjs: real Got Moles logo SVGs, embedded unchanged.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const svgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../brand_context/rebrand/FILES/SVG');
// Logos are embedded byte-for-byte; only the XML header is dropped so they inline as <svg>.
export const svg = (name) => readFileSync(path.join(svgDir, `${name}.svg`), 'utf8').replace(/<\?xml[^>]*>\s*/, '')
  .replace(/id="Layer_1"/, '').replace(/\.cls-(\d+)/g, `.${name.replace(/\W/g, '')}-$1`).replace(/class="cls-(\d+)"/g, `class="${name.replace(/\W/g, '')}-$1"`);
export const LOGO = {
  primary: { grass: 'PRIMARY LOGO FILES-01', cream: 'PRIMARY LOGO FILES-02', blue: 'PRIMARY LOGO FILES-03', gold: 'PRIMARY LOGO FILES-04', rust: 'PRIMARY LOGO FILES-05' },
  stacked: { grass: 'SECONDARY LOGO FILES-08', cream: 'SECONDARY LOGO FILES-09', blue: 'SECONDARY LOGO FILES-10', gold: 'SECONDARY LOGO FILES-11', rust: 'SECONDARY LOGO FILES-12' },
  mark: { grass: 'LOGO MARK FILES-15', cream: 'LOGO MARK FILES-18', blue: 'LOGO MARK FILES-19', gold: 'LOGO MARK FILES-20', rust: 'LOGO MARK FILES-21' },
};
// The mark's path with its fill swapped, for the mound pattern only (the logo itself is never recolored).
export const moundPath = () => readFileSync(path.join(svgDir, 'LOGO MARK FILES-15.svg'), 'utf8').match(/<path[^>]*d="([^"]+)"/)[1];

