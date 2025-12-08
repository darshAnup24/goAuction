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

export default function AuctionWonEmail({
  winnerName = 'Winner',
  productName = 'Product',
  finalBid = '0',
  productId = '',
  sellerName = 'Seller',
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head />
      <Preview>Congratulations! You won {productName} for ${finalBid}</Preview>
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
              <span style={badge}>🎉 Auction Won</span>
            </Section>

            <Heading style={h1}>Congratulations, You Won!</Heading>
            
            <Text style={text}>
              Hi <strong>{winnerName}</strong>,
            </Text>
            
            <Text style={text}>
              Fantastic news! You've won the auction for <strong>{productName}</strong>! 🏆
            </Text>

            {/* Win Details Box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>Auction Results</Text>
              <Hr style={hr} />
              
              <table style={detailsTable}>
                <tr>
                  <td style={detailsLabel}>Item Won:</td>
                  <td style={detailsValue}>{productName}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Winning Bid:</td>
                  <td style={winningBidValue}>${finalBid}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Seller:</td>
                  <td style={detailsValue}>{sellerName}</td>
                </tr>
              </table>
            </Section>

            <Heading style={h2}>What Happens Next?</Heading>

            <Section style={stepsContainer}>
              <Text style={step}>
                <span style={stepNumber}>1</span>
                <span style={stepText}><strong>Complete Payment</strong> - Click the button below to securely pay for your item</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>2</span>
                <span style={stepText}><strong>Shipping Arranged</strong> - The seller will be notified and will arrange shipping</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>3</span>
                <span style={stepText}><strong>Receive Your Item</strong> - Enjoy your new purchase!</span>
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/orders`}>
                Complete Payment Now
              </Button>
            </Section>

            <Text style={urgentText}>
              ⏰ <strong>Payment Due:</strong> Please complete your payment within 48 hours to avoid order cancellation.
            </Text>

            <Text style={text}>
              Thank you for being part of the GoCart community!
            </Text>

            <Text style={text}>
              Best regards,<br />
              The GoCart Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} GoCart. All rights reserved.
            </Text>
            <Text style={footerText}>
              Questions? Contact us at support@gocart.com
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
  backgroundColor: '#d1fae5',
  color: '#065f46',
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

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '600',
  margin: '32px 0 16px',
};

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const detailsBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #86efac',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const detailsTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#166534',
  margin: '0 0 12px',
};

const hr = {
  borderColor: '#86efac',
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

const winningBidValue = {
  color: '#22c55e',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '8px 0',
};

const stepsContainer = {
  margin: '24px 0',
};

const step = {
  display: 'flex',
  alignItems: 'flex-start',
  margin: '16px 0',
  fontSize: '15px',
  lineHeight: '22px',
};

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

const stepText = {
  color: '#475569',
  flex: 1,
};

const buttonContainer = {
  textAlign: 'center',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#22c55e',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 32px',
};

const urgentText = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '20px',
  margin: '24px 0',
  textAlign: 'center',
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
