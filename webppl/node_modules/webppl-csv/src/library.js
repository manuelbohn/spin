var fs = require('fs');
var Papa = require('papaparse');

var writeDistTable = function(erp, header, filename) {
 var supp = erp.support();
 var csvFile = fs.openSync(filename, 'w');
 fs.writeSync(csvFile, header + ',prob\n')
 supp.forEach(function(s) {supportWriter(s, Math.exp(erp.score(s)), csvFile);})
 fs.closeSync(csvFile);
};

var supportWriter = function(s, p, handle) {
 var sLst = _.toPairs(s);
 var l = sLst.length;
 for (var i = 0; i < l; i++) {
   fs.writeSync(handle, sLst[i].join(',')+','+p+'\n');
 }
};

function readCSV(filename){
  return Papa.parse(fs.readFileSync(filename, 'utf8')).data;
};

function writeCSV(jsonCSV, filename){
  fs.writeFileSync(filename, Papa.unparse(jsonCSV) + "\n");
};

// for more manual file writing control
var openFile = function(filename) {
 var csvFile = fs.openSync(filename, 'w');
 return csvFile
};

var writeLine = function(line, handle){
  fs.writeSync(handle, line+'\n');
};

var writeMarginals = function(erp, filename) {
  var handle = openFile(filename);
  var supp = erp.support();
  supp.forEach(
    function(s) {
      supportWriter(s, Math.exp(erp.score(s)), handle);
    }
  )
  closeFile(handle);
};

var writeJoint = function(erp, filename) {
  var handle = openFile(filename);
  var supp = erp.support();
   _.isObject(supp[0]) ?
   writeLine([_.keys(supp[0]),"prob"].join(','),
 handle) :
   null

   supp.forEach(function(s) {
     writeLine([
       _.values(s),
       Math.exp(erp.score(s))
     ].join(','), handle
     );
   })
   closeFile(handle);
};

var closeFile = function(handle){
 fs.closeSync(handle);
};

module.exports = {
  readCSV: readCSV,
  writeCSV: writeCSV,
  writeMarginals:writeMarginals,
  writeJoint: writeJoint,
  openFile: openFile,
  closeFile: closeFile,
  writeLine: writeLine,
  writeDistTable: writeDistTable
};
