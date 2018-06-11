# Notes

Bug fixes are documented as being part of the "next release" but are made immediately available in the patch releases.


# Releases

#### 1.0.0 (Not released yet)
 - Switches `--watch` behavior to build all files before watching. Can be disabled with `--skip-initial` flag.

#### 0.1.0 (Next Minor release)
 - Features
     - [#9](https://github.com/michaelwayman/node-sass-chokidar/issues/9) add support for node 8 thanks to @anmonteiro
 - Bug fixes
    - [#5](https://github.com/michaelwayman/node-sass-chokidar/issues/5) where an error is raised when no input files are detected.
    - [#10](https://github.com/michaelwayman/node-sass-chokidar/issues/10) issue with `--watch` where changes to imported scss files from outside watch directory/file don't trigger rebuild

#### 0.0.1
First release
