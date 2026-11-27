const VERIFICATION_LABELS = [
  'Officially Confirmed',
  'Unverified',
  'Community Report'
];

function migrateLegacyAdvisory(raw) {
  const verification = VERIFICATION_LABELS.includes(raw.verification)
    ? raw.verification
    : 'Unverified';
  // ...
}