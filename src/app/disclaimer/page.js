export const metadata = {
  title: 'Disclaimer',
  description: 'CalcBharat disclaimer. Important notices about calculator accuracy and limitations.',
};

export default function Disclaimer() {
  return (
    <div className="legal-page">
      <h1>Disclaimer</h1>
      <p className="updated">Last updated: April 2026</p>

      <h2>General Disclaimer</h2>
      <p>The calculators and tools provided on CalcBharat are for <strong>informational and educational purposes only</strong>. Results are estimates based on the inputs you provide and the formulas used. They should not be relied upon as the sole basis for financial, medical, legal, or other important decisions.</p>

      <h2>Financial Calculator Disclaimer</h2>
      <p>Our financial calculators (SIP, EMI, GST, FD, Salary, Tax, etc.) use simplified models. Actual results may differ due to:</p>
      <ul>
        <li>Changes in interest rates, tax laws, and government policies</li>
        <li>Individual financial circumstances and tax situations</li>
        <li>Market volatility and economic conditions</li>
        <li>Bank-specific terms, fees, and processing charges</li>
        <li>Rounding differences and calculation methodology</li>
      </ul>
      <p>Always consult a qualified financial advisor, chartered accountant, or banker before making investment or loan decisions.</p>

      <h2>Health Calculator Disclaimer</h2>
      <p>BMI, calorie, water intake, and pregnancy calculators provide general estimates only. They are not a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare provider for medical decisions.</p>

      <h2>Currency and Market Data</h2>
      <p>Currency exchange rates shown are indicative/reference rates and may not reflect actual bank rates. Always verify with your bank or authorized dealer before any foreign exchange transaction.</p>

      <h2>No Warranty</h2>
      <p>CalcBharat provides tools &quot;as is&quot; without warranty of any kind, express or implied. We do not guarantee the accuracy, completeness, or reliability of any calculation results.</p>

      <h2>Affiliate Links</h2>
      <p>Some pages may contain affiliate links to financial products and services. We may earn a commission if you sign up through these links, at no extra cost to you. This does not affect our tool accuracy or recommendations.</p>
    </div>
  );
}
