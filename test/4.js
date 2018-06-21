var fs = require('fs');

var s = fs.readFileSync('./1.txt', 'utf8');

s = s.trim();
s = s + ' ';

var arr_ = [];
var expectWord = true;
var closeChar = '';
for(var i = 0; i < s.length; i++) {
  let char = s[i];

  if(expectWord) {
    expectWord = false;
    if(char === "'" || char === '"') {
      closeChar = char;
      continue;
    } else if(char === '$') {
      expectWord = true;
      continue; //注意：这里$的含义是不对后面的内容转义
    }
  }

  if(closeChar === char) {
    closeChar = '';
    continue
  }


  arr_.push(char);


  if(closeChar) continue

  if(char === ' ') {
    console.log('wwwwwwwwww', arr_.join(''));
    arr_ = [];
    expectWord = true;
  }
  
  //console.log(char);
}
