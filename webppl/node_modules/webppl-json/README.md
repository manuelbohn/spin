# webppl-json

This package provides two functions `json.read` and `json.write` for reading and writing JSON files:

    // Read data:
    var testData = json.read('data/test-file.json');
    
    // Write data:
    json.write('data/test-file-copy.json', testData);

## Installation

To globally install `webppl-json`, run:

    mkdir -p ~/.webppl
    npm install --prefix ~/.webppl webppl-json

This may print warnings (`npm WARN ENOENT`...) which can be ignored.

To upgrade to the latest version, run:

    npm install --prefix ~/.webppl webppl-json --force

## Usage

Once installed, you can make `json.read` and `json.write` available to `program.wppl` by running:

    webppl program.wppl --require webppl-json

## Testing

Run the included test using:

    webppl test.wppl --require .

## License

MIT
