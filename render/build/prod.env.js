'use strict'
let params=process.argv.splice(2);
let HOST = params[0] || 'prod';
let VERSION=params[1]|| '1.0.0';

console.log(params);
module.exports = {
  NODE_ENV: '"production"',
  HOST: '"'+HOST+'"',
  VERSION:'"'+VERSION+'"'
}
