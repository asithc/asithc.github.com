# Portfolio Website - Asith Wijenayake

A personal portfolio website showcasing Asith Wijenayake's work, skills, and journey as a UX designer, UI/UX designer, and product designer. Features smooth animations, interactive elements, and a clean, modern design. Built with pure HTML, CSS, and JavaScript - no frameworks required!

## Current resume

Use `files/Resume-Asith-Wijenayake-Lead-Product-Designer-International-12-Nov-2026.pdf` as the current resume. The Home and About links open the shared in-app PDF.js reader. Its single source in `js/resume-viewer.js` points to this file; the ordinary link remains a no-JavaScript fallback. When replacing it, update all four references in `index.html` and `about.html`.

## Shared main navigation

Every portfolio page mounts `<site-navigation>`. Edit links and selection behavior in `js/site-navigation.js`, and styling in `css/site-navigation.css`. Keep navigation markup out of individual pages. The component loads before first paint; native cross-document view transitions preserve visual continuity between the HTML pages, with a directional indicator fallback when a transition is skipped. The Work link uses a broad, diffused colour beam sweeping left to right along its lower edge, hidden while Work is active.

## Shared macOS-inspired theme

`css/macos-theme.css` is loaded after page styles on every portfolio page. It owns the shared canvas, content surfaces, floating controls, focus treatment, and accessibility variants. Product screenshots and branded illustrations keep their own colours. The social Dock styles and handwritten SVG annotation live in `css/social-dock.css` and `index.html`.

## Experience, discoverability and résumé reader

The homepage profile capabilities were checked against the supplied 12 November 2026 résumé. The 10+ reveal is progressive enhancement and respects reduced motion. `css/professional-profile.css` owns the coloured frosted profile. The expanded experience and workflow section was removed from Home at the user’s request.

`js/resume-viewer.js` and `css/resume-viewer.css` provide the same native-dialog reader on Home and About: on-demand locally bundled PDF.js, selectable accessible text, page controls, fit/zoom, explicit download, focus restoration and an error/retry state. The source PDF is unchanged. The service worker bypasses PDFs, avoiding persistent offline résumé caching. This viewer is not access control.

Run `python3 scripts/check-seo.py` to check all 18 canonical pages for metadata, social images, structured JSON, sitemap membership, local resources and crawler policy. `llms.txt` and `llms-full.txt` provide factual public summaries without the full résumé. robots.txt permits search/answer discovery while excluding résumé files and opting out of named training crawlers; compliance is voluntary.

Cloudflare traffic rules and a PDF response-header Worker are prepared in `cloudflare/`. They are **not deployed**. See [deployment prerequisites and public-origin limitations](cloudflare/README.md). The domain was observed on registrar nameservers with direct GitHub Pages IPs on 15 November 2026. Private résumé storage plus a verified server-side access flow would be needed to protect the document from direct origin access; browser source remains public by design.

## What If: independent concepts

`what-if.html` is the collection entry point, linked from Work. The first exploration redesigns LMT Go, the Lanka Metro Transit app. The current case study is `projects/what-if-metro-v2.html`, with a minimisable floating contents menu that appears at the case-study introduction, annotated phone walkthroughs, and research context from the Metro Transit Facebook community. The first layout is preserved at `projects/what-if-metro.html`. It combines the supplied original app screenshots, arranged captures of the redesigned app, and a pencil storyboard informed by the supplied Metro bus photographs.

The mobile simulator loads the existing LMT Go prototype from `prototypes/metro/`. Its source snapshot and existing data attributions are preserved; the portfolio adds same-origin flow shortcuts, reset, and fullscreen framing. Operational data and payment flows remain illustrative. Artwork provenance and prompts are recorded in `images/Projects/WhatIf/ARTWORK.md`.

## ✨ Features

- **About Me**: Learn about Asith's background, career journey, and what drives his work
- **Work Portfolio**: Showcase of UX design projects including DGL, OneCup, Marketplace, and more
- **Smooth Animations**: Fade-in effects, scroll animations, and interactive hover states
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Interactive Contact Form**: iMessage-style chat interface for reaching out
- **Project Case Studies**: Detailed insights into design process, tools, and outcomes
- **Widget System**: Personal widgets showing interests, music, and updates

