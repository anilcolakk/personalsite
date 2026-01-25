# 🎓 METU EE Resources - Complete Setup Guide

Follow this guide step-by-step to fully customize your site.

---

## 📋 Quick Reference

| Task | File to Edit |
|------|--------------|
| Your name & bio | `src/pages/about.astro` |
| Courses & Drive links | `src/pages/courses/index.astro` |
| Store prices & Shopier | `src/pages/store.astro` |
| Social media links | `src/components/Footer.astro` |
| Contact info | `src/pages/contact.astro` |
| University equivalencies | `src/pages/equivalency.astro` |
| Blog posts | `src/pages/blog/index.astro` |

---

## 1️⃣ Update Your Personal Info

### File: `src/pages/about.astro`

Find and update these sections:

```astro
<!-- Line ~17: Update your skills -->
const skills = [
  { name: 'Circuit Design', level: 95 },  // Change names and percentages
  { name: 'Signal Processing', level: 90 },
  // Add or remove skills
];

<!-- Line ~25: Update your timeline -->
const timeline = [
  { year: '2020', title: 'Started at METU EEE', description: '...' },
  // Add your own milestones
];

<!-- Line ~67: Update your name -->
<h1 class="profile-name">Anıl</h1>  <!-- Your name here -->

<!-- Line ~68: Update your title -->
<p class="profile-title">Electrical & Electronics Engineering Student</p>

<!-- Line ~71: Update your bio -->
<p class="profile-bio">
  Your personal bio goes here...
</p>

<!-- Line ~74: Update your stats -->
<span class="stat-number">3.7+</span>  <!-- Your GPA -->
```

### Add Your Photo

1. Save your photo to: `public/images/profile.jpg`
2. Replace the placeholder in `about.astro` (around line 50):

```astro
<!-- Find this: -->
<div class="profile-placeholder">
  <svg>...</svg>
</div>

<!-- Replace with: -->
<img src="/images/profile.jpg" alt="Your Name" class="profile-photo" />
```

---

## 2️⃣ Add Your Courses with Google Drive Links

### File: `src/pages/courses/index.astro`

Find the `allCourses` array (around line 7) and update it:

```astro
const allCourses = [
  { 
    code: 'EE101',                          // Course code
    name: 'Introduction to EE',             // Full name
    category: 'Core',                       // Category for filtering
    year: 1,                                // 1, 2, 3, or 4
    semester: 'Fall',                       // 'Fall' or 'Spring'
    resourceCount: 24,                      // Number of resources
    isFree: true,                           // true = free, false = premium
    description: 'Foundational concepts',   // Short description
    driveLink: 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID'  // ⬅️ ADD THIS!
  },
  // Add more courses...
];
```

### How to Get Google Drive Links

1. Go to Google Drive
2. Right-click the folder with your course materials
3. Click **Share** → **Copy link**
4. Make sure it's set to "Anyone with the link can view"
5. Paste the link in the `driveLink` field

### Update CourseCard to Use Drive Links

Edit `src/components/CourseCard.astro` - change the link:

```astro
<!-- Find line ~13 -->
<a href={`/courses/${code.toLowerCase()}`} class="course-card">

<!-- Change to: -->
<a href={driveLink || `/courses/${code.toLowerCase()}`} target="_blank" class="course-card">
```

And add `driveLink` to the Props:

```astro
interface Props {
  code: string;
  name: string;
  category: string;
  resourceCount: number;
  isFree: boolean;
  description: string;
  driveLink?: string;  // ⬅️ Add this line
}

const { code, name, category, resourceCount, isFree, description, driveLink } = Astro.props;
```

---

## 3️⃣ Set Up Shopier Payment Links

### File: `src/pages/store.astro`

Find the `premiumBundles` array (around line 4) and update the Shopier links:

```astro
const premiumBundles = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: '₺149',                                    // Your price
    shopierLink: 'https://shopier.com/YOUR_PRODUCT',  // ⬅️ Your Shopier link
    // ...
  },
];
```

### Update Individual Course Prices

Find `individualCourses` array (around line 50):

```astro
const individualCourses = [
  { 
    code: 'EE230', 
    name: 'Digital Logic Design', 
    price: '₺49',                                    // Your price
    shopierLink: 'https://shopier.com/YOUR_PRODUCT'  // ⬅️ Your Shopier link
  },
];
```

### How to Get Shopier Links

1. Log in to your Shopier seller account
2. Create a product for each bundle
3. Copy the product URL
4. Paste it in the `shopierLink` field

---

## 4️⃣ Update Social Media Links

### File: `src/components/Footer.astro`

Find the social links section (around line 54) and update the `href` values:

