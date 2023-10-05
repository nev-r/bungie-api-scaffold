bungie api react scaffold/template/tutorial/whatever

easy steps:
- clone, or download & unzip, this repo
- `npm install`
- configure your `BUNGIE_APP_INFO` in `vite.config.ts`
- optionally, configure your app for OAuth at https://www.bungie.net/en/Application
  - OAuth Client Type
    - Public or Confidential. Confidential preferred.
  - Redirect URL
    - `https://localhost:5173/`   by default
  - Scope
    - Read your Destiny 2 information
  - Origin Header
    - `https://localhost:5173`   by default
- `npm run dev`

<hr/>

from scratch steps:
- `npm create vite@latest`
  - give it a name
  - React
  - Typescript
- `cd` to your new app directory
-  `npm install @d2api/httpclient @d2api/manifest-react @d2api/manifest-web @d2api/oauth-react @types/node @vitejs/plugin-basic-ssl bungie-api-ts`
- add this to `src/vite-env.d.ts`  
```ts
declare const BUNGIE_APP_INFO: {
  api_key: string;
  client_id: string;
  client_secret: string;
};
```
- set `isolatedModules` to `false` in `tsconfig.json`
- overwrite `src/App.tsx` with the one in this repo
- configure your `BUNGIE_APP_INFO` in `vite.config.ts`
- optionally, configure your app for OAuth at https://www.bungie.net/en/Application
  - OAuth Client Type
    - Public or Confidential. Confidential preferred.
  - Redirect URL
    - `https://localhost:5173/`   by default
  - Scope
    - Read your Destiny 2 information
  - Origin Header
    - `https://localhost:5173`   by default
- `npm run dev`

original vite README below:

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
