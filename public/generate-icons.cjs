const sharp = require('sharp');

const svg192 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="40" fill="#1e3a5f"/><rect x="96" y="60" width="60" height="50" rx="4" fill="#4a90d9"/><polygon points="76,80 156,80 116,45" fill="#7ab3e8"/><rect x="56" y="85" width="45" height="55" rx="4" fill="#4a90d9"/><polygon points="36,105 101,105 78.5,72" fill="#7ab3e8"/><rect x="68" y="110" width="16" height="30" fill="#1e3a5f"/><rect x="105" y="108" width="18" height="20" rx="2" fill="#a8d4f5"/></svg>');

const svg512 = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="100" fill="#1e3a5f"/><rect x="256" y="155" width="160" height="135" rx="8" fill="#4a90d9"/><polygon points="196,210 416,210 306,118" fill="#7ab3e8"/><rect x="136" y="222" width="125" height="150" rx="8" fill="#4a90d9"/><polygon points="76,280 261,280 168.5,188" fill="#7ab3e8"/><rect x="172" y="292" width="44" height="80" fill="#1e3a5f"/><rect x="278" y="285" width="50" height="55" rx="4" fill="#a8d4f5"/></svg>');

sharp(svg192).resize(192, 192).png().toFile('icon-192.png', (e) => console.log('192:', e || 'ok'));
sharp(svg512).resize(512, 512).png().toFile('icon-512.png', (e) => console.log('512:', e || 'ok'));