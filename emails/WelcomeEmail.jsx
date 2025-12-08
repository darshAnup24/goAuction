import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export default function WelcomeEmail({ username = 'there' }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to GoCart - Start bidding on amazing auctions!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={header}>
            <Heading style={logo}>
              <span style={logoGreen}>go</span>cart<span style={logoDot}>.</span>
            </Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>Welcome to GoCart! 🎉</Heading>
            
            <Text style={text}>
              Hi <strong>{username}</strong>,
            </Text>
            
            <Text style={text}>
              Thank you for joining GoCart! We're excited to have you as part of our auction community.
            </Text>

            <Text style={text}>
              Here's what you can do now:
            </Text>

            <Section style={features}>
              <Text style={feature}>🔨 <strong>Browse Auctions</strong> - Explore hundreds of unique items</Text>
              <Text style={feature}>💰 <strong>Place Bids</strong> - Bid on items you love</Text>
              <Text style={feature}>🎯 <strong>List Items</strong> - Sell your own products</Text>
              <Text style={feature}>⚡ <strong>Real-time Updates</strong> - Get instant notifications</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop`}>
                Start Browsing Auctions
              </Button>
            </Section>

            <Text style={text}>
              Need help getting started? Check out our <Link href="#" style={link}>help center</Link> or reply to this email.
            </Text>

            <Text style={text}>
              Happy bidding!<br />
              The GoCart Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} GoCart. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="#" style={footerLink}>Unsubscribe</Link> | <Link href="#" style={footerLink}>Help</Link> | <Link href="#" style={footerLink}>Privacy Policy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  textAlign: 'center',
  borderBottom: '1px solid #e6e6e6',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  color: '#334155',
};

const logoGreen = {
  color: '#22c55e',
};

const logoDot = {
  color: '#22c55e',
  fontSize: '40px',
};

const content = {
  padding: '32px 40px',
};

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center',
};

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const features = {
  margin: '24px 0',
};

const feature = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '8px 0',
};

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

const link = {
  color: '#6366f1',
  textDecoration: 'underline',
};

const footer = {
  borderTop: '1px solid #e6e6e6',
  padding: '24px 40px',
  textAlign: 'center',
};

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '8px 0',
};

const footerLink = {
  color: '#94a3b8',
  textDecoration: 'underline',
};
