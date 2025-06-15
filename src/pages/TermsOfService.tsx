import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const TermsOfService: React.FC = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
      <Card className="p-6 md:p-8 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Terms of Service
        </h1>
        <p className="text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </Card>

      <section className="mb-8">
        <p className="text-foreground mb-6">
          Welcome to Full Moon Odds. These Terms of Service ("Terms") govern your access to and use of the Full Moon Odds
          website and services (collectively, the "Service"). Please read these Terms carefully before using the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="text-foreground mb-4">
          By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms,
          you may not access or use the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
        <p className="text-foreground mb-4">
          Full Moon Odds provides sports betting predictions and analysis based on astrological data and statistical models.
          Our Service is for entertainment purposes only and should not be considered as financial or betting advice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
        <p className="text-foreground mb-4">
          To access certain features of the Service, you may be required to create an account. You are responsible for
          maintaining the confidentiality of your account information and for all activities that occur under your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
        <p className="text-foreground mb-4">
          The Service and its original content, features, and functionality are owned by Full Moon Odds and are protected
          by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
        <p className="text-foreground mb-4">
          In no event shall Full Moon Odds, nor its directors, employees, partners, agents, suppliers, or affiliates,
          be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation,
          loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Your access to or use of or inability to access or use the Service</li>
          <li>Any conduct or content of any third party on the Service</li>
          <li>Any content obtained from the Service</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Disclaimer</h2>
        <p className="text-foreground mb-4">
          The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Full Moon Odds makes no representations or
          warranties of any kind, express or implied, as to the operation of the Service or the information, content,
          materials, or products included on the Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Changes to Terms</h2>
        <p className="text-foreground mb-4">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide
          notice of any changes by posting the new Terms on this page and updating the "Last Updated" date.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
        <p className="text-foreground mb-4">
          These Terms shall be governed and construed in accordance with the laws of the State of [Your State],
          without regard to its conflict of law provisions.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
        <p className="text-foreground mb-4">
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="mb-6">
          Email: <a href="mailto:legal@astrobetadvisor.com" className="text-primary hover:underline">
            legal@fullmoonodds.com
          </a>
        </p>
        
        <div className="mt-12 pt-6 border-t border-border">
          <Link to="/" className="block text-center">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Full Moon Odds. All rights reserved.
      </footer>
    </div>
  );
};

export default TermsOfService;
