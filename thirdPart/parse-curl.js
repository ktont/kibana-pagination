var shellwords = require('./shellwords.js')

// TODO -F, --form
// TODO --data-urlencode
// TODO -r, --range

/**
 * Attempt to parse the given curl string.
 */

module.exports = exports.default = function(s) {
  if (0 != s.indexOf('curl ')) return;
  var words = shellwords(s);
  var args = rewrite(words);
  var out = { method: 'GET', headers: {} };
  var state = '';


  args.forEach(function(arg) {
    switch (true) {
      case isURL(arg):
        out.url = arg
        break;

      case arg == '-A' || arg == '--user-agent':
        state = 'user-agent'
        break;

      case arg == '-H' || arg == '--header':
        state = 'header'
        break;

      case arg == '-d' || arg == '--data' || arg == '--data-ascii':
        state = 'data'
        break;

      case arg == '--data-binary':
        state = 'data-binary'
        break;

      case arg == '-u' || arg == '--user':
        state = 'user'
        break;

      case arg == '-I' || arg == '--head':
        out.method = 'HEAD'
        break;

      case arg == '-X' || arg == '--request':
        state = 'method'
        break;

      case arg == '-b' || arg =='--cookie':
        state = 'cookie'
        break;

      case arg == '--compressed':
        out.headers['Accept-Encoding'] = out.headers['Accept-Encoding'] || 'deflate, gzip'
        break;

      case arg != null:
        switch (state) {
          case 'header':
            var field = parseField(arg)
            out.headers[field[0]] = field[1]
            state = ''
            break;
          case 'user-agent':
            out.headers['User-Agent'] = arg
            state = ''
            break;
          case 'data':
            if (out.method == 'GET' || out.method == 'HEAD') out.method = 'POST'
            // 这里有问题，如果不是 www-encoded呢
            out.body = out.body
              ? out.body + '&' + arg
              : arg
            state = ''
            break;
          case 'data-binary':
            out.method = 'POST'
            out.body = arg;
            break;
          case 'user':
            out.headers['Authorization'] = 'Basic ' + btoa(arg)
            state = ''
            break;
          case 'method':
            out.method = arg
            state = ''
            break;
          case 'cookie':
            out.headers['Set-Cookie'] = arg
            state = ''
            break;
        }
        break;
    }
  })

  return out;
}

/**
 * Rewrite args for special cases such as -XPUT.
 */

function rewrite(args) {
  return args.reduce(function(args, a) {
    if(/-X[A-Z]+/.test(a)) {
      args.push('-X');
      args.push(a.slice(2));
    } else {
      args.push(a);
    }
    return args
  }, [])
}

/**
 * Parse header field.
 */

function parseField(s) {
  return s.split(/: (.+)/)
}

/**
 * Check if `s` looks like a url.
 */

function isURL(s) {
  // TODO: others at some point
  return /^https?:\/\//.test(s)
}
