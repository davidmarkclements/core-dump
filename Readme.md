# core-dump

Generate node core dumps with having to abort, regardless of ulimit -c setting

## OS

Linux only.

## Install

Global install

```
npm i -g core-dump
```

Install into a project

```
npm i --save core-dump
```

## Enabling core-dump for a process

If `core-dump` is only installed globally, execute `core-dump`
in a command substitution context (e.g. backticks or dollar brackets)
as it is passed to the `-r` flag

```
node -r $(core-dump) my-app.js
node -r `core-dump` my-app.js
```

If it's a local module, then we can pass the module as-is to the `-r` flag:

```
node -r core-dump my-app.js
```

### `--core-dump-on-sigint`

```
node -r `core-dump` --core-dump-on-sigint
```

Most commonly, SIGINT is sent to a process on CTRL+C. Enabling this flag
will cause core file generation on CTRL+C or if some other process sends
the SIGINT signal. 

### `--no-core-dump-on-uncaught-exception`

```
node -r `core-dump` --core-dump-on-uncaught-exception
```

By default a core file will be generated on uncaught exception, 
use this flag to disable that behaviour. This might be handy
if app level code or another lib is listening for
`uncaughtException` event (... inadvisable, but there's always... 
exceptions). 


### Enabling core-dump hooks programatically

If locally installed, we can also require `core-dump` and call the `setup` function

```js
//note: options object optional, supplied values here are defaults:
require('core-dump').setup({
  'core-dump-on-sighup': false,
  'core-dump-on-uncaught-exception': true
})
```

For programmatically generating core dumps on the fly, see [Getting a core file programatically](https://github.com/davidmarkclements/core-dump#getting-a-core-file-programatically)


## Getting a core file from command line

First we need the PID of the process. `core-dump` keeps a list of 
PIDs of node processes have loaded `core-dump` on initialization:

```sh
$ core-dump 
pid    name  cmd
-----  ----  ------------------------------------------------------
16002  node  node -r /usr/local/lib/node_modules/core-dump my-app.js

core-dump <pid> [--all] [--list] [--abort]
```

To generate a core dump without the process exiting we simply pass
the PID to `core-dump`:

```sh
core-dump 16002
```

We should now have a file called `core` in our folder. 

For analysing core files, check out [autopsy](http://npmjs.com/autopsy)

### --all

We could also generate core files for *all* processes that have
core-dump enabled, simply run

```
$ core-dump --all
```

### `--abort`

If we wish want the process to die after taking a core dump we
can pass the `--abort` flag.

```sh
$ core-dump 16002 --abort
```

## Getting a core file programatically

Here's a contrived example where a core is generated every 1000 HTTP requests:

```js
var http = require('http')
var core = require('core-dump')
var count = 0

http.createServer(function (req, res) {
  count += 1
  if (count%1000 === 0) core('core-' + count)
  res.end('ok ' + count)
}).listen(8080)
```

There are more interesting applications. For instance if we can determine
CPU saturation by our process and generate a core file at around 90% capacity
it may help us to determine the causes behind CPU thrashing. Same approach
could be applied to memory leaks.

## Warning - Core Generation is Synchronous

If the core file is not generated synchronously execution context can change
whilst it is being generated resulting in inconsistent core dumps. Therefore
generating a core-dump is a synchonous operation - which means it will block
an event loop. The bigger a stack (and other context) the longer it takes
to generate. This means that using it in production on every 1000 requests
is only a good idea if there is time sensitive load balance switching infrastructure,
or where traffic is merely being duplicated for profiling purposes. 

## Auto Core Dumps

Common signals that are described in POSIX docs as core generators file will 
automatically have a core file generated. 

Signals with auto core dumps are: 

* SIGHUP
* SIGQUIT
* SIGABRT
* SIGTERM

If a core-dump enabled process receives one of these signals it will generate
a core file after the pattern `<SIGNAME>.core`, e.g. `SIGTERM.core`. 

Similarly, if uncaught exception auto core dumps are enabled they will have the pattern
`uncaught-exception.core`.


## Debug

For both running the CLI or enabling core-dump for a process, simply set a
`DEBUG` environment variable to `core-dump`: 

```sh
$ DEBUG=core-dump core-dump 16002
```

```sh
$ DEBUG=core-dump node -r `core-dump` my-app.js
```

## SIGTRAP

We use the SIGTRAP signal to generate a core file *without* shutting
down the process. This is actually an abuse as SIGTRAP is supposed to
close the process. However, since there is *no* signal that simultaneously
generates a core file and doesn't cause a process exit we chose SIGTRAP
because it's generally only used in debuggers (e.g. `gdp`).

## Using `kill`

We don't *have* to use the `core-dump` CLI, it's more for convenience. 
As long as core-dump is required into the process a signal can be sent
to that process with `kill` to generate a core file:

```sh
kill -s SIGTRAP <pid>
```

And to core dump and exit:

```sh
kill -s SIGABRT <pid>
```



