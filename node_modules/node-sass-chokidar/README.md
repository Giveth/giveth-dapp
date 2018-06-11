# node-sass-chokidar

[![Build Status](https://travis-ci.org/michaelwayman/node-sass-chokidar.svg?branch=master)](https://travis-ci.org/michaelwayman/node-sass-chokidar)

A thin wrapper around node-sass executable to use chokidar instead of Gaze when watching files.

All the functionality of the node-sass executable is still in tact, the only difference being chokidar instead of Gaze for watching files.

Why? Because Gaze in docker and various virtual machines uses a lot of resources whereas chokidar does not.
Read about the advantages of [chokidar](https://github.com/paulmillr/chokidar)

When using `node-sass --watch` in docker for mac you will get really high CPU usage with com.docker.hyperkit and com.docker.osxfs (I've seen reports of up to 300%).
The cause of this is the node-sass dependency on [Gaze](https://github.com/shama/gaze). This package fixes this issue by using chokidar with node-sass instead of Gaze.

## Usage

The exact same as the node-sass executable except:

 - the `--recursive` flag is non-configurable and always set to true.
  - why? forcing chokidar to be non-recursive is beyond the scope of this package

example:

`node-sass-chokidar src/ -o src/ --watch --recursive`


## Contributing

Feel free.
