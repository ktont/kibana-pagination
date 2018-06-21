#!/usr/bin/env node

var fs = require('fs');
var prettyBash = require('./lib/pretty.js');
var prettyURL = require('./lib/prettyURL.js');
var binaryString = require('./lib/binaryString.js');
var readShellFile = require('./lib/readShellFile.js');
var kibanaPagination = require('./lib/kibanaPagination.js');
var misc = require('./lib/misc.js');
var parseCurl = require('./thirdPart/parse-curl.js');
var cookieModule = require('./thirdPart/cookie.js');
var ndjson = require('./thirdPart/ndjson.js');
var datejs = require('./lib/date.js');

function Usage() {
  console.error(`
  Usage: kibana-pagination ./req.sh
`);
  process.exit(1);
}

function _validateTimeout(n) {
  if(n == null) Usage();
  n = Number(n);
  if(isNaN(n)) Usage();
  return n;
}

function _validateRetry(n) {
  if(n == null) Usage();
  n = Number(n);
  if(isNaN(n)) Usage();
  if(n < 0 || n > 100) Usage();
  return n;
}

function _validateOutput(fname) {
  if(!fname) Usage();
  if(fname[0] == '-') Usage();
  return fname;
}

function _parseArgv() {
  var _ = [];
  var args_ = process.argv.slice(2);
  var type = 'javascript';
  var timeout = 30000;
  var retry = 3;
  var output = '';

  for(var i = 0; i < args_.length; i++) {
    let a = args_[i];
    switch(a) {
      case '--timeout':
        timeout = _validateTimeout(args_[++i]);
        break;
      case '--retry':
        retry = _validateRetry(args_[++i]);
        break;
      case '--output':
      case '-o':
        output = _validateOutput(args_[++i]);
        break;
      case '--version':
      case '-v':
        console.log('kibana-pagination', require('./package.json').version);
        console.log('Features: retry, timeout, javascript')
        process.exit(0);
      default:
        _.push(a);
        break;
    }
  }
  return [
    type, 
    _[0], 
    timeout, 
    retry,
    output
  ];
}

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

function _prettyArray(sp_, n) {
  var space = [];
  while(n--) space.push(' ');
  space = space.join('');
  for(var i = 1; i < sp_.length; i++) {
    sp_[i] = space + sp_[i];
  }
}

