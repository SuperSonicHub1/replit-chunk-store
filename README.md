# replit-chunk-store

[Replit Database](https://docs.replit.com/hosting/database-faq) chunk store that is [abstract-chunk-store]((https://github.com/mafintosh/abstract-chunk-store)) compliant

[![abstract chunk store](https://cdn.rawgit.com/mafintosh/abstract-chunk-store/master/badge.svg)](https://github.com/mafintosh/abstract-chunk-store)

Apparently, Replit just allows you to store Buffers in their key-value
database, so let's use it to overcome replspace filesystem limitations!
Of course, Replit DB does seem to have [some limitaitons](https://docs.replit.com/hosting/database-faq#what-limits-does-database-have),
but the ones given don't seem to apply anymore, as I've stored
*far* more than 50 MB using this module.
Infinite storage glitch, anyone?

## Docs
```js
const ReplitStorage = require("replit-chunk-store")
const store = new ReplitStorage(1024)
```

This implements the abstract-chunk-store interface quite nicely, as it's
heavily based off of [memory-chunk-store](https://github.com/mafintosh/memory-chunk-store).
There's only one difference between using this chunk store and any other:
the constructor's `opts` parameter takes one extra key, `key`, which allows one to specify the database URL they want to use instead of `process.env.REPLIT_DB_URL`.

```js
const store = new ReplitStorage(1024, {key: "https://my-repl-db.example.com/"})
// passed as: new Client(opts.key)
```

If you want to want to access the underlying client, use `store.client`.
Just make sure you haven't destroyed the store before doing so, as I set
`client` to null so that it's garbage-collected.

Man, do I love abstractions and interfaces!

## Why?
My recent project [webtorrent-server](https://github.com/SuperSonicHub1/webtorrent-server) makes use of
[WebTorrent](https://webtorrent.io/), which itself uses 
abstract-chunk-store to store pieces. I was running into issues with running
out of space on disk in replspace since WebTorrent in Node.js uses
[fs-chunk-store](https://github.com/webtorrent/fs-chunk-store) by default
and the stuff I was torrenting was large. Using memory-chunk-store wasn't
cutting it either due to repls having very little RAM. I then rememebered
that Replit comes with a database, and here we are.
