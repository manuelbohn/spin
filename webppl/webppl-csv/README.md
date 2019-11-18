## webppl-csv

This package provides functions for reading and writing CSV files:

~~~~
// Read data:
var testData = csv.read('data/test-file.csv');

// Write data:
csv.write('data/test-file-copy.csv', testData);
~~~~

Distribution objects can be written to CSV using `csv.writeJoint` and `csv.writeMarginals`

~~~~
var myJointDistribution = Infer({model: function(){
	var a = flip(0.5)
	var b = flip(0.9)
	return {a, b}
}})

// write distribution, maintaining joint distributional information
csv.writeJoint(myJointDistribution, 'data/test-joint.csv')

// write distribution, one variable per line (marginalized)
csv.writeMarginals(myJointDistribution, 'data/test-marginals.csv')
~~~~

For more custom usage, use `csv.open`, `csv.close`, and `csv.writeLine`.

If you use the [`query.table` with MCMC](http://webppl.readthedocs.io/en/master/inference/methods.html?highlight=query#incremental-mh), try out `csv.writeDistTable`

## Installation

To globally install `webppl-csv`, run:

    mkdir -p ~/.webppl
    npm install --prefix ~/.webppl webppl-csv

This may print warnings (`npm WARN ENOENT`...) which can be ignored.

To upgrade to the latest version, run:
~~~~
npm install --prefix ~/.webppl webppl-csv --force
~~~~

## Usage

Once installed, you can make all `csv.` functions available to `program.wppl` by running:

    webppl program.wppl --require webppl-csv

## Testing

Run the included test using:

    webppl test/test.wppl --require .
