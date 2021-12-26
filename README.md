# Course Editor

*Warning: This is experimental and in alpha. Dragons ahead.*

## Description

A frontend to edit course content (i.e. a bunch of text files) and then "submit" it by saving to IPFS, and then posting on Hive (TODO).

Tasklist:

- [x] Integrate with [BrowserFS](https://github.com/jvilk/BrowserFS)
- [x] Multitab editor and save
- [x] Show directory tree
- [ ] Add/rename/remove file/folder
- [ ] Publish to IPFS
- [ ] Post to Hive

## Issues

- BrowserFS doesn't seems to support `rm` yet (it has `rmdir`, but only works on empty dir)
- Change to streaming mode for large files?
