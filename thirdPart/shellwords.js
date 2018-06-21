
/*
http://austingroupbugs.net/view.php?id=249


NB: this note has been revised following the 2015-08-20 conference call:

The following is a complete replacement for the Desired Action to
be taken to resolve this issue. It is based on other notes in this
bug report, numerous e-mail messages on the austin-group-l
alias, and discussions held during Austin Group conference calls:

In XCU section 2.2 (Quoting) change:
        "The various quoting mechanisms are the escape character,
        single-quotes, and double-quotes."
on P2298, L72359 to:
        "The various quoting mechanisms are the escape character,
        single-quotes, double-quotes, and dollar-single-quotes."

Add the following new paragraph to XCU section 2.2.3 (Double-Quotes)
after P2298, L72385 (indented to the same level as the paragraph
on L72382-72385):
        "The <dollar-sign> shall not retain its special meaning
        introducing the dollar-single-quotes form of quoting (see
        [xref to 2.2.4])."

In XCU 2.2.3 (Double-Quotes) change:
        "A single-quoted or double-quoted string that begins, but
        does not end, within the "‘...‘" sequence"
on P2299, L72392-72393 to:
        "A quoted (single-quoted, double-quoted, or dollar-single-quoted)
        string that begins, but does not end, within the "‘...‘"
        sequence"

At the end of XCU section 2.2 after P2299, L72401 add a new subsection,
with this text:
   2.2.4 Dollar-Single-Quotes
        A sequence of characters starting with a <dollar-sign>
        immediately followed by a single-quote ($') shall preserve
        the literal value of all characters up to an unescaped
        terminating single-quote ('), with the exception of certain
        backslash escape sequences, as follows:
                \" yields a <quotation-mark> (double-quote) character.
                \' yields an <apostrophe> (single-quote) character.
                \\ yields a <backslash> character.
                \a yields an <alert> character.
                \b yields a <backspace> character.
                \e yields an <ESC> character.
                \f yields a <form-feed>> character.
                \n yields a <newline> character.
                \r yields a <carriage-return> character.
                \t yields a <tab> character.
                \v yields a <vertical-tab> character.
                \cX yields the control character listed in the Value
                       column of Table 4.21 on page 3203 (xref to
                       XCU Table 4.21) in the Operands section of
                       the stty utility when X is one of the
                       characters listed in the ^c column of the
                       same table, except that \c\\ yields the
                       <FS> control character since the <backslash>
                       character must be escaped.
               \uXXXX yields the character specified by ISO/IEC 10646
                       where XXXX is two to four hexadecimal digits (with leading
                       zeros supplied for missing digits) whose four-digit short
                       universal character name is XXXX (and whose eight-digit
                       short universal character name is 0000XXXX).
               \UXXXXXXXX yields the character specified by ISO/IEC 10646 where
                       XXXXXXXX is two to eight hexadecimal digits (with
                       leading zeros supplied for missing digits) whose
                       eight-digit short universal character name is XXXXXXXX.
                \xXX yields the byte whose value is the hexadecimal
                       value XX (one or two hex digits)
                \XXX yields the byte whose value is the octal value XXX
                       (one to three octal digits)

        If a \xXX or \XXX escape sequence yields a byte whose value is 0,
        it is unspecified whether that nul byte is included in the result
        or if that byte and any following regular characters and escape
        sequences up to the terminating unescaped single-quote are evaluated
        and discarded.

        If a universal character name specified by \uXXXX or  \UXXXXXXXX is
        less than 0020 (<space>), the results are undefined.

        If more than two hexadecimal digits immediately follow \x or
        if the octal value specified by \XXX will not fit in a byte, the
        results are unspecified.

        If a backslash is followed by any sequence not listed above
        or if \e, \cX, \uXXXX, or \UXXXXXXXX yields a character
        that is not present in the current locale, the result is
        implementation-defined.

        If a backslash escape sequence represents a single-quote
        character (for example \u0060, \U00000060, or \'), that
        sequence shall not terminate the dollar-single-quote
        sequence.
*/

module.exports = function(s) {
  s = s.trim();
  s = s + ' ';

  const arr_ = [];
  const ret = [];

  var expectWord = true;
  var closeChar = '';
  var expand = false;

  var escapedChar = ''; // 用来标记下一个字符是不是escaped char

  for(var i = 0; i < s.length; i++) {
    var char = s[i];
    if(escapedChar) {
      escapedChar = '';
      arr_.push(char);
      continue;
    } else if(char === '\\') {
      escapedChar = char;
    }

    if(expectWord) {
      expectWord = false;
      if(char === "'" || char === '"') {
        closeChar = char;
        continue;
      } else if(char === '$') {
        expectWord = true;
        expand = true;
        continue; 
        /*
        注意：这里 $'' 的含义是一种 quoting，会对字符串中的blackslash转义
        echo $'aaa\nbbb'
        echo 'aaa\nbbb'
        */
      }
    }

    if(closeChar === char) {
      closeChar = '';
      continue;
    }


    arr_.push(char);


    if(closeChar) continue;

    if(char === ' ') {
      arr_.pop();
      let sub_ = arr_.join(''); while(arr_.pop());
      if(expand) {
        sub_ = sub_.replace(/\\./g, function($1) {
          switch($1[1]) {
            case 'r': return '\r';
            case 'n': return '\n';
            case 'b': return '\x08';
            case 'f': return '\x0c';
            case 't': return '\x09';
            case 'u':
            case 'x': return $1;
            default: return $1[1];
          }
        });
      }
      ret.push(sub_);
      expectWord = true;
    }
  }

  if(escapedChar) throw new Error('unclosed escaped char');
  return ret;
}