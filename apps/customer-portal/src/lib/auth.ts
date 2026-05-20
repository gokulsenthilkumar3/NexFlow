const TOKEN_KEY = 'portal_token';
const EMAIL_KEY = 'portal_email';

export const getPortalToken  = ()          => localStorage.getItem(TOKEN_KEY);
export const setPortalToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearPortalToken = ()         => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY); };
export const getPortalEmail  = ()          => localStorage.getItem(EMAIL_KEY) ?? '';
export const setPortalEmail  = (e: string) => localStorage.setItem(EMAIL_KEY, e);
export const isAuthenticated = ()          => Boolean(getPortalToken());
