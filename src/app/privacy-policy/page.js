export const metadata = {
  title: 'Privacy Policy',
  description: 'CalcBharat privacy policy. Learn how we handle your data, cookies, and third-party services.',
};

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: April 2026</p>

      <h2>1. Information We Collect</h2>
      <p>CalcBharat is a free, client-side calculator platform. We do not require registration, login, or any personal information to use our tools. All calculator inputs are processed entirely in your browser and are <strong>never sent to our servers</strong>.</p>

      <h2>2. Cookies and Analytics</h2>
      <p>We may use cookies for:</p>
      <ul>
        <li><strong>Analytics:</strong> Google Analytics to understand traffic patterns, page views, and user demographics in aggregate form. This helps us improve our tools.</li>
        <li><strong>Advertising:</strong> Google AdSense may place cookies to serve relevant ads. These cookies allow Google and its partners to show ads based on your browsing history.</li>
      </ul>
      <p>You can manage cookie preferences through your browser settings. Most browsers allow you to block or delete cookies.</p>

      <h2>3. Third-Party Services</h2>
      <p>We integrate the following third-party services:</p>
      <ul>
        <li><strong>Google Analytics</strong> — for anonymous traffic analysis. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a></li>
        <li><strong>Google AdSense</strong> — for serving advertisements. Google may use cookies and web beacons to collect data for ad personalization.</li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>Since we do not collect personal data, there is no personal data to retain. Analytics data is stored by Google as per their data retention policies.</p>

      <h2>5. Children&apos;s Privacy</h2>
      <p>CalcBharat does not knowingly collect information from children under 13. Our calculators are educational tools accessible to all ages.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Opt out of personalized advertising via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google&apos;s Ad Settings</a></li>
        <li>Disable cookies in your browser settings</li>
        <li>Contact us for any privacy-related concerns</li>
      </ul>

      <h2>7. Changes to This Policy</h2>
      <p>We may update this privacy policy periodically. Changes will be posted on this page with an updated date.</p>

      <h2>8. Contact</h2>
      <p>For questions about this privacy policy, please visit our <a href="/contact/">Contact Us</a> page.</p>
    </div>
  );
}
