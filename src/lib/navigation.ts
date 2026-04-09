const APP_PATH = '/app';
const LEGACY_APP_HASH_PREFIX = '#/app';

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

function splitSearchAndHash(value: string) {
  const hashIndex = value.indexOf('#');

  if (hashIndex === -1) {
    return {
      search: value,
      hash: '',
    };
  }

  return {
    search: value.slice(0, hashIndex),
    hash: value.slice(hashIndex),
  };
}

export function isAppPath(pathname: string) {
  return normalizePathname(pathname) === APP_PATH;
}

export function isGuestModeEnabledFromLocation(location: Location) {
  const params = new URLSearchParams(location.search);
  return params.get('guest') === '1';
}

export function buildAppUrl(options?: { guest?: boolean; hash?: string }) {
  const url = new URL(window.location.href);
  url.pathname = APP_PATH;
  url.search = '';
  url.hash = options?.hash ?? '';

  if (options?.guest) {
    url.searchParams.set('guest', '1');
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function replaceLocation(url: string) {
  window.history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function clearGuestModeInUrl() {
  const url = new URL(window.location.href);

  if (!url.searchParams.has('guest')) {
    return;
  }

  url.searchParams.delete('guest');
  replaceLocation(`${url.pathname}${url.search}${url.hash}`);
}

export function normalizeLegacyAppHashUrl() {
  const { pathname, hash } = window.location;

  if (!hash.startsWith(LEGACY_APP_HASH_PREFIX)) {
    return false;
  }

  const suffix = hash.slice(LEGACY_APP_HASH_PREFIX.length);
  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = APP_PATH;
  nextUrl.search = '';
  nextUrl.hash = '';

  if (suffix.startsWith('?')) {
    const { search, hash: nextHash } = splitSearchAndHash(suffix);
    nextUrl.search = search;
    nextUrl.hash = nextHash;
  } else if (suffix.startsWith('#')) {
    nextUrl.hash = suffix;
  }

  const nextRelativeUrl = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  console.info('[supabase-magic-link] normalized legacy hash route', {
    from: `${pathname}${hash}`,
    to: nextRelativeUrl,
  });
  window.history.replaceState(null, '', nextRelativeUrl);
  return true;
}
