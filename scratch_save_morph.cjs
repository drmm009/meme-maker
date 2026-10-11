const fs = require('fs');
const content = fs.readFileSync('C:/Users/jigar/.gemini/antigravity/brain/fb19d6e7-cd20-4cde-b1ca-f7b9048f87bf/.system_generated/steps/10322/output.txt', 'utf8');
const prefix = 'data:image/jpeg;base64,';
const start = content.indexOf(prefix);
if (start !== -1) {
  const end = content.indexOf('"', start);
  const base64 = content.slice(start + prefix.length, end !== -1 ? end : content.length);
  const buf = Buffer.from(base64, 'base64');
  fs.writeFileSync('C:/Users/jigar/.gemini/antigravity/brain/fb19d6e7-cd20-4cde-b1ca-f7b9048f87bf/roll_safe_perfect.jpg', buf);
  console.log('Saved roll safe perfect image successfully, size:', buf.length);
} else {
  console.log('Prefix not found');
}
