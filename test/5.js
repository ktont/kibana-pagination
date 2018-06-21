var fs = require('fs');

var curlOptionsReg = new RegExp(
  `
  -[A-Z]
  --[a-z-]+
  --ds-ipv4-addr
  --dns-ipv6-addr
  --hostpubmd5
  --http1.1
  --http2-prior-knowledge
  --http2
  -:
  --post301
  --post302
  --post303
  -#
  --proxy1.0
  --socks4
  --socks4a
  --socks5-gssapi-nec
  --socks5-gssapi-service
  --socks5-hostname
  --socks5
  --tlsv1.0
  --tlsv1.1
  --tlsv1.2
  --tlsv1.3
  `.replace(/ /g, '').trim()
  .split('\n').map( x => '(?: '+x+' )').join('|'),
  'g'
);

console.log(curlOptionsReg.toString());

var s = fs.readFileSync('./1.txt', 'utf8');

s = s.trim();
s = s + ' ';
s = s.replace(curlOptionsReg, function(mat) {
  //console.log(arguments);
  return ' \\\n'+mat.trim()+' ';
});

console.log(s);
