const {URLSearchParams} = require('url');

var url_ = 'https://www.google.com/search?ei=TTffWo7NK4_Q8wXjwq0w&q=hello&oq=hello&gs_l=psy-ab.3..0i203k1j0j0i203k1l8.25848.26796.0.27832.5.5.0.0.0.0.202.403.2-2.2.0....0...1.1j4.64.psy-ab..3.2.403...0i12k1.0.ONRKE2sIAYg';
var url_ = 'baidu.com?a=1&b=2&c=4%2C5#sss';


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

function prettyURL(url_) {
  var R, L, RR, LL, query_;

  L = url_.indexOf('?');
  if(L <= 0) return "'"+url_+"'";
  L++;
  R = url_.indexOf('#', L);
  R = R <= 0 ? url_.length : R;
  n = R - L;

  query_ = url_.substr(L, n);

  query_ = new URLSearchParams(query_);

  var len = 0;
  query_.forEach((v, k) => {
    len++;
  });

  if(len < 3) return "'"+url_+"'";

  var query = {}, query__;

  LL = url_.substr(0, L);
  RR = url_.substr(R);

  console.log('RRRRRRRRRRR', RR)

  query_.forEach((v, k) => {
    query[k] = v;
  });

  query__ = JSON.stringify(query, null, 2);
  query__ = _prettyJSON(query__, 2+LL.length);

  return '`'+
         LL+
         '${queryStringify('+query__+')}'+
         RR+
         '`';
}
// for(var k of query_.keys()) {
//   console.log(k, query_.get(k));
// }

console.log(prettyURL(url_));

/*
process.exit(0);
, new URLSearchParams(query_)
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

query_ = url.parse(url_, true).query_;
var out;

if(Object.keys(query_).length >= 1) {
  L = url_.indexOf('#', R);

  LL = L <= 0 ? '' : url_.substr(L);
  RR = url_.substr(0, R+1);

  out = JSON.stringify(query_, null, 2);
  out = _prettyJSON(out, 2);
  console.log(out)
  console.log('`'+RR+'${urlSearchStringify('+out+')}'+LL+'`');
} else {
  out = url_;
}

function queryStringify(param) {
  return new url.URLSearchParams(param).toString()
}

*/


