Local Admin (Decap/Netlify CMS)

Quick steps to run the local admin and see previews locally:

1) Install dependencies:

```powershell
npm install
```

2) Start Eleventy dev server (site available at http://localhost:8080):

```powershell
npm run dev
```

3) In a separate terminal start the CMS proxy (provides a local git backend for /admin):

```powershell
npm run cms
# or
npx netlify-cms-proxy-server
```

4) Open the admin UI at http://localhost:8080/admin/ and edit content. The proxy server lets the admin save changes locally (when using `local_backend: true`).

Notes:
- Uploaded images are saved to `src/assets/img/uploads` and will be available under `/assets/img/uploads/` on the site.
- After saving in the admin, Eleventy should pick up data changes and rebuild automatically (if `npm run dev` is running).
- If the admin cannot save, check the proxy output for errors and ensure `local_backend: true` is present in `src/admin/config.yml`.
