export const metadata = {
  title: 'About Us',
  description: 'About CalcBharat – India\'s free calculator hub with 50+ tools for Finance, Real Estate, Academic & more. Built for India, by Indians.',
};

export default function About() {
  return (
    <div className="legal-page">
      <h1>About CalcBharat</h1>
      <p className="updated">Building tools India needs — for free.</p>

      <h2>Our Mission</h2>
      <p>CalcBharat was born from a simple observation: Indians deserve free, fast, and accurate online tools designed specifically for their needs. Most calculator websites are built for Western audiences — they use dollars, don&apos;t account for Indian tax regimes, and ignore local measurement units like Bigha, Gaj, and Tola that millions of Indians use daily.</p>

      <p>We built CalcBharat to change that. Every one of our 50+ tools is crafted with the Indian context in mind — from SIP calculations using realistic 12% CAGR assumptions to CGPA converters using the CBSE/AICTE standard, from GST calculators with CGST/SGST splits to land converters that know that 1 Bigha in UP is different from 1 Bigha in West Bengal.</p>

      <h2>What Makes Us Different</h2>
      <ul>
        <li><strong>🇮🇳 Built for India:</strong> Every formula, every tax slab, every unit conversion is designed for Indian users.</li>
        <li><strong>🆓 Always Free:</strong> No login, no subscription, no hidden charges. Every tool is 100% free, forever.</li>
        <li><strong>⚡ Blazing Fast:</strong> All calculations happen in your browser. Zero server calls. Instant results.</li>
        <li><strong>🔒 Private:</strong> Your data never leaves your browser. We don&apos;t store, track, or sell your calculation inputs.</li>
        <li><strong>📱 Mobile-First:</strong> Designed to work perfectly on mobile phones — because most Indians access the web on phones.</li>
      </ul>

      <h2>Our Tools</h2>
      <p>We offer 50+ tools across five categories:</p>
      <ul>
        <li><strong>Finance:</strong> SIP, EMI, GST, Salary, FD, PPF, NPS, Tax, CAGR, FIRE, and more</li>
        <li><strong>Real Estate:</strong> Stamp Duty, Construction Cost, Bigha Converter, Rent vs Buy</li>
        <li><strong>Academic:</strong> CGPA, GPA, Attendance, BMI, Speed-Distance-Time, Number Systems</li>
        <li><strong>Lifestyle:</strong> Fuel Cost, Calorie, Sleep, Water Intake, Electricity Bill, Pregnancy Due Date</li>
        <li><strong>Converters:</strong> Unit, Data Size, Currency, Number to Words, Area Calculator</li>
      </ul>

      <h2>Contact Us</h2>
      <p>Have suggestions, found a bug, or want to request a new calculator? We&apos;d love to hear from you. Visit our <a href="/contact/">Contact Us</a> page.</p>
    </div>
  );
}
