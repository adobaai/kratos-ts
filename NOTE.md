# Note

## Commands

```sh
pnpm pack
pnpm version patch
```

## No package-lock.json

DeepSeek:

If you're developing a library (not an application),
you might choose not to include package-lock.json
because the library's dependencies will be resolved by the parent project.
However, this is a matter of debate, and many still recommend including it for consistency.

- https://github.com/mui/material-ui/tree/master/packages/mui-system
- https://github.com/prisma/prisma/tree/main/packages/adapter-neon
