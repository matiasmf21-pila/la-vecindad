const sharp = require('sharp');

const makeIcon = (size, radius) => {
  const house = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#1e3a5f"/>
      <g transform="scale(${size/100})">
        <rect x="28" y="45" width="22" height="28" rx="2" fill="#4a90d9"/>
        <polygon points="14,48 53,48 39,28" fill="#7ab3e8"/>
        <rect x="12" y="55" width="18" height="18" rx="2" fill="#4a90d9"/>
        <polygon points="3,58 30,58 21,42" fill="#5ba3e0"/>
        <rect x="55" y="45" width="22" height="28" rx="2" fill="#4a90d9"/>
        <polygon points="44,48 78,48 66,28" fill="#7ab3e8"/>
        <rect x="34" y="58" width="8" height="15" fill="#1e3a5f"/>
        <rect x="60" y="53" width="9" height="10" rx="1" fill="#a8d4f5"/>
        <rect x="15" y="61" width="7" height="12" fill="#1e3a5f"/>
      </g>
    </svg>`;
  return Buffer.from(house);
};

sharp(makeIcon(192, 40)).resize(192, 192).png().toFile('public/icon-192.png', e => console.log('192:', e || 'ok'));
sharp(makeIcon(512, 100)).resize(512, 512).png().toFile('public/icon-512.png', e => console.log('512:', e || 'ok'));