import cnvs from 'canvas';
import * as fs from 'fs';

cnvs.registerFont('./fonts/now.bold.otf', { family: 'Now' });

const canvas = cnvs.createCanvas(1428, 2000);
const ctx = canvas.getContext('2d');

const invitationImg = await cnvs.loadImage('../invitation.png');
ctx.drawImage(invitationImg, 0, 0, canvas.width, canvas.height);

// ctx.strokeStyle = '#52644e';

ctx.font = '32px "Now"';
ctx.fillStyle = '#52644e';
const textContent = "DEAR TANYA, CHRIS & SAACHI";
const textWidth = ctx.measureText(textContent).width;
ctx.fillText(textContent, (canvas.width - textWidth) / 2, 530);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./result.png', buffer);

