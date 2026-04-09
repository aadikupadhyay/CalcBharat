const fs = require('fs');
let content = fs.readFileSync('src/data/tools.js', 'utf8');

// The pattern: </p>\` followed by random strings (including ' or " or words) until we hit }, or '} or "}
// Since we only want to target the ones that got messed up by batch_all.js, their garbage always occurs RIGHT AFTER </p>\`
// We can find all instances of "</p>\`", and if they are immediately followed by characters other than "}" or ",", we truncate until "}"

let count = 0;
let index = content.indexOf('evolve over time.</p>\`');
while (index !== -1) {
  const endMarker = 'evolve over time.</p>\`';
  const matchEnd = index + endMarker.length;
  
  // Find where the object ends (usually '}, or "}, or just })
  let nextBrace = content.indexOf('}', matchEnd);
  if (nextBrace !== -1) {
    // Look at the text between matchEnd and nextBrace
    let interveningText = content.substring(matchEnd, nextBrace);
    // If there is garbage like "s a weekend drive..." meaning intervening text has alphabets
    if (/[a-zA-Z]/.test(interveningText)) {
      // We cut out the intervening text
      content = content.substring(0, matchEnd) + content.substring(nextBrace);
      count++;
    }
  }
  index = content.indexOf('evolve over time.</p>\`', matchEnd);
}

fs.writeFileSync('src/data/tools.js', content, 'utf8');
console.log('Cleaned up ' + count + ' broken tools!');
