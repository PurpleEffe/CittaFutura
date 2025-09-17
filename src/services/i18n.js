import { dictionary, defaultLanguage, languages } from '../i18n.js';

const STORAGE_KEY = 'citta-futura-lang';
let currentLanguage = defaultLanguage;

export function getCurrentLanguage() {
  return currentLanguage;
}

export function t(key, lang = currentLanguage) {
  const entry = dictionary[key];
  if (!entry) {
    console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }
  return entry[lang] ?? entry[defaultLanguage] ?? key;
}

export function setLanguage(lang, { persist = true } = {}) {
  if (!languages.includes(lang)) {
    console.warn(`[i18n] Unsupported language: ${lang}`);
    return;
  }
  currentLanguage = lang;
  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn('[i18n] Unable to persist language', error);
    }
  }
  document.documentElement.lang = lang;
  applyTranslations(lang);
  document.dispatchEvent(new CustomEvent('language:changed', { detail: { lang } }));
}

export function initLanguage() {
  let lang = defaultLanguage;
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && languages.includes(stored)) {
      lang = stored;
    }
  }
  setLanguage(lang, { persist: false });
}

export function applyTranslations(lang = currentLanguage, root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key, lang);
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    el.innerHTML = t(key, lang);
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const attrPairs = el.dataset.i18nAttr.split(',');
    attrPairs.forEach((pair) => {
      const [attr, key] = pair.split(':').map((item) => item.trim());
      if (attr && key) {
        el.setAttribute(attr, t(key, lang));
      }
    });
  });
}
