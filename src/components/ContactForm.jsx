"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendEmailAction } from "@/app/actions/sendEmail";
import ReCAPTCHA from "react-google-recaptcha";

const initialState = { success: false, error: null, message: null };

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(sendEmailAction, initialState);
  const recaptchaRef = useRef(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  useEffect(() => {
    if (state.success && recaptchaRef.current) {
      recaptchaRef.current.reset();
      setRecaptchaToken(null);
    }
  }, [state.success]);

  const onRecaptchaChange = (token) => setRecaptchaToken(token);
  const onRecaptchaExpired = () => setRecaptchaToken(null);
  const isFormValid = !!recaptchaToken;

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: '1px solid #f1f5f9',
      fontFamily: 'inherit',
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: '1.5rem',
        marginTop: 0,
      }}>
        Get in Touch
      </h2>

      {state.success && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.9rem 1rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: '12px',
          textAlign: 'center',
          fontWeight: '500',
          fontSize: '0.9rem',
        }}>
          {state.message}
        </div>
      )}

      {state.error && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.9rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: '12px',
          textAlign: 'center',
          fontWeight: '500',
          fontSize: '0.9rem',
        }}>
          {state.error}
        </div>
      )}

      <form action={formAction}>
        {/* Honeypot — visually & functionally hidden from real users */}
        <div style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          tabIndex: -1,
        }} aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex="-1"
            autoComplete="off"
          />
        </div>

        {/* Name */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name" style={labelStyle}>Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Your Name"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={e => Object.assign(e.target.style, inputStyle)}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="your.email@example.com"
            style={inputStyle}
            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
            onBlur={e => Object.assign(e.target.style, inputStyle)}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="message" style={labelStyle}>Message</label>
          <textarea
            id="message"
            name="message"
            required
            rows="5"
            placeholder="How can we help you?"
            style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
            onFocus={e => Object.assign(e.target.style, { ...inputStyle, ...inputFocusStyle, resize: 'vertical', minHeight: '120px' })}
            onBlur={e => Object.assign(e.target.style, { ...inputStyle, resize: 'vertical', minHeight: '120px' })}
          />
        </div>

        {/* ReCAPTCHA */}
        <div style={{
          margin: '1.25rem 0',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "YOUR_SITE_KEY"}
            onChange={onRecaptchaChange}
            onExpired={onRecaptchaExpired}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !isFormValid}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: isPending || !isFormValid ? '#fdba74' : '#ea580c',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '12px',
            cursor: isPending || !isFormValid ? 'not-allowed' : 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s',
            marginTop: '0.5rem',
            boxShadow: '0 2px 8px rgba(234,88,12,0.25)',
          }}
        >
          {isPending ? (
            <>
              <svg
                style={{ animation: 'spin 1s linear infinite', width: '20px', height: '20px' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </button>
      </form>
    </div>
  );
}

// ── Shared style objects ──────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#334155',
  marginBottom: '0.4rem',
};

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.95rem',
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const inputFocusStyle = {
  ...inputStyle,
  borderColor: '#ea580c',
  boxShadow: '0 0 0 3px rgba(234,88,12,0.12)',
};
