export const CACHE_KEY = 'calcbharat_live_rates';
export const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

// Hardcoded snapshot for absolute fallback
export const FALLBACK_RATES = {
  USD: 1.00, INR: 92.34, EUR: 0.85, GBP: 0.79, AED: 3.67, CAD: 1.35,
  AUD: 1.51, SGD: 1.34, JPY: 151.20, CNY: 7.23, SAR: 3.75, KWD: 0.31,
  OMR: 0.38, QAR: 3.64,
  // Approximate standard values for metals as fallback
  XAU: 2450.00, // Gold USD per troy ounce
  XAG: 30.50,   // Silver USD per troy ounce
};

export async function fetchRates() {
  if (typeof window === 'undefined') return FALLBACK_RATES;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      // If data is less than 60 mins old, use it straight away
      if (age < CACHE_EXPIRY_MS && parsed.rates) {
        return parsed.rates;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error', e);
  }

  // Fetch fresh
  try {
    const apiKey = process.env.NEXT_PUBLIC_CURRENCYFREAKS_API_KEY;
    if (!apiKey) {
      throw new Error('API key missing');
    }

    // Using CurrencyFreaks latest endpoint. Fetches all ~170+ fiat and metals (XAU, XAG).
    const res = await fetch(`https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}`);
    if (!res.ok) {
      throw new Error(`API fetch failed with status ${res.status} `);
    }
    const data = await res.json();
    if (data && data.rates) {
      // Parse rates to numbers (API returns strings)
      const numericRates = {};
      for (const [key, value] of Object.entries(data.rates)) {
        numericRates[key] = parseFloat(value);
      }

      const toStore = {
        timestamp: Date.now(),
        rates: numericRates,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
      return numericRates;
    } else {
      throw new Error('Invalid API configuration/response');
    }
  } catch (e) {
    console.warn('Network fetching failed, falling back to cache or snapshot:', e.message);
    // Silent fallback
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.rates) return parsed.rates;
      }
    } catch (err) { }

    return FALLBACK_RATES;
  }
}
