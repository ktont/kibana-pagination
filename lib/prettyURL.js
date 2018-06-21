const {URLSearchParams} = require('url');

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
  if(L <= 0) return {url: "'"+url_+"'"};
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

  if(len < 3) return {url: "'"+url_+"'"};

  var query = {}, query__;

  LL = url_.substr(0, L);
  RR = url_.substr(R);

  //console.log('RRRRRRRRRRR', RR)

  query_.forEach((v, k) => {
    query[k] = v;
  });

  query__ = JSON.stringify(query, null, 2);
  query__ = _prettyJSON(query__, 2);

  return {
    url: '`'+LL+'${query_}'+RR+'`',
    query: 'queryStringify('+query__+')',
  };
}

function queryStringify(param) {
  return new url.URLSearchParams(param).toString()
}

exports.parse = prettyURL;
exports.stringify = queryStringify;
