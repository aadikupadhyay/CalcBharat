import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service',
  description: 'CalcBharat terms of service. Rules for using our free calculator platform.',
};

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <h1>Terms of Service</h1>
      <p className="updated">Last updated: April 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using CalcBharat (the &quot;Website&quot;), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our Website.</p>

      <h2>2. Use of Service</h2>
      <p>CalcBharat provides free online calculators and converters for informational and educational purposes. You may use our tools for personal, educational, and commercial purposes without restriction.</p>

      <h2>3. Accuracy Disclaimer</h2>
      <p>While we strive for accuracy, the results provided by our calculators are <strong>estimates</strong> and should not be considered as financial, legal, medical, or professional advice. Results may vary due to rounding, assumptions, or changing regulations. Always verify results with qualified professionals before making important decisions.</p>

      <h2>4. No Financial Advice</h2>
      <p>Nothing on this website constitutes financial advice, investment advice, tax advice, or legal advice. Our finance calculators (SIP, EMI, GST, Tax, etc.) use simplified models and assumptions. Actual outcomes may differ based on market conditions, tax law changes, and individual circumstances.</p>

      <h2>5. Intellectual Property</h2>
      <p>All content on CalcBharat, including text, designs, calculator logic, and branding, is the intellectual property of CalcBharat. You may not reproduce, distribute, or create derivative works without our written consent.</p>

      <h2>6. Limitation of Liability</h2>
      <p>CalcBharat shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our calculators or reliance on their results. Use our tools at your own risk.</p>

      <h2>7. Third-Party Links</h2>
      <p>Our website may contain links to third-party websites (e.g., investment platforms, banks). We are not responsible for the content, privacy practices, or accuracy of external websites.</p>

      <h2>8. Modifications</h2>
      <p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the updated terms.</p>

      <h2>9. Contact</h2>
      <p>For questions about these terms, visit our <Link href="/contact/">Contact Us</Link> page.</p>
    </div>
  );
}
