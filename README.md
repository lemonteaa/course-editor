# Course Editor

*Warning: This is experimental and in alpha. Dragons ahead.*

## Description

A frontend to edit course content (i.e. a bunch of text files) and then "submit" it by saving to IPFS, and then posting on Hive (TODO).

Tasklist:

- [x] Integrate with [BrowserFS](https://github.com/jvilk/BrowserFS)
- [x] Multitab editor and save
- [x] Show directory tree
- [ ] Add/rename/remove file/folder
- [x] Publish to IPFS
- [ ] Post to Hive

## Usage

Lots of caveat at this moment, but the gist is:
- During development, start on an unused port (use your own `.env` file with `PORT=<RANDOM PORT NUM>`) so that the localStorage is empty - be prepared to clear it completely during testing.
- Press "Test" to load file into the tree view. This will also create a `/welcome` folder - do not create files/folder outside of it as it will trip up the ipfs submission process.
- Then create files/folder as usual and edit/save as needed.
- When ready, press "Publish to IPFS". Wait until you see the CID.
- Check it on public IPFS gateway such as [fleek](https://ipfs.fleek.co/ipfs/). (`https://ipfs.fleek.co/ipfs/<CID>/<Optional path>`)

## Issues

- BrowserFS doesn't seems to support `rm` yet (it has `rmdir`, but only works on empty dir)
- Change to streaming mode for large files?
- Currently we haven't really handled the BrowserFS's init's async nature yet.
