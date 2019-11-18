// regular JS goes here

var fs = require('fs');

function streamQueryCSV(path, header) {
  var handle;
  var sampleCount = 0;

  function append(data) {
    fs.appendFileSync(handle, data);
  };

  return {
    sample(obj) {
      if (handle === undefined) {
        handle = fs.openSync(path, 'ax');
        append(header + '\n');
        // append('[');
      }
      _.map(_.keys(obj.value), function(v){
        append(sampleCount + ','+ v + ',' + obj.value[v] + ',' + obj.score + '\n');
      })
      sampleCount += 1;
      // append(JSON.stringify({value: obj.value, score: obj.score}));
    },
    finish() {
      // append(']');
      fs.closeSync(handle);
    }
  };
}

module.exports = {
  streamQueryCSV: streamQueryCSV
};
