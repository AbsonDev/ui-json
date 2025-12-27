# ❓ Frequently Asked Questions (FAQ)

## Getting Started

### What is UI-JSON Visualizer?

UI-JSON Visualizer is a low-code platform that lets you create mobile apps using JSON. No complex coding required - just define your app structure in JSON and see it come to life instantly!

### Do I need to know how to code?

Basic JSON knowledge helps, but it's not required! We provide:
- 🎨 **Templates Gallery** - Start with pre-built apps
- 📚 **Component Library** - Drag-and-drop ready components
- 🤖 **AI Assistant** - Describe your app, and AI builds it for you
- 📖 **Documentation** - Step-by-step guides and examples

### Is it really free?

Yes! The FREE plan includes:
- ✅ Up to 3 apps
- ✅ All core features (editor, preview, templates)
- ✅ AI Assistant (10 requests/day)
- ✅ Publish apps with watermark
- ✅ Basic analytics

---

## Publishing & Deployment

### How do I publish my app?

1. Click the **"Publish"** button in your app editor
2. Choose a custom URL slug (or auto-generate)
3. Click **"Publish App"**
4. Share your public URL: `uijson.app/published/your-app-name`

That's it! Your app is now live and accessible to anyone with the link.

### Can I customize the published URL?

Yes! When publishing, you can set a custom slug:
- Good examples: `my-todo-app`, `fitness-tracker`, `recipe-book`
- Must be unique across all published apps
- Only lowercase letters, numbers, and hyphens allowed

### What's the difference between FREE and PRO published apps?

| Feature | FREE | PRO |
|---------|------|-----|
| Publish apps | ✅ Yes | ✅ Yes |
| Custom slug | ✅ Yes | ✅ Yes |
| Watermark | ✅ "Made with UI-JSON" | ❌ No watermark |
| Analytics | Basic (views only) | Advanced (devices, countries, referrers) |
| Custom domain | ❌ No | ✅ Yes |

### How do I remove the watermark?

Upgrade to PRO plan ($19/month) to remove the "Made with UI-JSON" watermark from your published apps.

### Can I unpublish an app?

Yes! Open your published app settings and click **"Unpublish"**. The public URL will stop working immediately, but your app data is preserved in the editor.

---

## Limits & Plans

### What are the FREE plan limits?

- **Apps:** 3 apps maximum
- **Publishing:** Unlimited publishes (with watermark)
- **Exports:** 5 JSON exports per month
- **Mobile Builds:** 0 (not available)
- **AI Assistant:** 10 requests per day
- **Templates:** 3 basic templates
- **Storage:** 100 MB

### What if I hit my app limit?

You'll see a notification when you try to create a 4th app. Options:
1. **Delete an existing app** to make room
2. **Upgrade to PRO** for unlimited apps
3. **Unpublish apps** you're not using (they still count toward limit)

### Can I build mobile apps (Android/iOS)?

Mobile builds are available for PRO and TEAM plans:
- **PRO:** 10 builds/month
- **TEAM:** 50 builds/month

FREE users can design and preview apps but can't generate APK/IPA files.

---

## Features & Functionality

### Does my app work offline?

Published apps use the browser's localStorage by default, which works offline after the first load. However, features requiring backend (authentication, external APIs) need an internet connection.

### Can I connect to a real database?

Yes! You can:
1. **Use built-in localStorage** (default, works offline)
2. **Connect PostgreSQL** (PRO+, requires database credentials)
3. **Use external APIs** (any plan, via custom actions)

### Can I add authentication to my app?

Absolutely! The authentication system supports:
- ✅ Login with email/password
- ✅ Registration/signup
- ✅ Session management
- ✅ Protected screens (require login)
- ✅ Logout functionality

Just enable authentication in your app JSON and define user fields.

### Can I use AI to build my app?

Yes! Our AI Assistant (powered by Google Gemini) can:
- 🎨 Generate complete apps from descriptions
- 🔧 Modify existing apps with natural language commands
- 🗄️ Create database schemas automatically
- 💡 Suggest improvements and fix errors

**FREE:** 10 AI requests/day
**PRO:** 100 AI requests/day
**TEAM:** Unlimited

---

## Analytics & Tracking

### How do I see how many people viewed my app?

1. Go to your **Dashboard**
2. Click on your published app
3. View the **Analytics** section

You'll see:
- Total views (all time)
- Views in last 30 days
- Views in last 7 days
- Views today

### What analytics are tracked?

**Basic (FREE):**
- View count
- Last viewed timestamp

**Advanced (PRO+):**
- Unique visitors (sessions)
- Device types (mobile, desktop, tablet)
- Referrer sources
- Geographic data (countries)
- Time-series view trends

### Is visitor data private?

Yes! We respect privacy:
- ✅ IP addresses are hashed (not stored in plain text)
- ✅ No personal identifiable information (PII) collected
- ✅ No cookies set on visitor browsers
- ✅ GDPR compliant

---

## Billing & Payments

### How does the PRO trial work?

PRO plan includes a **14-day free trial**:
- ✅ Full PRO features during trial
- ✅ No credit card required upfront
- ✅ Cancel anytime before trial ends
- ✅ Automatic billing after 14 days if not canceled

### Can I cancel anytime?

Yes! You can cancel your subscription anytime:
1. Go to **Settings → Billing**
2. Click **"Manage Subscription"**
3. Click **"Cancel Subscription"**

You'll keep PRO features until the end of your billing period.

