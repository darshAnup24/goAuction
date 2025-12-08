import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export default function AuctionNoBidsEmail({
  sellerName = 'Seller',
  productName = 'Your Product',
  productId = '',
  startingBid = '0',
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head />
      <Preview>Your auction for {productName} ended with no bids</Preview>
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
            {/* Badge */}
            <Section style={badgeContainer}>
              <span style={badge}>📭 Auction Ended</span>
            </Section>

            <Heading style={h1}>Your Auction Has Ended</Heading>
            
            <Text style={text}>
              Hi <strong>{sellerName}</strong>,
            </Text>
            
            <Text style={text}>
              Your auction for <strong>{productName}</strong> has ended. Unfortunately, it didn't receive any bids this time.
            </Text>

            <Text style={text}>
              But don't worry! Here are some tips to improve your next listing:
            </Text>

            <Section style={tipsContainer}>
              <Text style={tip}>
                📸 <strong>Better Photos</strong> - Add high-quality images from multiple angles
              </Text>
              <Text style={tip}>
                💰 <strong>Competitive Pricing</strong> - Check similar items and adjust your starting bid
              </Text>
              <Text style={tip}>
                📝 <strong>Detailed Description</strong> - Include all relevant details and specifications
              </Text>
              <Text style={tip}>
                ⏰ <strong>Better Timing</strong> - End auctions during peak hours (evenings/weekends)
              </Text>
              <Text style={tip}>
                🏷️ <strong>Accurate Categories</strong> - Make sure your item is in the right category
              </Text>
              <Text style={tip}>
                ⭐ <strong>Build Reputation</strong> - Positive reviews help attract more bidders
              </Text>
            </Section>

            <Section style={actionBox}>
              <Text style={actionTitle}>Ready to Try Again?</Text>
              <Text style={actionText}>
                You can easily relist this item with improvements. We've made it simple!
              </Text>
              <Section style={buttonContainer}>
                <Button style={button} href={`${appUrl}/store/add-product`}>
                  Relist This Item
                </Button>
              </Section>
            </Section>

            <Text style={helpText}>
              💡 <strong>Need Help?</strong> Our support team can review your listing and provide personalized suggestions. Just reply to this email!
            </Text>

            <Text style={text}>
              Don't give up! Many successful sellers didn't get bids on their first try. Learn from this experience and come back stronger!
            </Text>

            <Text style={text}>
              Keep selling,<br />
              The GoCart Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} GoCart. All rights reserved.
            </Text>
            <Text style={footerText}>
              Want selling tips? Check out our <a href="#" style={footerLink}>Seller's Guide</a>
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

const badgeContainer = {
  textAlign: 'center',
  margin: '0 0 24px',
};

const badge = {
  backgroundColor: '#f1f5f9',
  color: '#475569',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '20px',
  display: 'inline-block',
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

const tipsContainer = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const tip = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '8px 0',
};

const actionBox = {
  backgroundColor: '#eff6ff',
  border: '2px solid #93c5fd',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
  textAlign: 'center',
};

const actionTitle = {
  color: '#1e40af',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const actionText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 20px',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '20px 0 0',
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

const helpText = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde047',
  borderRadius: '8px',
  padding: '16px',
  color: '#713f12',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0',
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
  color: '#6366f1',
  textDecoration: 'underline',
};
