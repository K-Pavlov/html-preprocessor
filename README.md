## A small HTML preprocessor for generating static sites

- Uses plain old JavaScript and a few simple template tags
- Partial HTML files can be imported with ##import("path/to/file"). ##import also can accept an object as a second parameter - the template scope. Must be valid JSON - ##import("path/to/file", {"key": "myValue", "key2": 5 })
- Variables from the scope object can be rendered with the "@: :@" template tag
- Expressions (arbitrary javascript) can be executed with "@= =@" template tag.
  - In the expression you have access to the scope variables and an import function (can be used to import a file / partial).
  - Whatever the expression returns will be rendered.
  - Both "variables" and "import" can be accessed through the "this" keyword (this.variables; this.import)
  - The "import" function accepts two arguments - a path to to the file that should be imported and a scope object
  - The expression "@= =@" can be viewed as a function body, as it is just a scoped eval

## Usage

node preprocessor.js path/to/input.html path/to/output.html

## Usage with the demos

node ./dist/preprocessor.js demos/index.html ../result.html
