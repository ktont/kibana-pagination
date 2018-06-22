const {URL, URLSearchParams} = require('url');

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
  var url = new URL(url_);
  if(!url.search) return {url: "'"+url_+"'"};
  var query = Array.from(url.searchParams);

  if(query.length <= 1) return {url: "'"+url_+"'"};

  var query__ = JSON.stringify(query, null, 2);
  query__ = _prettyJSON(query__, 2);

  return {
    url: '`'+url.origin+url.pathname+'?${query_}'+url.hash+'`',
    query: 'queryStringify('+query__+')',
  };
}

function queryStringify(param) {
  return new url.URLSearchParams(param).toString()
}

exports.parse = prettyURL;
exports.stringify = queryStringify;
