
module.exports = async function kibanaPagination(params) {
  var expectTotal = null;
  var off = 0;
  var time = params.order == 'desc' ? params.lte : params.gte;

  var _condition = function(list_, callback) {
    if(!callback) return true;
    for(var i=0;i<list_.length;i++) {
      var x = list_[i];
      if(callback(x) === 'break')
        return false;
    }
    return true;
  }
  var _gettime = function(item) {
    return item.sort ? item.sort[0] :
           item._source ? item._source.timestamp :
           null;
  }

  while(true) {
    var time_ = params.order == 'desc' ? {lte: time} : {gte: time};
    var root_ = await params.curlas(Object.assign(params, time_));
    root_ = JSON.parse(root_.body.toString());
    if(!root_.responses ||
       !root_.responses[0] ||
       !root_.responses[0].hits ||
       (root_.responses[0].hits.total == null)) throw new Error('unkown ret');

    root_ = root_.responses[0].hits;

    if(expectTotal == null) {
      expectTotal = root_.total;
    }

    var list_ = root_.hits;
    
    off += list_.length;

    if(off >= expectTotal) {
      _condition(list_, params.getLine);
      break;
    }

    if(list_.length < 10) {
      throw new Error('pagination only 10, impossible')
    }

    var max__ = _gettime(list_[0]);
    var min__ = _gettime(list_[list_.length-1]);

    if(!max__ || !min__) {
      console.error('not found timestamp');
      break;
    }

    var timeMax_ = new Date(max__).getTime();
    var timeMin_ = new Date(min__).getTime();

    if(timeMax_ === timeMin_) {
      throw new Error('log-data dense');
    }

    list_ = list_.filter(x => {
      if(_gettime(x) === timeMin_) {
        off--;
        return false;
      } else {
        return true;
      }
    });

    if(!_condition(list_, params.getLine)) break;

    time = timeMin_;
  }

  return off;
}

if(require.main === module) {
  module.exports({
    gte: new Date('2018-05-07 00:00:00.000').getTime(),
    lte: new Date('2018-05-07 00:00:03.999').getTime(),
    curlas: require('../test.js'),
    getLine: (x) => {
      //console.log('111111111', x);
    }
  })
  .then(console.log)
  .catch(console.error);
}
