Kekule.js JS file compressor
===================================

This application is a simple JavaScript compressor for Kekule.js source files.
It is helpful to build custom JS/CSS min files of the whole toolkit.
You may run the application in the following command line:

```
node run.js -m module1,module2,... -e excludeModule1,excludeModule2,... -d destinationPath --minifier=minifierName
```

where the -d arg appoint the output path and the -m arg limits the modules needed to be outputted.
If this arg is not set, all modules of Kekule.js will be compressed and outputted.

For example, the following command line will compress files related to ```io``` and ```widget``` module
and output them in ```../dist``` directory:

```
node run.js -m io,widget -d ../dist
```

To generate all min js files in default path, just call:

```
node run.js
```

The JavaScript minifier can also be set by --minifier argument of command line. Currently ```terser``` (default one)
and ```gcc``` (Google closure compiler) are available. For example, the following line will generate all min js files
with the gcc minifier:

```
node run.js --minifier gcc
```

