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

export default function PaymentReceivedEmail({
  sellerName = 'Seller',
  buyerName = 'Buyer',
  amount = '0',
  productName = 'Product',
  platformFee = '0',
  sellerPayout = '0',
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return (
    <Html>
      <Head />
      <Preview>Payment of ${amount} received for {productName}</Preview>
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
              <span style={badge}>💰 Payment Received</span>
            </Section>

            <Heading style={h1}>Payment Received!</Heading>
            
            <Text style={text}>
              Hi <strong>{sellerName}</strong>,
            </Text>
            
            <Text style={text}>
              Excellent news! <strong>{buyerName}</strong> has completed payment for <strong>{productName}</strong>.
            </Text>

            {/* Payment Details Box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>Payment Breakdown</Text>
              <Hr style={hr} />
              
              <table style={detailsTable}>
                <tr>
                  <td style={detailsLabel}>Sale Amount:</td>
                  <td style={detailsValue}>${amount}</td>
                </tr>
                <tr>
                  <td style={detailsLabel}>Platform Fee (5%):</td>
                  <td style={feeValue}>-${platformFee}</td>
                </tr>
                <tr style={totalRow}>
                  <td style={totalLabel}>Your Payout:</td>
                  <td style={payoutValue}>${sellerPayout}</td>
                </tr>
              </table>
            </Section>

            <Heading style={h2}>Next Steps</Heading>

            <Section style={stepsContainer}>
              <Text style={step}>
                <span style={stepNumber}>1</span>
                <span style={stepText}><strong>Prepare the Item</strong> - Package the item securely for shipping</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>2</span>
                <span style={stepText}><strong>Ship to Buyer</strong> - Send the item to the buyer's address (provided in your dashboard)</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>3</span>
                <span style={stepText}><strong>Update Tracking</strong> - Add tracking information so the buyer can monitor delivery</span>
              </Text>
              <Text style={step}>
                <span style={stepNumber}>4</span>
                <span style={stepText}><strong>Receive Payout</strong> - Your payout will be transferred to your Stripe account</span>
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/store/orders`}>
                View Order Details
              </Button>
            </Section>

            <Text style={infoText}>
              💳 <strong>Payout Information:</strong> If you have a Stripe account connected, funds will be automatically transferred (95% of sale price). Otherwise, you can connect your account or request manual payout from admin.
            </Text>

            <Text style={text}>
              Thank you for being a valued seller on GoCart!
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
              Questions about payouts? Visit your <a href={`${appUrl}/vendor/connect-stripe`} style={footerLink}>Stripe Connect settings</a>
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
  margin: '12px 0 20px',
};

const detailsTable = {
  width: '100%',
};

const detailsLabel = {
  color: '#64748b',
  fontSize: '14px',
  padding: '8px 0',
};

const detailsValue = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  padding: '8px 0',
  textAlign: 'right',
};

const feeValue = {
  color: '#64748b',
  fontSize: '14px',
  padding: '8px 0',
  textAlign: 'right',
};

const totalRow = {
  borderTop: '2px solid #86efac',
};

const totalLabel = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 0 8px',
};

const payoutValue = {
  color: '#22c55e',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '12px 0 8px',
  textAlign: 'right',
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
