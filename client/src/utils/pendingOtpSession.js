const OTP_SESSION_LIFETIME_MS = 5 * 60 * 1000;

export const getPendingOtpSession = (key) => {
  try {
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;

    const session = JSON.parse(stored);
    if (!session.identifier || !session.issuedAt || Date.now() - session.issuedAt > OTP_SESSION_LIFETIME_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

export const savePendingOtpSession = (key, session) => {
  sessionStorage.setItem(key, JSON.stringify({ ...session, issuedAt: Date.now() }));
};

export const clearPendingOtpSession = (key) => {
  sessionStorage.removeItem(key);
};
