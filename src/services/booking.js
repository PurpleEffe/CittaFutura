import { getConfig } from './config.js';
import { t } from './i18n.js';

let submitting = false;

export function isSubmitting() {
  return submitting;
}

export async function submitBooking(formData) {
  if (submitting) {
    throw new Error('rate-limit');
  }

  const checkin = formData.get('checkin');
  const checkout = formData.get('checkout');
  if (checkin && checkout && new Date(checkin) >= new Date(checkout)) {
    throw new Error('invalid-dates');
  }

  if (formData.get('website')) {
    throw new Error('spam-detected');
  }

  submitting = true;
  try {
    const config = await getConfig();
    if (!config.staticman?.enabled || !config.staticman.endpoint) {
      throw new Error('staticman-disabled');
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const safeTimestamp = createdAt.replace(/[:.]/g, '-');
    const slug = `${safeTimestamp}_${id}`;

    const payload = {
      options: {
        slug,
      },
      fields: {
        id,
        houseId: formData.get('houseId'),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        checkin,
        checkout,
        people: parseInt(formData.get('people'), 10) || 1,
        notes: formData.get('notes') || '',
        status: 'pending',
        createdAt,
        source: 'web-form',
      },
    };

    const response = await fetch(config.staticman.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error('staticman-error');
      error.responseText = text;
      throw error;
    }

    return { ok: true };
  } finally {
    submitting = false;
  }
}

export function getFallbackLink(config) {
  if (config?.bookingIssueFallbackUrl) {
    return config.bookingIssueFallbackUrl;
  }
  return 'https://github.com';
}

export function getErrorMessage(error) {
  switch (error.message) {
    case 'rate-limit':
      return t('book.form.rateLimited');
    case 'invalid-dates':
      return t('book.form.invalidDates');
    case 'staticman-disabled':
      return `${t('book.form.error')} (${t('book.form.altChannel')})`;
    default:
      return t('book.form.error');
  }
}
