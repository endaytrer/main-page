# main-page: Blog Server

> License: GPL 3.0


## Setup

You need `make`, `docker-compose`, `cargo`, `wasm-pack` to build the system.

```bash
mkdir -p client/modules
(cd client && make all)
mkdir -p blogs data sites
docker compose up
```


## Upload blog

You should specify your license, title, and may specify some tags in **first 10 lines** like this:

```markdown
# This is *title*

> License: this is *license*

> Tags: this, is some, tags
```

The order of title, license and tags **does not matter**, but only the **first** line of either title, license and tags are considered valid.

The title of the article is `This is *title*`, the license is `this is *license*`, and tags are
`this`, `is some`, `tags`.

Every image should be placed inside the `blogs` folder, and use relative reference. They should not be end with `.md`.