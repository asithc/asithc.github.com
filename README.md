# Portfolio Website - Asith Wijenayake

A personal portfolio website showcasing Asith Wijenayake's work, skills, and journey as a UX designer and product creator. Features smooth animations, interactive elements, and a clean, modern design. Built with pure HTML, CSS, and JavaScript - no frameworks required!

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
2. Open `index.html` in your web browser
3. That's it! No build process required.

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

This is the personal portfolio website of Asith Wijenayake, a UX designer and product creator. The site showcases his work, skills, and career journey over the past years.

## 📧 Contact

Interested in collaborating or learning more about Asith's work? Feel free to reach out through the contact page!

---

**Asith Wijenayake - UX Designer & Product Creator**

Building thoughtful digital experiences. 🚀
