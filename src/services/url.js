export function resolveSitePath(path = '') {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : '/';

  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;

  if (!trimmedBase || trimmedBase === '') {
    return `/${trimmedPath}`;
  }

  if (trimmedBase === '.') {
    return `./${trimmedPath}`;
  }

  return `${trimmedBase}/${trimmedPath}`;
}