## 🖼️ Replacing Photo Carousel Images

The photo carousel uses placeholder images from Unsplash. To replace them with your own:

### Method 1: Using Local Images

1. Create an `images` folder in your project root
2. Add your photos (supports .jpg, .png, .jpeg, .webp)
3. Update the image paths in `index.html`:

```html
<!-- Find lines like this: -->
<div class="photo-slide active" data-category="random" data-index="0" data-src="https://images.unsplash.com/...">
    <img src="https://images.unsplash.com/..." alt="Random photo 1" class="photo-image">
</div>

<!-- Replace with your local images: -->
<div class="photo-slide active" data-category="random" data-index="0" data-src="images/my-photo-1.jpg">
    <img src="images/my-photo-1.jpg" alt="My photo description" class="photo-image">
</div>
```

### Method 2: Using External URLs

Simply replace the `src` and `data-src` attributes with your image URLs:

```html
<img src="https://your-image-host.com/photo.jpg" alt="Description" class="photo-image">
```

### Photo Categories

The carousel has 4 categories with 4 images each (16 total):
- **Random**: General mixed photos (lines 147-158 in index.html)
- **Home**: Home and interior photos (lines 160-175)
- **Personal**: People and lifestyle photos (lines 177-192)
- **Adventure**: Travel and outdoor photos (lines 194-209)

### Auto-Rotation Behavior

- Images automatically rotate every **8 seconds**
- Auto-rotation **pauses** when you hover over the carousel
- Auto-rotation **pauses** when clicking category buttons
- Resumes after 2 seconds (hover) or 5 seconds (after interaction)
- Smooth fade in/out animations between images

## 🚀 Quick Start

### Local Development

1. Clone or download this repository
2. Start the local HTTP server from the repository root:

   ```bash
   python3 scripts/serve.py
   ```

