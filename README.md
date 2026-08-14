# BlossomPot.com

E-commerce platform (full stack) based on the blossompot.com / hr-ecom architecture, including storefront and admin portal.

## Packages

- `@blossompot/web` — Next.js storefront + admin (`/admin`)
- `@blossompot/api` — AWS Lambda / local API
- `@blossompot/shared` — shared schemas and libs

## Local development

```bash
npm ci
npm run build -w @blossompot/shared
npm run dev:all
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin
- API: http://localhost:3001 (or as configured)

## Notes

This repository is a full functional copy of the hr-ecom platform (including admin). Branding and catalog can be switched to BlossomPot content without removing admin features.