function _parseCurl(curl) {
  var origin_ = parseCurl(curl);
  if(!origin_) Usage();

  var pruned_ = JSON.parse(JSON.stringify(origin_));

  if(pruned_.headers['content-type']) {
    pruned_.headers['Content-Type'] = pruned_.headers['content-type'];
    delete pruned_.headers['content-type'];
  }
  
  if(pruned_.body != null && !pruned_.headers['Content-Type']) {
    pruned_.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  delete pruned_.headers["Accept-Encoding"];

  if(!Object.keys(pruned_.headers).length) {
    delete pruned_.headers;
  }

  pruned_["encoding"] = null;

  return [pruned_, origin_];
}

function _getLogOrder(body) {
  body = JSON.parse(body);
  if(!body.length || !body[1]) return 'desc';
  var sort = body[1].sort;
  for(var i=0;i<sort.length;i++) {
    var x = sort[i];
    if(x["@timestamp"] && x["@timestamp"].order.toLowerCase() === "asc")
      return 'asc';
  }
  return 'desc';
}

///////////////////////////////////main////////////////////////////////
///////////////////////////////////////////////////////////////////////
var [
  outputType, 
  curl, 
  timeoutParam,
  retryParam,
  outputParam,
] = _parseArgv();

var queryLogOrder = false;

curl = readShellFile(curl);
if(!curl) {
  console.error('no input');
  process.exit(1);
}

if(outputType == 'bash') {
  console.log();
  console.log(prettyBash(curl));
  console.log();
  process.exit(0);
}

var [pruned_, origin_] = _parseCurl(curl);

var additionVariable = [];
var additionRequire = [];
var additionFunction = [];
var additionParams = {};

additionFunction.push(datejs.localtime.toString());
additionFunction.push(kibanaPagination.toString());

var str_ = JSON.stringify(pruned_, null, 2);

str_ = str_.replace(/"url": "(.*)",?/, function(_, $1) {
  if($1.length < 22) {
    return `"url": "${$1}",`;
  }

  var u = prettyURL.parse($1);
  if(u.query) {
    additionRequire.push("const url = require('url');");
    additionFunction.push(prettyURL.stringify.toString());
    additionVariable.push(`var query_ = ${u.query};`);
    additionVariable.push(`var url_ = ${u.url};`);
  } else {
    additionVariable.push(`var url_ = ${u.url};`);
  }
  return '"url": url_,';
});

str_ = str_.replace(/"Cookie": "(.*)",?/, function(_, $1) {
  if($1.length > 50) {
    let c = cookieModule.parse($1);
    c = JSON.stringify(c, null, 2);
    c = _prettyJSON(c, 2);
    additionFunction.push(cookieModule.stringify.toString());
    additionVariable.push(`var cookie_ = cookieStringify(${c});`);
    return '"Cookie": cookie_,';
  } else {
    additionVariable.push(`var cookie_ = "${$1}";`);
    return '"Cookie": cookie_,';
  }
});

str_ = str_.replace(/"body": "(.*)",?/, function(_, $1) {
  if($1.length < 5) {
    return `"body": "${$1}",`;
  }

  const contype = pruned_.headers["Content-Type"];
  const hasUserContype = !!(origin_.headers["Content-Type"] || 
                            origin_.headers['content-type']);

  if(contype.startsWith('application/x-www-form-urlencoded') &&
     hasUserContype) {
    let b = require('querystring').parse($1);
    b = JSON.stringify(b, null, 2);
    b = _prettyJSON(b, 2);
    additionRequire.push("const querystring = require('querystring');");
    additionVariable.push(`var body_ = querystring.stringify(${b});`);
  } else if(contype.startsWith('application/x-ndjson')) {
    let b = ndjson.parse($1, 2);

    queryLogOrder = _getLogOrder(b);

    b = b.replace(/"query": "(.*)",?/, (_, qry) => {
      additionParams.query = binaryString.reduce(qry);
      return `"query": params.query,`;
    });
    b = b.replace(/"gte": ([0-9]+),?/, (_, qry) => {
      additionParams.gte = Number(qry);
      return `"gte": params.gte,`;
    });
    b = b.replace(/"lte": ([0-9]+),?/, (_, qry) => {
      additionParams.lte = Number(qry);
      return `"lte": params.lte,`;
    });
    additionFunction.push(ndjson.stringify.toString());
    additionVariable.push(`var body_ = ndjsonStringify(${b});`);
  } else if(contype.startsWith('application/json')) {
    let b = JSON.parse(binaryString.reduce($1));
    b = JSON.stringify(b, null, 2);
    b = _prettyJSON(b, 2);
    additionVariable.push(`var body_ = JSON.stringify(${b});`);
  } else {
    // 猜测是json
    let b;
    try {
      if($1[0] !== '{' || $1[$1.length-1] !== '}') throw 'break';
      b = JSON.parse(binaryString.reduce($1));
      if(Object.keys(b).length < 1) throw 'break';
      b = JSON.stringify(b, null, 2);
      b = _prettyJSON(b, 2);
      b=`JSON.stringify(${b})`;
    } catch(e) {
      b = '"'+$1+'"';
    }
    additionVariable.push(`var body_ = ${b};`);
  }
  return '"body": body_,';
});

additionVariable.push(`var opt_ = ${_prettyJSON(str_, 2)};`);
_prettyArray(additionVariable, 2);

function renderBody() {

  let additionParams_ = JSON.stringify(additionParams, null, 2);
  additionParams_ = _prettyJSON(additionParams_, 2);
  additionParams_ = additionParams_.replace(/"query": "(.*)",?/, (_, a) => {
    let singleF = additionParams.query.includes("'");
    let doubleF = additionParams.query.includes('"');
    //console.warn(a, singleF, doubleF);
    if(singleF && doubleF) {
      return `query: "${a}",`;
    } else if(singleF) {
      return `query: "${additionParams.query}",`;
    } else if(doubleF) {
      return `query: '${additionParams.query}',`;
    } else {
      return `query: '${additionParams.query}',`;
    }
  });
  //console.warn(additionParams_);
  additionParams_ = additionParams_.replace(/"gte": ([0-9]+),?/, (_, a) => {
    return `gte: new Date('${datejs.localtime(Number(a))}').getTime(),`;
  });
  additionParams_ = additionParams_.replace(/"lte": ([0-9]+),?/, (_, a) => {
    return `lte: new Date('${datejs.localtime(Number(a))}').getTime(),`;
  });
return `function curlas(params) {
  ${additionVariable.join('\n')}
  return new Promise((resolve, reject) => {` + (timeoutParam ? 
`
    var tm = setTimeout(reject, ${timeoutParam}, new Error('timeout'));` : '') +
`
    request(opt_, (err, res, buff) => {` + (timeoutParam ? 
`
      clearTimeout(tm);` : '') +
`
      if(err) return reject(err);
      if(res.statusCode !== 200) {
        return reject(new Error('statusCode'+res.statusCode));
      }
      return resolve({
        header: res.headers,
        body: buff
      });
    });
  });
}
${additionFunction.length ? '\n'+additionFunction.join('\n\n')+'\n' : ''}
module.exports = function(params) {
  const params_ = ${additionParams_};
  return kibanaPagination(Object.assign({
    order: '${queryLogOrder}',
    curlas,
    getLine: (x) => {
      //your code here
      if(x._source.loginfo) x._source.loginfo = JSON.parse(x._source.loginfo);
      if(x._source.message) delete x._source.message;
      let str = JSON.stringify(x, null, 4);
      console.log(str);
      // return 'break'; //will break data stream
    }
  }, params_))
  .then(n => {
    //your code here
    return n;
  })
};
`;

}

function renderFooter() {
  if(misc.isRedirect() || outputParam) {
return `if(require.main === module) {
  module.exports()
  .then((n) => {
    console.log('count '+n);
  })
  .catch(console.error)
}
`
  } else {
return `module.exports()
.then((n) => {
  console.log('count '+n);
})
.catch(console.error)
`
  }
}

function render() {
  const body = renderBody();
  const footer = renderFooter();

return `const request = require('request');
${additionRequire.length ? additionRequire.join('\n')+'\n' : ''}
${body}
${footer}
`;

}


if(outputParam) {
  fs.writeFileSync(outputParam, render());
} else {
  process.stdout.write(render());
}