3. Open [http://127.0.0.1:8765](http://127.0.0.1:8765) in your browser. Stop the server with `Ctrl+C`.

No build process is required. The local server supports video seeking and lets the shared résumé reader load its JavaScript modules and PDF.

### File Structure

```
portfolio/
├── index.html          # Home page
├── about.html          # About page with widgets
├── work.html           # Portfolio/work showcase
├── contact.html        # Interactive contact page
├── images/             # (Create this folder for your photos)
├── css/
│   └── style.css      # All styles and animations
└── js/
    ├── script.js      # Main JavaScript functionality
    └── contact.js     # Contact form interactivity
```

## 📝 Customization Guide

### Updating Content

#### Home Page (index.html)
1. Update the name and intro text in the `<h1>` tag
2. Modify manifesto items in the `.manifesto-list` section
3. Customize Notion widget items

#### About Page (about.html)
1. Update biography sections (WHERE I'M FROM, WHAT I DO NOW, etc.)
2. Change social links in the `.social-links` section
3. Customize widget content (Twitter bio, music playlist, etc.)

#### Work Page (work.html)
1. Modify project titles and descriptions in `.work-info`
2. Update project preview images/mockups
3. Add or remove work items from the grid

#### Contact Page (contact.html)
1. Interactive iMessage-style contact interface
2. Social links and direct communication options
3. Smooth conversation flow animations

### Styling

All styles are in `css/style.css`. Key sections:

```css
:root {
    /* Update colors here */
    --bg-primary: #FAFAFA;
    --text-primary: #000000;
    --accent-blue: #007AFF;
    
    /* Update fonts here */
    --font-primary: -apple-system, BlinkMacSystemFont, ...;
    
    /* Update spacing here */
    --spacing-sm: 1rem;
    --spacing-md: 1.5rem;
}
```

### Colors
- Primary Background: `--bg-primary`
- Text Color: `--text-primary`
- Accent Blue: `--accent-blue`
- Border Color: `--border-color`

### Typography
- Update font family in `:root { --font-primary }`
- Font sizes are defined with CSS variables (--font-size-base, etc.)

### Animations
All animations are in `js/script.js`:
- Fade-in effects: `.fade-in` class with Intersection Observer
- Hover effects: Applied to `.work-item`, `.widget`, etc.
- Scroll progress: Automatically generated progress bar

## 🌐 Deploying to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `portfolio` or `your-username.github.io`

### Step 2: Upload Files

Using GitHub Web Interface:
1. Click "uploading an existing file"
2. Drag all files and folders
3. Commit changes

Using Git Command Line:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to repository Settings
2. Click "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click "Save"
5. Your site will be live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`

## 🎨 Design System

### Color Palette
- **Background**: #FAFAFA (off-white)
- **Cards**: #FFFFFF (white)
- **Text**: #000000 (black)
- **Secondary Text**: #6B6B6B (gray)
- **Accent Blue**: #007AFF (iOS blue)
- **Twitter**: #1DA1F2
- **Music**: #FA2D48
- **Podcast**: #A15FE1

### Typography
- **Font**: San Francisco / System Font Stack
- **Headers**: 600-700 weight
- **Body**: 400 weight
- **Small Text**: 12-14px
- **Base Text**: 16px
- **Headers**: 24-48px

### Spacing
- **XS**: 8px
- **SM**: 16px
- **MD**: 24px
- **LG**: 32px
- **XL**: 48px
- **2XL**: 64px

## 🛠️ Advanced Customization

### Adding New Pages

1. Create a new HTML file (e.g., `blog.html`)
2. Copy the structure from an existing page
3. Add navigation link:
```html
<a href="blog.html" class="nav-link">Blog</a>
```

### Adding Animations

In `js/script.js`, add your custom animations:
```javascript
const myCustomAnimation = () => {
    // Your animation code here
};

// Add to init function
const init = () => {
    // ... existing code
    myCustomAnimation();
};
```

### Contact Form Backend

To make the contact form functional:

1. Uncomment the `sendToBackend()` function in `js/contact.js`
2. Set up a backend API endpoint
3. Update the URL in the fetch call:
```javascript
const response = await fetch('YOUR_API_ENDPOINT', {
    // ... config
});
```

Popular options:
- [Formspree](https://formspree.io/)
- [Netlify Forms](https://www.netlify.com/products/forms/)
- [EmailJS](https://www.emailjs.com/)

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### Animations not working
- Check if JavaScript is enabled
- Open browser console for errors
- Ensure all JS files are properly linked

### Styles not loading
- Verify CSS file path is correct
- Clear browser cache
- Check for CSS syntax errors

### Images not displaying
- Update image paths in HTML
- Ensure images are in correct folders
- Check image file names and extensions

## 📄 About This Project

This is the personal portfolio website of Asith Wijenayake, a UX designer, UI/UX designer, and product designer. The site showcases his work, skills, and career journey over the past years.

## 📧 Contact

Interested in collaborating or learning more about Asith's work? Feel free to reach out through the contact page!

---

**Asith Wijenayake — Senior UX Designer, UI/UX Designer & Product Designer**

Building thoughtful digital experiences. 🚀

## Fonts and new case-study badges

Sans-serif UI uses SF Pro Display through locally available system fonts, with system fallbacks on other platforms. Display optical sizing is fixed at 28; the self-hosted Instrument Serif headings are preserved. Apple font files are not redistributed.

Home features four product showcases, including the LMT Go concept in the former WhatsApp widget position. Project dates are drawn from the case-study timelines: IFS 2023–January 2026, DGL 2018–2023, WizPos 2021–2022 and 2026–present, and LMT Go 2026.

The New chips use the actual `MetalBadge` component from [Libraries.dev Metal](https://libraries.dev/metal), bundled with React as a local enhancement. Their text remains available before JavaScript or without WebGL. Reduced motion uses a static metallic chip; the shader pauses in hidden tabs. To rebuild: run `npm ci` and `npm run build` in `scripts/metal-badges/`. Pinned source and dependency versions are kept there; licenses and notices are alongside the compiled bundle in `js/vendor/metal-badges/`.