```astro
<a href="https://twitter.com/YOUR_HANDLE" class="social-link" aria-label="Twitter">
<a href="https://linkedin.com/in/YOUR_PROFILE" class="social-link" aria-label="LinkedIn">
<a href="https://github.com/YOUR_USERNAME" class="social-link" aria-label="GitHub">
<a href="https://youtube.com/@YOUR_CHANNEL" class="social-link" aria-label="YouTube">
```

### Also Update in About Page

File: `src/pages/about.astro` (around line 96):

```astro
<a href="https://linkedin.com/in/YOUR_PROFILE" target="_blank" class="btn btn-secondary">
```

---

## 5️⃣ Set Up Contact Form

### File: `src/pages/contact.astro`

**Option A: Use Formspree (Free)**

1. Go to https://formspree.io/ and sign up
2. Create a new form
3. Copy your form endpoint (looks like `https://formspree.io/f/xyzabc`)
4. Update line ~70:

```astro
<form class="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

**Option B: Simple Email Link**

Replace the form with a mailto link:

```astro
<a href="mailto:your@email.com" class="btn btn-primary btn-lg">
  Send Email
</a>
```

### Update Contact Methods (around line 5):

```astro
const contactMethods = [
  {
    icon: 'email',
    title: 'Email',
    value: 'your@email.com',           // ⬅️ Your email
    href: 'mailto:your@email.com',     // ⬅️ Your email
    description: 'Best for detailed inquiries'
  },
  {
    icon: 'linkedin',
    title: 'LinkedIn',
    value: '@yourprofile',              // ⬅️ Your LinkedIn
    href: 'https://linkedin.com/in/yourprofile',
    description: 'Connect professionally'
  },
  // ...
];
```

---

## 6️⃣ Add University Equivalencies

### File: `src/pages/equivalency.astro`

Find the `equivalencyData` object (around line 16) and add more universities:

```astro
const equivalencyData = {
  bilkent: [
    { 
      sourceCode: 'EEE102',           // Course code at source university
      sourceName: 'Circuits I',       // Course name at source university
      metuCode: 'EE202',              // Equivalent METU course code
      metuName: 'Circuit Analysis',   // Equivalent METU course name
      similarity: 95                  // Match percentage (0-100)
    },
    // Add more courses...
  ],
  // Add more universities...
};
```

### Add New Universities

Also add to the `universities` array (around line 5):

```astro
const universities = [
  { id: 'bilkent', name: 'Bilkent University' },
  { id: 'your_new_uni', name: 'New University Name' },  // ⬅️ Add here
  // ...
];
```

---

## 7️⃣ Add Blog Posts

### File: `src/pages/blog/index.astro`

Find the `blogPosts` array (around line 5) and add your posts:

```astro
const blogPosts = [
  {
    slug: 'my-new-post',                              // URL-friendly name
    title: 'My New Blog Post Title',                  // Post title
    excerpt: 'Brief description of the post...',     // Short preview
    date: '2024-01-20',                               // YYYY-MM-DD format
    readTime: '8 min read',                           // Reading time
    category: 'Study Tips',                           // Category name
    image: null,                                       // Optional image path
  },
  // Add more posts...
];
```

---

## 8️⃣ Update Site Configuration

### File: `astro.config.mjs`

Update your domain:

```js
export default defineConfig({
  site: 'https://yourdomain.com',  // ⬅️ Your actual domain
  base: '/',
  // ...
});
```

### File: `src/layouts/BaseLayout.astro`

Update the default description (around line 13):

```astro
const { 
  title, 
  description = 'YOUR CUSTOM SITE DESCRIPTION HERE',  // ⬅️ Update this
  // ...
} = Astro.props;
```

---

## 9️⃣ Add Your Logo/Favicon

### Replace Favicon

Save your custom favicon to `public/favicon.svg` or create these files:
- `public/favicon.ico` (32x32)
- `public/apple-touch-icon.png` (180x180)

### Update Logo Text

File: `src/components/Header.astro` (around line 18):

```astro
<span class="logo-text">METU<span class="logo-accent">EE</span></span>
<!-- Change to your preferred branding -->
```

---

## 🚀 Deploy to GitHub Pages

1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Go to repository **Settings** → **Pages**
4. Under "Source", select **GitHub Actions**
5. The site will deploy automatically!

---

## ✅ Checklist

- [ ] Updated name and bio in About page
- [ ] Added profile photo
- [ ] Added all courses with Google Drive links
- [ ] Updated Shopier payment links
- [ ] Updated social media links
- [ ] Set up contact form (Formspree)
- [ ] Added university equivalencies
- [ ] Created blog posts
- [ ] Updated site configuration
- [ ] Deployed to GitHub Pages

---

**Need help?** Check the code comments or ask if anything is unclear!
