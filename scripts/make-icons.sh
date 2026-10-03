#!/usr/bin/env bash
# Regenerates the PNG app icons from SVG. Requires ImageMagick (with an SVG delegate).
set -euo pipefail
cd "$(dirname "$0")/../public/icons"

art() { # $1 = transform for the 64x64 jug illustration
cat <<SVG
  <g transform="$1" stroke="#3B2E28" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M44 27h4.5a6 6 0 0 1 6 6v9a6 6 0 0 1-6 6H44" fill="none" stroke-width="3.2"/>
    <rect x="12" y="20" width="33" height="37" rx="5" fill="#F7C548"/>
    <path d="M18 30v18" stroke="#FCE3A0" stroke-width="3"/>
    <path d="M10.5 23.5c-1.6-4.8 2.4-9.3 7-8 1.7-4.6 9-6 12-1.5 3-3.6 10.6-2.6 11.2 3 4.4.4 5.6 6.5 1.6 8.1-1 .4-30.6.9-31.8-1.6z" fill="#FFFDF7"/>
    <ellipse cx="15.7" cy="40.6" rx="2.3" ry="1.3" fill="#F08C83" opacity=".55" stroke="none"/>
    <ellipse cx="41.3" cy="40.6" rx="2.3" ry="1.3" fill="#F08C83" opacity=".55" stroke="none"/>
    <circle cx="23.9" cy="38" r="1.55" fill="#3B2E28" stroke="none"/>
    <circle cx="33.1" cy="38" r="1.55" fill="#3B2E28" stroke="none"/>
    <path d="M26.3 40.6q2.2 2 4.4 0" fill="none" stroke-width="1.8"/>
  </g>
SVG
}

cat > icon.svg <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="116" fill="#F6F1E9" stroke="none"/>
  <circle cx="256" cy="262" r="178" fill="#FBE3B0" stroke="none"/>
$(art "translate(64 58) scale(6.1)")
</svg>
SVG

cat > maskable.svg <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FBE3B0" stroke="none"/>
$(art "translate(107 101) scale(4.7)")
</svg>
SVG

# Full-bleed square for iOS (it applies its own mask)
cat > apple.svg <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#F6F1E9" stroke="none"/>
  <circle cx="256" cy="262" r="190" fill="#FBE3B0" stroke="none"/>
$(art "translate(72 64) scale(5.85)")
</svg>
SVG

render() { convert -background none -density 384 "$1" -resize "$2x$2" "$3"; }
render icon.svg 192 icon-192.png
render icon.svg 512 icon-512.png
render maskable.svg 512 icon-maskable-512.png
render apple.svg 180 apple-touch-icon.png
rm maskable.svg apple.svg
