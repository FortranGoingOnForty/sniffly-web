# Sniffly Website Deployment Guide

## Project Structure

```
/home/espadon/src/sniffly/site/
├── src/
│   ├── layouts/       # Page layouts
│   ├── pages/         # Routes (index, downloads)
│   └── components/    # Reusable components
├── releases/          # .dmg files (not in git)
├── dist/              # Built site (generated)
├── versions.json      # Version metadata
└── scripts/
    └── add-release.js # Release management CLI
```

## Workflow: Adding a New Release

### On Your Local Machine

After building your Sniffly GUI app, you'll have a `.dmg` file. Upload it to the server:

```bash
scp ~/path/to/sniffly-1.0.0.dmg server:~/src/sniffly/site/releases/
```

### On This Server

1. **Add the release** (this copies the .dmg and updates versions.json):

```bash
cd /home/espadon/src/sniffly/site
npm run add-release 1.0.0 releases/sniffly-1.0.0.dmg --changelog "Initial release with treemap visualization"
```

Or if you uploaded with a different name:

```bash
npm run add-release 1.0.0 releases/my-build.dmg --changelog "Bug fixes and performance improvements"
```

2. **Build the site**:

```bash
npm run build
```

This generates the static site in `dist/` and copies all releases to `dist/releases/`.

3. **Deploy to nginx** (first time setup):

```bash
# Create web directory
sudo mkdir -p /var/www/sniffly.musicsian.com/current

# Copy nginx config
sudo cp sniffly.musicsian.com.conf /etc/nginx/conf.d/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

4. **Deploy the built site**:

```bash
# Copy built site to web directory
sudo rm -rf /var/www/sniffly.musicsian.com/current/*
sudo cp -r dist/* /var/www/sniffly.musicsian.com/current/
sudo chown -R nginx:nginx /var/www/sniffly.musicsian.com/
```

5. **Set up SSL** (first time only):

```bash
sudo certbot --nginx -d sniffly.musicsian.com
```

## Release Management CLI

The `add-release` script handles version management:

```bash
npm run add-release <version> <dmg-path> [options]

Options:
  --changelog "Your changelog text"
  --date YYYY-MM-DD (defaults to today)

Examples:
  npm run add-release 1.2.0 releases/sniffly-1.2.0.dmg --changelog "Added filter support"
  npm run add-release 1.3.0 releases/build.dmg --changelog "Performance improvements" --date 2025-11-15
```

## Development

**Start dev server** (with live reload):

```bash
npm run dev
# Visit: http://localhost:4321
```

**Preview production build**:

```bash
npm run build
npm run preview
```

## Quick Deploy Script

For convenience, create a deploy script:

```bash
#!/bin/bash
# Save as deploy.sh
npm run build
sudo rm -rf /var/www/sniffly.musicsian.com/current/*
sudo cp -r dist/* /var/www/sniffly.musicsian.com/current/
sudo chown -R nginx:nginx /var/www/sniffly.musicsian.com/
echo "✓ Deployed to sniffly.musicsian.com"
```

Make it executable: `chmod +x deploy.sh`

## Customization

### Update Homepage Images

Replace the placeholder divs in `src/pages/index.astro`:

```astro
<div class="placeholder-img">
  [Hero Image - Screenshot Placeholder]
</div>
```

With actual images in `public/`:

```astro
<img src="/screenshots/hero.png" alt="Sniffly interface" style="width: 100%; border-radius: 8px;" />
```

### Styling

All styles are in `src/layouts/BaseLayout.astro`. CSS variables at the top make it easy to customize colors:

```css
:root {
  --bg: #f5f5f5;
  --text: #333;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --border: #ddd;
}
```

## File Upload Formats

**Upload only the `.dmg` file** from your local build. The `.app` bundle is contained within the `.dmg`.

Standard macOS release format:
- `sniffly-1.0.0.dmg` (installer) ✓
- `sniffly-1.0.0.app` (not needed) ✗

## Troubleshooting

**"No releases available yet"** on downloads page:
- Check `versions.json` has entries
- Ensure you ran `npm run build` after adding releases

**Downloads return 404**:
- Verify files exist in `/var/www/sniffly.musicsian.com/current/releases/`
- Check nginx error log: `sudo tail -f /var/log/nginx/sniffly.error.log`

**Build fails**:
- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf node_modules dist && npm install`
