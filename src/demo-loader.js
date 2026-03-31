'use strict';

const path = require('path');
const fs = require('fs');

async function loadDemo(name) {
  const demoDir = path.join(__dirname, '..', 'demo');
  const demoFile = path.join(demoDir, `${name}.js`);

  if (!fs.existsSync(demoFile)) {
    throw new Error(`Demo '${name}' not found. Available demos: mythos`);
  }

  return require(demoFile);
}

module.exports = { loadDemo };
