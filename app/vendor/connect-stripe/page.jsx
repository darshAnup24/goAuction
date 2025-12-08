import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import StripeConnectStatus from '@/components/StripeConnectStatus';

const prisma = new PrismaClient();

export const metadata = {
  title: 'Stripe Connect - Vendor Dashboard',
  description: 'Connect your Stripe account to receive payouts'
};

export default async function StripeConnectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user is a vendor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      stripeConnectedAccountId: true,
      stripeOnboardingComplete: true
    }
  });

  if (user.role !== 'VENDOR') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stripe Connect
          </h1>
          <p className="text-gray-600">
            Manage your payment settings and receive payouts from sold auctions
          </p>
        </div>

        {/* Main Status Card */}
        <StripeConnectStatus />

        {/* Additional Information */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Connect Your Account
                </h3>
                <p className="text-sm text-gray-600">
                  Click "Connect Stripe Account" and complete the onboarding process with your business or personal information.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  List Your Products
                </h3>
                <p className="text-sm text-gray-600">
                  Create auctions for your products. When they sell, buyers pay through our secure checkout.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Automatic Payouts
                </h3>
                <p className="text-sm text-gray-600">
                  When a buyer pays, 95% of the sale price is automatically transferred to your Stripe account (5% platform fee).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Receive Funds
                </h3>
                <p className="text-sm text-gray-600">
                  Stripe deposits funds to your bank account according to your payout schedule (typically 2-3 business days).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <FAQItem
              question="How much does it cost?"
              answer="GoCart charges a 5% platform fee on each sale. Stripe also charges their standard processing fee (2.9% + $0.30 per transaction). These fees are automatically deducted from your payouts."
            />

            <FAQItem
              question="When do I receive payouts?"
              answer="Payouts are processed automatically by Stripe according to your payout schedule, typically 2-3 business days after a successful payment. You can view your payout schedule in the Stripe Dashboard."
            />

            <FAQItem
              question="Can I change my bank account?"
              answer="Yes, you can update your bank account details anytime in your Stripe Dashboard. Changes may require verification before payouts resume."
            />

            <FAQItem
              question="What if my auction sold before I connected?"
              answer="If an auction was already paid before you connected your Stripe account, our admin team can manually process the payout to your account once it's connected."
            />

            <FAQItem
              question="Is my information secure?"
              answer="Yes. We use Stripe, a PCI Level 1 certified payment processor trusted by millions of businesses. Your banking and personal information is encrypted and securely stored by Stripe."
            />

            <FAQItem
              question="Can I disconnect my account?"
              answer="Yes, you can disconnect your Stripe account at any time. However, you won't be able to receive automatic payouts for future sales until you reconnect."
            />
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            If you're having trouble connecting your account or have questions about payouts, our support team is here to help.
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:support@gocart.com"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              Contact Support
            </a>
            <a
              href="https://stripe.com/docs/connect"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-semibold border border-blue-200"
            >
              Stripe Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-semibold text-gray-900 group-open:text-blue-600">
          {question}
        </span>
        <svg
          className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="mt-2 text-sm text-gray-600 pl-4 border-l-2 border-gray-200">
        {answer}
      </p>
    </details>
  );
}
