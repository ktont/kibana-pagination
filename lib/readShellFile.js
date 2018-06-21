var fs = require('fs');

function _readTextFile(fname) {
  if(!fs.existsSync(fname)) return null;
  var cont = fs.readFileSync(fname, 'utf8');
  var sp = cont.trim().split('\n');
  for(var i = 0; i < sp.length; i++) {
    var line = sp[i].trim();
    if(!line) continue;
    if(line[0] !== '#') return line;
  }
  return null;
}


module.exports = function(fname) {
  if(process.stdin.isTTY) {
    if(!fs.existsSync(fname)) return null;
    if(/^curl /.test(fname)) return fname;
    return _readTextFile(fname);
  }
  var cont = fs.readFileSync(0, 'utf8').replace(/\\\n/g, '');
  return cont;
}
