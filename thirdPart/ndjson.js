
function _prettyJSON(str, n) {
  var space = [];
  while(n--) space.push(' ');
  space = space.join('');
  var sp_ = str.split('\n');
  for(var i = 1; i < sp_.length; i++) {
    sp_[i] = space + sp_[i];
  }
  return sp_.join('\n');
}

function ndjsonStringify(lst) {
  return lst.map(x => JSON.stringify(x)).join('\n')+'\n';
}

exports.parse = function(str, n = 0) {
  str = str.replace(/\\./g, function($1) {
    switch($1[1]) {
      case 'r': return '\r';
      case 'n': return '\n';
      case 'b': return '\x08';
      case 'f': return '\x0c';
      case 't': return '\x09';
      default: return $1[1];
    }
  });
  str = str.trim();
  var sp = str.split('\n');
  sp = sp.map((x, i) =>  {
    let j = JSON.parse(x);
    if(i === 1) delete j.highlight;   //不高亮
    return j;
  });
  sp = JSON.stringify(sp, null, 2);
  return _prettyJSON(sp, n);
}

exports.stringify = ndjsonStringify;