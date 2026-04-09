import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: {
    default: 'CalcBharat – Free Indian Calculators & Converters',
    template: '%s | CalcBharat',
  },
  description: 'Free online calculators for Finance, Real Estate, Academic & Unit Conversions. SIP, GST, EMI, CGPA, Salary and more – built for India.',
  keywords: ['calculator', 'India', 'SIP calculator', 'GST calculator', 'EMI calculator', 'CGPA converter', 'unit converter', 'free tools'],
  authors: [{ name: 'CalcBharat' }],
  openGraph: {
    title: 'CalcBharat – Free Indian Calculators & Converters',
    description: '50+ free tools for Finance, Real Estate, Academic & Unit Conversions – built for India.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'CalcBharat',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
