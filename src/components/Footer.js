import Link from 'next/link';
import { CATEGORIES_ORDER, CAT_META } from '@/data/categories';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Calc<span>Bharat</span></div>
            <p className="footer-tagline">
              India&apos;s free calculator hub — 50+ tools for Finance, Real Estate, Academic &amp; Unit Conversions.
              No login, no downloads, no cost. Built for India.
            </p>
          </div>
          <div>
            <div className="footer-heading">Categories</div>
            <ul className="footer-links">
              {CATEGORIES_ORDER.map(cat => (
                <li key={cat}>
                  <Link href="/calculators/">{CAT_META[cat].icon} {CAT_META[cat].label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="footer-heading">Popular</div>
            <ul className="footer-links">
              <li><Link href="/finance/sip-calculator/">SIP Calculator</Link></li>
              <li><Link href="/finance/gst-calculator/">GST Calculator</Link></li>
              <li><Link href="/finance/home-loan-emi-calculator/">Home Loan EMI</Link></li>
              <li><Link href="/finance/salary-calculator/">Salary Calculator</Link></li>
              <li><Link href="/academic/cgpa-to-percentage/">CGPA to %</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Legal</div>
            <ul className="footer-links">
              <li><Link href="/about/">About Us</Link></li>
              <li><Link href="/contact/">Contact Us</Link></li>
              <li><Link href="/privacy-policy/">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service/">Terms of Service</Link></li>
              <li><Link href="/disclaimer/">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} CalcBharat. All rights reserved. Built with ❤️ for India.
        </div>
      </div>
    </footer>
  );
}
