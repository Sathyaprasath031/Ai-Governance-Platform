// Utility for managing registered platform accounts in localStorage
// Only accounts that were previously registered or currently registered are kept.
// No mock/random accounts are included.

const STORAGE_KEY = 'gov_registered_accounts';

const ROLE_LABELS = {
  admin: 'Administrator',
  model_owner: 'Model Owner',
  reviewer: 'Reviewer',
  auditor: 'Auditor',
  viewer: 'Viewer',
};

const AVATAR_COLORS = [
  'bg-purple-600 text-white',
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-indigo-600 text-white',
];

export function getRoleTitle(role) {
  if (!role) return 'Workspace User';
  return (
    ROLE_LABELS[role] ||
    role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getAvatarColor(email = '') {
  let sum = 0;
  for (let i = 0; i < email.length; i++) {
    sum += email.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const FORBIDDEN_EMAILS = [
  'alex.turner@enterprise.ai',
  'elena.rostova@riskreview.io',
  'marcus.chen@complianceaudit.org',
];

/**
 * Returns the list of genuinely registered accounts (no random or dummy accounts).
 */
export function getRegisteredAccounts() {
  let list = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (err) {
    list = [];
  }

  // Purge any unwanted mock/dummy accounts if present from earlier builds
  list = list.filter(
    (a) => a && a.email && !FORBIDDEN_EMAILS.includes(a.email.toLowerCase().trim())
  );

  // Check currently active user
  try {
    const rawUser = localStorage.getItem('gov_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.email && !FORBIDDEN_EMAILS.includes(u.email.toLowerCase().trim())) {
        const found = list.find((a) => a.email.toLowerCase() === u.email.toLowerCase().trim());
        if (!found) {
          list.push({
            name: u.name || u.email.split('@')[0],
            email: u.email.trim(),
            role: u.role || 'admin',
            avatar: u.avatar,
            lastUsed: Date.now(),
          });
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Check last remembered email
  try {
    const lastEmail = localStorage.getItem('gov_last_email') || localStorage.getItem('gov_last_google_email');
    const lastName = localStorage.getItem('gov_last_google_name');
    if (lastEmail && !FORBIDDEN_EMAILS.includes(lastEmail.toLowerCase().trim())) {
      const found = list.find((a) => a.email.toLowerCase() === lastEmail.toLowerCase().trim());
      if (!found) {
        list.push({
          name: lastName || lastEmail.split('@')[0],
          email: lastEmail.trim(),
          role: 'admin',
          lastUsed: Date.now() - 5000,
        });
      }
    }
  } catch (e) {
    // ignore
  }

  // Include primary registered administrator account if not present
  const primaryAccountEmail = 'sathyaprasath031@gmail.com';
  if (!list.some((a) => a.email.toLowerCase() === primaryAccountEmail)) {
    list.push({
      name: 'Sathya Prasath',
      email: primaryAccountEmail,
      role: 'admin',
      lastUsed: Date.now() - 10000,
    });
  }

  // Deduplicate by email
  const seen = new Set();
  const deduped = [];
  for (const acc of list) {
    const key = acc.email.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(acc);
    }
  }

  // Sort by lastUsed descending
  deduped.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

  // Sync back to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
  } catch (e) {
    // ignore
  }

  return deduped;
}

/**
 * Saves a registered account (from registration, login, or Google sign-in).
 */
export function saveRegisteredAccount(account) {
  if (!account || !account.email) return;

  const emailClean = account.email.toLowerCase().trim();
  if (FORBIDDEN_EMAILS.includes(emailClean)) return;

  try {
    const list = getRegisteredAccounts();
    const existingIndex = list.findIndex((a) => a.email.toLowerCase() === emailClean);

    const updated = {
      name: account.name || account.email.split('@')[0],
      email: account.email.trim(),
      role: account.role || (existingIndex >= 0 ? list[existingIndex].role : 'admin'),
      avatar: account.avatar || account.picture,
      lastUsed: Date.now(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...updated };
    } else {
      list.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save registered account:', err);
  }
}

/**
 * Removes an account from the registered accounts chooser list.
 */
export function removeRegisteredAccount(email) {
  if (!email) return [];
  try {
    const list = getRegisteredAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase().trim()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    return [];
  }
}
