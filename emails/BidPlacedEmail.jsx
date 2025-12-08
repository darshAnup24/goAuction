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
  Hr,
} from '@react-email/components';
import * as React from 'react';

export default function BidPlacedEmail({
  sellerName = 'Seller',
  bidderName = 'Someone',
  bidAmount = '0',
  productName = 'Your Product',
  productId = '',
  currentBidCount = 1,
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head />
      <Preview>New bid of ${bidAmount} placed on {productName}!</Preview>
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
              <span style={badge}>🔨 New Bid</span>
            </Section>

            <Heading style={h1}>New Bid on Your Auction!</Heading>
            
            <Text style={text}>
              Hi <strong>{sellerName}</strong>,
            </Text>
            
            <Text style={text}>
              Great news! <strong>{bidderName}</strong> just placed a bid on your auction.
            </Text>

            {/* Bid Details Box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>Bid Details</Text>
              <Hr style={hr} />
              
              <table style={detailsTable}>
                <tr>
                  <td style={detailsLabel}>Product:</td>
                  <td style={detailsValue}>{productName}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Bid Amount:</td>
                  <td style={detailsValueHighlight}>${bidAmount}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Bidder:</td>
                  <td style={detailsValue}>{bidderName}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Total Bids:</td>
                  <td style={detailsValue}>{currentBidCount}</td>
                </tr>
              </table>
            </Section>

            <Text style={text}>
              This is exciting! More bids mean more interest in your item. The auction is getting competitive! 🎯
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/product/${productId}`}>
                View Auction Details
              </Button>
            </Section>

            <Text style={helpText}>
              💡 <strong>Tip:</strong> Keep your listing active and respond to any buyer questions to maximize your sale price.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} GoCart. All rights reserved.
            </Text>
            <Text style={footerText}>
              You're receiving this because you have an active auction on GoCart.
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
  backgroundColor: '#dbeafe',
  color: '#1e40af',
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

const detailsBox = {
  backgroundColor: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const detailsTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: '0 0 12px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '12px 0',
};

const detailsTable = {
  width: '100%',
  marginTop: '12px',
};

const detailsLabel = {
  color: '#64748b',
  fontSize: '14px',
  padding: '8px 0',
  width: '40%',
};

const detailsValue = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 0',
};

const detailsValueHighlight = {
  color: '#22c55e',
  fontSize: '20px',
  fontWeight: 'bold',
  padding: '8px 0',
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
