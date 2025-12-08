# Email Templates

This folder contains all email templates for the GoCart platform, built with React Email.

## 📧 Templates

| Template | Purpose | Recipient | Trigger |
|----------|---------|-----------|---------|
| `WelcomeEmail.jsx` | Welcome new users | New user | User registration |
| `BidPlacedEmail.jsx` | Notify seller of new bid | Seller | Bid placed |
| `OutbidEmail.jsx` | Alert user they've been outbid | Previous high bidder | Higher bid placed |
| `AuctionWonEmail.jsx` | Congratulate auction winner | Winner | Auction expires with bids |
| `PaymentReceivedEmail.jsx` | Confirm payment to seller | Seller | Payment succeeds |
| `AuctionNoBidsEmail.jsx` | Console seller, offer tips | Seller | Auction expires without bids |

## 🎨 Design System

### Colors
- **Brand Green:** `#22c55e` - Logo, highlights, success states
- **Primary Blue:** `#6366f1` - CTAs, links, interactive elements
- **Red/Warning:** `#ef4444` - Urgent actions, outbid alerts
- **Yellow/Info:** `#fbbf24` - Tips, warnings, info boxes
- **Text Gray:** `#475569` - Body text
- **Dark Gray:** `#1e293b` - Headings
- **Light Gray:** `#94a3b8` - Footer, secondary text

### Typography
- **Logo:** 32px, bold
- **H1 (Main Heading):** 28px, bold, centered
- **H2 (Section Heading):** 20px, semi-bold
- **Body Text:** 16px, normal
- **Small Text:** 14-15px, normal
- **Footer:** 12px, normal

### Layout
- **Container Width:** 600px max
- **Padding:** 32-40px (content), 20px (header/footer)
- **Margins:** 16-32px between elements
- **Border Radius:** 8-12px for boxes/buttons
- **Borders:** 1-2px solid

## 🛠️ Editing Templates

### Basic Structure
All templates follow this pattern:

```jsx
import { Html, Head, Body, Container, Section, Heading, Text, Button } from '@react-email/components';

export default function EmailTemplate({ prop1, prop2 }) {
  return (
    <Html>
      <Head />
      <Preview>Preview text shown in inbox</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={header}>
            <Heading style={logo}>
              <span style={logoGreen}>go</span>cart<span style={logoDot}>.</span>
            </Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {/* Your content here */}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            {/* Footer content */}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles at the bottom
const main = { /* styles */ };
const container = { /* styles */ };
// etc...
```

### Available Components

```jsx
import {
  Html,          // Root element
  Head,          // Document head
  Preview,       // Email preview text
  Body,          // Document body
  Container,     // Main container (600px max)
  Section,       // Content sections
  Heading,       // Headings (h1, h2, etc.)
  Text,          // Paragraphs
  Button,        // Call-to-action buttons
  Link,          // Hyperlinks
  Hr,            // Horizontal rules
  Img,           // Images
} from '@react-email/components';
```

## 📝 Common Patterns

### Badge
```jsx
<Section style={badgeContainer}>
  <span style={badge}>🔨 New Bid</span>
</Section>

const badgeContainer = {
  textAlign: 'center',
  margin: '0 0 24px',
};

const badge = {
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '20px',
  display: 'inline-block',
};
```

### Details Box
```jsx
<Section style={detailsBox}>
  <Text style={detailsTitle}>Details</Text>
  <Hr style={hr} />
  
  <table style={detailsTable}>
    <tr>
      <td style={detailsLabel}>Label:</td>
      <td style={detailsValue}>Value</td>
    </tr>
  </table>
</Section>

const detailsBox = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};
```

### Call-to-Action Button
```jsx
<Section style={buttonContainer}>
  <Button style={button} href="https://gocart.com/action">
    Click Here
  </Button>
</Section>

const buttonContainer = {
  textAlign: 'center',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 32px',
};
```

### Info/Warning Box
```jsx
<Text style={infoText}>
  💡 <strong>Tip:</strong> Your helpful tip here
</Text>

const infoText = {
  backgroundColor: '#e0f2fe',
  border: '1px solid #7dd3fc',
  borderRadius: '8px',
  padding: '16px',
  color: '#075985',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
};
```

### Step-by-Step List
```jsx
<Section style={stepsContainer}>
  <Text style={step}>
    <span style={stepNumber}>1</span>
    <span style={stepText}><strong>Step Title</strong> - Description</span>
  </Text>
</Section>

const stepNumber = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  flexShrink: 0,
};
```

## 🧪 Testing Changes

### Preview Locally
```bash
# Install React Email dev server
npx react-email dev

# Opens at http://localhost:3000
```

### Test with Real Send
```bash
# Send test email with your changes
node scripts/test-email.js your-email@example.com --all
```

## 🎯 Customization Checklist

When customizing templates:

- [ ] Update brand colors to match your brand
- [ ] Replace `process.env.NEXT_PUBLIC_APP_URL` with your domain
- [ ] Update logo/branding
- [ ] Adjust copy/tone to match your brand voice
- [ ] Test on multiple email clients (Gmail, Outlook, Apple Mail)
- [ ] Check mobile rendering
- [ ] Update footer links (unsubscribe, privacy policy)
- [ ] Add tracking pixels if needed (Resend analytics)
- [ ] Test with real data (not just placeholders)

## 📱 Mobile Optimization

All templates are mobile-responsive by default:
- ✅ 600px max width on desktop
- ✅ Full width on mobile
- ✅ Larger touch targets (44px minimum)
- ✅ Readable font sizes (16px minimum)
- ✅ Padded tap areas
- ✅ Simplified layouts

## 🔗 Environment Variables

Templates use these environment variables:

```javascript
process.env.NEXT_PUBLIC_APP_URL  // Your app URL (default: http://localhost:3000)
```

Set in `.env`:
```env
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## 📚 Resources

- **React Email Docs:** https://react.email/docs
- **Component Reference:** https://react.email/docs/components
- **Email Client Support:** https://react.email/docs/support
- **Best Practices:** https://resend.com/docs/best-practices

## 🐛 Troubleshooting

### Template not rendering correctly?
- Check console for errors
- Make sure all styles are inline (no external CSS)
- Test in React Email dev server first
- Check email client compatibility

### Props not showing?
- Verify function signature matches calling code
- Add default values: `prop = 'default'`
- Check calling code passes all required props

### Styling issues?
- Email clients have limited CSS support
- Use inline styles only
- Avoid flexbox (use tables for layout)
- Use `textAlign: 'center'` not `align-items`

## 💡 Tips

1. **Always provide defaults** for props (for testing)
2. **Use inline styles** - external CSS won't work
3. **Test in multiple clients** - Gmail, Outlook, Apple Mail
4. **Keep it simple** - complex layouts may break
5. **Use tables** for complex layouts (better email client support)
6. **Preview before sending** - Use React Email dev server
7. **Use emojis sparingly** - Not all clients support them
8. **Include plain text** - Some clients need it (Resend handles this)

---

**Last Updated:** January 2025  
**Version:** 1.0.0
