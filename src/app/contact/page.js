export const metadata = {
  title: 'Contact Us',
  description: 'Contact CalcBharat – get in touch for suggestions, bug reports, or partnership inquiries.',
};

import ContactForm from '@/components/ContactForm';

export default function Contact() {
  return (
    <div className="legal-page">
      <h1>Contact Us</h1>
      <p className="updated">We&apos;d love to hear from you!</p>

      <div className="contact-form-container my-10">
        <ContactForm />
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Other Ways to Reach Us</h2>
        <a 
          href="mailto:aadikupadhyayimp@gmail.com" 
          className="inline-flex items-center space-x-2 text-orange-600 font-semibold hover:text-orange-700 hover:underline transition-colors bg-orange-50 px-6 py-3 rounded-xl"
        >
          <span>📧</span>
          <span>aadikupadhyayimp@gmail.com</span>
        </a>
      </div>
    </div>
  );
}
