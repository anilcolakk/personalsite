# METU EE Resources

A personal academic web platform for sharing METU EEE lecture notes and study materials.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
personalsite/
├── src/
│   ├── components/     # Reusable UI components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Route pages
│   ├── styles/         # Global CSS
│   └── data/           # JSON data files
├── public/             # Static assets
├── astro.config.mjs    # Astro configuration
└── package.json
```

## 🎨 Features

- **Home Page**: Hero section, features, featured courses
- **Course Archive**: Searchable/filterable course listing
- **Equivalency Tool**: Cross-university course matching
- **About Me**: Personal branding and skills
- **Contact**: Contact form and FAQ
- **Store**: Premium bundles with Shopier integration
- **Blog**: Weekly thoughts and tutorials

## 🔧 Customization

### Updating Content

- **Courses**: Edit the course arrays in `/src/pages/courses/index.astro`
- **Blog Posts**: Add markdown files to `/src/content/blog/`
- **Store Products**: Update arrays in `/src/pages/store.astro`
- **Equivalencies**: Modify data in `/src/pages/equivalency.astro`

### Payment Integration

Replace Shopier links in `/src/pages/store.astro` with your actual Shopier product URLs.

### Contact Form

Update the form action URL in `/src/pages/contact.astro` to your Formspree endpoint.

## 🚀 Deployment to GitHub Pages

1. Update `astro.config.mjs` with your GitHub Pages URL
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Set source to GitHub Actions

## 📝 License

MIT License - Feel free to use and modify for your own projects.
