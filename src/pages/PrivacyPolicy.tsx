import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12 md:py-16">
      <Card className="p-6 md:p-8 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
      </Card>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="text-foreground mb-4">
          Welcome to Full Moon Odds. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you about how we look after your personal data when you visit our website 
          and tell you about your privacy rights and how the law protects you.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
        <h3 className="text-xl font-medium mb-3">Personal Data</h3>
        <p className="text-foreground mb-4">
          We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Identity Data (e.g., name, username, or similar identifier)</li>
          <li>Contact Data (e.g., email address)</li>
          <li>Technical Data (e.g., IP address, browser type and version)</li>
          <li>Usage Data (e.g., how you use our website and services)</li>
          <li>Marketing and Communications Data (e.g., your preferences in receiving marketing from us)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
        <p className="text-foreground mb-4">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>To provide and maintain our service</li>
          <li>To notify you about changes to our service</li>
          <li>To allow you to participate in interactive features of our service</li>
          <li>To provide customer support</li>
          <li>To gather analysis or valuable information so that we can improve our service</li>
          <li>To monitor the usage of our service</li>
          <li>To detect, prevent and address technical issues</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
        <p className="text-foreground">
          We have implemented appropriate security measures to prevent your personal data from being accidentally lost, 
          used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those 
          employees, agents, contractors, and other third parties who have a business need to know.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Your Legal Rights</h2>
        <p className="text-foreground mb-4">
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, 
          including the right to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Request access to your personal data</li>
          <li>Request correction of your personal data</li>
          <li>Request erasure of your personal data</li>
          <li>Object to processing of your personal data</li>
          <li>Request restriction of processing your personal data</li>
          <li>Request transfer of your personal data</li>
          <li>Right to withdraw consent</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
        <p className="text-foreground mb-4">
          If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <p className="mb-6">
          Email: <a href="mailto:privacy@astrobetadvisor.com" className="text-primary hover:underline">
            privacy@fullmoonodds.com
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

export default PrivacyPolicy;
