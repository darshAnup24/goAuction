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

export default function OutbidEmail({
  bidderName = 'Bidder',
  productName = 'Product',
  yourBid = '0',
  newBid = '0',
  productId = '',
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head />
      <Preview>You've been outbid on {productName} - Bid again now!</Preview>
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
              <span style={badge}>⚠️ Outbid Alert</span>
            </Section>

            <Heading style={h1}>You've Been Outbid!</Heading>
            
            <Text style={text}>
              Hi <strong>{bidderName}</strong>,
            </Text>
            
            <Text style={text}>
              Someone just placed a higher bid on <strong>{productName}</strong>. Don't let it slip away!
            </Text>

            {/* Bid Comparison Box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>Bid Update</Text>
              <Hr style={hr} />
              
              <table style={detailsTable}>
                <tr>
                  <td style={detailsLabel}>Your Bid:</td>
                  <td style={oldBidValue}>${yourBid}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Current High Bid:</td>
                  <td style={newBidValue}>${newBid}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Difference:</td>
                  <td style={differenceValue}>+${(parseFloat(newBid) - parseFloat(yourBid)).toFixed(2)}</td>
                </tr>
              </table>
            </Section>

            <Text style={urgentText}>
              ⏰ <strong>Act Fast!</strong> The auction could end at any time. Place a higher bid to stay in the game!
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/product/${productId}`}>
                Place Higher Bid
              </Button>
            </Section>

            <Text style={helpText}>
              💡 <strong>Quick Tip:</strong> Set a maximum bid amount you're comfortable with. Our system will automatically bid up to that amount for you.
            </Text>

            <Text style={text}>
              Good luck!<br />
              The GoCart Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} GoCart. All rights reserved.
            </Text>
            <Text style={footerText}>
              You're receiving this because you placed a bid on this auction.
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
  backgroundColor: '#fef3c7',
  color: '#92400e',
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
  backgroundColor: '#fef2f2',
  border: '2px solid #fecaca',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const detailsTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#991b1b',
  margin: '0 0 12px',
};

const hr = {
  borderColor: '#fecaca',
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
  width: '50%',
};

const oldBidValue = {
  color: '#64748b',
  fontSize: '16px',
  fontWeight: '600',
  padding: '8px 0',
  textDecoration: 'line-through',
};

const newBidValue = {
  color: '#dc2626',
  fontSize: '20px',
  fontWeight: 'bold',
  padding: '8px 0',
};

const differenceValue = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  padding: '8px 0',
};

const urgentText = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  color: '#92400e',
  fontSize: '15px',
  fontWeight: '500',
  lineHeight: '22px',
  margin: '24px 0',
  textAlign: 'center',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ef4444',
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
  backgroundColor: '#e0f2fe',
  border: '1px solid #7dd3fc',
  borderRadius: '8px',
  padding: '16px',
  color: '#075985',
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
