# main-page: Blog Server

> License: GPL 3.0


## Setup

You need `make`, `docker-compose`, `cargo`, `wasm-pack` to build the system.

```bash
./deploy.sh
```

First deployment may not be successful, since MySQL need to set up things with time exceeding 10s, which is the limit for database connection.


## Upload a blog

You should specify your license, title, and may specify some tags in **first 10 lines** like this:

```markdown
# This is *title*

> License: this is *license*
> Tags: this, is some, tags
> Password: 998244353
> Hint: a large prime number
```

The order of title, license and tags **does not matter**, but only the **first** line of either title, license and tags are considered valid.

The title of the article is `This is *title*`, the license is `this is *license*`, and tags are `this`, `is some`, `tags`.
These lines won't be displayed.

After writing the blog, put it into the `blogs` folder, and within 10 secs, it will be shown on the website.

## Supported licenses

You can specify any license, but Creative Commons licenses / public domains will be displayed as a link to CC, with canonical icons.
To be more specific, the licenses are:

- CC BY 4.0
- CC BY-NC 4.0
- CC BY-NC-ND 4.0
- CC BY-NC-SA 4.0
- CC BY-ND 4.0
- CC BY-SA 4.0
- CC0 1.0

If you want all of your rights reserved, simply don't specify any license, and an "all rights reserved" disclaimer will appear on top of the article.

## Secret blogs

If a blog is **both** placed in `secret_blogs` folder, and has a `> Password: ***` on the first 10 lines of the article, it will be considered a secret blog.
Only the people who have the password you specified can access the blog.

Note: the assets used by secret blogs now can only be placed in the normal `blogs` folder for access, and they **are not protected**.

You can set up a password hint.

If you are curious, secret blogs placed in `blogs` **cannot be accessed normally** even if the password is correct, but can be accesses by sending a request **without needing a password**.
Blogs without a password that placed in `secret_blogs` folder cannot be accessed.

**Disclaimer:** the encryption technology used here is somewhat low-level. Please don't put sensative information on it.

## Maintain the blogs

Every image (including the images used by the secret blogs) should be placed inside the `blogs` folder, and use relative reference. They should not be end with `.md`.
