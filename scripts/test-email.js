#!/usr/bin/env node
/**
 * Test Email Script
 * 
 * This script tests the email system by calling the test API endpoint.
 * Make sure your Next.js dev server is running on http://localhost:3000
 * 
 * Usage:
 *   node scripts/test-email.js                          # Sends to default email
 *   node scripts/test-email.js your-email@example.com   # Sends to specified email
 *   node scripts/test-email.js --all                    # Tests all email templates
 */

const http = require('http');

// Get email from command line or use default
const args = process.argv.slice(2);
const testEmail = args.find(arg => !arg.startsWith('--')) || 'chavandarshan24@gmail.com';
const testAll = args.includes('--all');
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🧪 GoCart Email Testing Tool\n');

// Helper function to make HTTP POST request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test-email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ ok: res.statusCode === 200, status: res.statusCode, data: response });
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Main execution
async function runTests() {
  console.log(`Target Email: ${testEmail}\n`);
  console.log(`API URL: ${API_URL}\n`);
  
  try {
    console.log('🚀 Sending test email(s)...\n');
    
    const response = await makeRequest(API_URL, {
      email: testEmail,
      template: testAll ? 'all' : 'welcome',
    });
    
    if (!response.ok) {
      console.error('❌ ERROR:', response.data.error || 'Failed to send test email');
      console.error('\nMake sure:');
      console.error('1. Your Next.js dev server is running (npm run dev)');
      console.error('2. RESEND_API_KEY is set in .env file');
      console.error('3. Your API is accessible at', API_URL);
      process.exit(1);
    }
    
    const data = response.data;
    console.log('✅', data.message, '\n');
    
    // Display results
    data.results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.template} Email sent successfully!`);
        console.log(`   Email ID: ${result.emailId || 'N/A'}`);
      } else {
        console.error(`❌ ${result.template} Email failed!`);
        console.error(`   Error: ${result.error}`);
      }
      console.log('');
    });
    
    console.log('📊 Summary:');
    const successful = data.results.filter(r => r.success).length;
    const failed = data.results.filter(r => !r.success).length;
    console.log(`   Sent: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log('\n✨ Check your inbox and Resend dashboard: https://resend.com/emails\n');
    
    if (!testAll) {
      console.log('💡 Tip: Use --all flag to test all email templates');
      console.log('   Example: node scripts/test-email.js --all\n');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your Next.js dev server is running (npm run dev)');
    console.error('2. Your API is accessible at', API_URL);
    process.exit(1);
  }
}

// Handle errors
runTests().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
