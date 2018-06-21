exports.istty = function() {
  switch(process.stdout.constructor.name) {
    case 'SyncWriteStream':
      // redirect
      return false;
    case 'WriteStream':
      // output
      return true;
    case 'Socket':
      // pipe
      return false;
    default:
      return true;
  }
}

exports.isRedirect = function() {
  switch(process.stdout.constructor.name) {
    case 'SyncWriteStream':
      // redirect
      return true;
    case 'WriteStream':
      // output
      return false;
    case 'Socket':
      // pipe
      return false;
    default:
      return false;
  }
}