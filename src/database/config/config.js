require('ts-node').register({ transpileOnly: true });
const path = require('path');
const config = require(path.resolve(__dirname, 'config.ts'));
module.exports = config;