### What happens if my payment fails?

1. We'll retry the payment 3 times over 7 days
2. You'll receive email notifications
3. After 7 days, your account downgrades to FREE
4. Your apps remain safe but some features become limited

### Do you offer refunds?

Yes! We offer refunds within 7 days of purchase if:
- The platform didn't meet your expectations
- Technical issues prevented use
- Accidental purchase

Email support@yourdomain.com with your request.

---

## Technical Issues

### My published app shows "Not Found"

**Troubleshooting steps:**
1. Verify the app is published (check dashboard)
2. Check the URL slug is correct
3. Clear your browser cache
4. Try in an incognito/private window

Still not working? Contact support with your app URL.

### The editor is slow or laggy

**Common solutions:**
1. Close unused browser tabs
2. Clear browser cache
3. Try a different browser (Chrome recommended)
4. Check if your JSON is very large (>1MB)

For large apps, consider:
- Splitting into multiple apps
- Using external data loading
- Upgrading to PRO for better performance

### I'm getting "Rate limit exceeded" error

This happens if you:
- Try to login too many times (5 attempts/minute)
- Submit too many forms rapidly (60 requests/minute)

**Solution:** Wait 60 seconds and try again.

### My AI Assistant stopped working

**FREE plan:** Check if you've used your 10 daily requests
- Resets every 24 hours
- Upgrade to PRO for 100 requests/day

**PRO plan:** If you still hit limits, contact support.

---

## Data & Privacy

### Who owns the apps I create?

**You do!** You retain full ownership of:
- All apps you create
- All data in your apps
- All published content

We never claim ownership of your intellectual property.

### Can I export my data?

Yes! You can export:
- **App JSON:** Download anytime (5 exports/month on FREE)
- **Database data:** Download as JSON
- **Analytics:** Export as CSV (PRO+)

### What happens if I delete my account?

When you delete your account:
- ❌ All apps are permanently deleted
- ❌ Published apps stop working immediately
- ❌ Analytics data is deleted
- ❌ This action cannot be undone

We recommend exporting your data first!

### Is my data encrypted?

Yes! We use industry-standard encryption:
- ✅ Database passwords encrypted at rest (AES-256)
- ✅ All connections use HTTPS/TLS
- ✅ Passwords hashed with bcrypt
- ✅ Session tokens encrypted (JWT)

---

## Mobile Builds

### How do I build an Android/iOS app?

1. Create your app in the editor
2. Click **"Mobile Export"** (PRO+ only)
3. Choose platform (Android or iOS)
4. Configure app details (name, icon, version)
5. Click **"Generate Build"**
6. Wait 5-10 minutes for build to complete
7. Download APK (Android) or IPA (iOS)

### Can I publish to Google Play / App Store?

Yes! Our builds are production-ready:
- ✅ APK files ready for Play Store
- ✅ IPA files ready for App Store (requires Apple Developer account)
- ✅ App signing supported
- ✅ Version management

**Note:** You need your own developer accounts for Play Store ($25 one-time) and App Store ($99/year).

### Why is the mobile build still processing?

Builds typically take 5-10 minutes. If it's taking longer:
1. Check your **Builds** dashboard for status
2. Look for error messages
3. Complex apps may take up to 15 minutes

If stuck for >20 minutes, contact support.

---

## Templates & Examples

### Can I edit templates?

Yes! Templates are starting points:
1. Choose a template from the gallery
2. It creates a copy in your apps
3. Edit the JSON freely
4. Save and publish

Templates don't count as extra apps - they become your apps.

### Can I share my template with others?

Currently, template sharing is only available for TEAM plan users. We're working on a community marketplace for all users!

### Where can I find more examples?

- **Templates Gallery:** Pre-built apps in the dashboard
- **Documentation:** Step-by-step guides with code
- **Component Library:** Reusable UI snippets
- **GitHub:** Example apps in our repository

---

## Support

### How do I contact support?

- **Email:** support@yourdomain.com
- **Response time:** <24 hours (PRO/TEAM get priority)
- **Status page:** status.yourdomain.com

### Is there a community forum?

Yes! Join our community:
- **Discord:** discord.gg/uijson
- **GitHub Discussions:** github.com/yourusername/ui-json/discussions
- **Twitter:** @uijson

### Can I request a feature?

Absolutely! We love feedback:
1. Open an issue on GitHub
2. Email suggestions to support@yourdomain.com
3. Vote on existing feature requests

PRO/TEAM users get priority feature consideration.

---

## Tips & Best Practices

### How do I make my app load faster?

1. **Minimize JSON size:** Remove unused components
2. **Optimize images:** Use compressed formats, external CDN
3. **Lazy load data:** Load data only when needed
4. **Use caching:** Enable localStorage caching

### What makes a good published app?

✅ **Clear purpose:** Users know what it does immediately
✅ **Good UX:** Easy navigation, clear buttons
✅ **Responsive:** Works on mobile and desktop
✅ **Fast:** Loads in <2 seconds
✅ **Tested:** No broken links or errors

### Can I monetize my published apps?

Yes! You can:
- Add affiliate links
- Integrate payment gateways (Stripe, PayPal)
- Display ads (PRO+ removes our watermark)
- Sell premium features

We don't take a cut of your revenue!

---

## Still Have Questions?

📧 Email us: support@yourdomain.com
💬 Chat with us: discord.gg/uijson
📚 Read the docs: docs.yourdomain.com

We're here to help! 🚀
