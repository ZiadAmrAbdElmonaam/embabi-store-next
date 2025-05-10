# Embabi Store Next.js E-commerce

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your email credentials:
   - For email verification to work, you need to set up a Gmail account with an app password
   - See: https://support.google.com/accounts/answer/185833

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Email Verification

This project includes email verification for user signup:

1. When a user signs up, they receive a verification code via email
2. The user must enter this code to verify their account
3. After verification, they can log in

If you don't configure email credentials in the `.env` file, the verification codes will be logged to the console instead of being sent via email. This is useful for development.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🔍 SEO Optimization Guide

This application has been optimized for search engines to improve visibility and traffic. Here's what's included:

### SEO Features
- **Metadata**: Dynamic metadata for all pages with proper title, description, and keywords
- **Structured Data**: Schema.org JSON-LD data for products, organization, and breadcrumbs
- **Sitemap**: Auto-generated sitemap.xml at `/sitemap.xml`
- **Robots.txt**: Properly configured robots.txt at `/robots.txt`
- **Canonical URLs**: Correctly implemented on all pages to prevent duplicate content issues
- **Open Graph & Twitter Cards**: Social media meta tags for rich sharing experiences
- **Breadcrumbs**: SEO-friendly navigation with structured data
- **Mobile-Friendly**: Fully responsive design for all devices

### How to Complete the Setup

1. **Google Search Console**:
   - Register at https://search.google.com/search-console
   - Verify ownership using the included HTML file at `/public/googlec24c69b4ec6c8c9c.html`
   - Submit your sitemap at `https://yourdomain.com/sitemap.xml`

2. **Environment Variables**:
   - Update the `.env` file with your actual domain:
     ```
     NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
     NEXT_PUBLIC_SITE_NAME=Embabi Store
     ```

3. **Google Analytics** (recommended):
   - Create a Google Analytics 4 property
   - Add the measurement ID to your site using the GA script tag

4. **Meta Verification**:
   - Update the Google verification code in `app/layout.tsx`:
     ```typescript
     verification: {
       google: 'your-actual-google-verification-code',
     },
     ```

5. **Social Media URLs**:
   - Update the social media URLs in `components/seo/structured-data.tsx` with your actual profiles:
     ```typescript
     sameAs: [
       'https://facebook.com/your-actual-page',
       'https://instagram.com/your-actual-account',
       'https://twitter.com/your-actual-handle'
     ],
     ```

### Best Practices for Content

1. **Product Descriptions**:
   - Write unique, detailed descriptions (150+ words)
   - Include relevant keywords naturally
   - Add specifications and benefits

2. **Category Pages**:
   - Add intro text explaining the category (200+ words)
   - Include relevant keywords for that category

3. **Image Optimization**:
   - Use descriptive file names (e.g., "blue-cotton-t-shirt.jpg")
   - Always include alt text
   - Use NextJS Image component for automatic WebP optimization

4. **URLs**:
   - Already implemented with clean, keyword-rich slugs
   - Category-based hierarchy for products

### Monitoring SEO Performance

1. Track your rankings with Google Search Console
2. Monitor web vitals scores (Next.js has built-in web vitals reporting)
3. Check your sitemap is properly indexed
4. Use tools like Lighthouse to audit performance regularly
