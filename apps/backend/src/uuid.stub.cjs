// uuid@13 is ESM-only; Jest's CJS runtime can't load it. Stub the bits we use.
module.exports = {
  v4: () => require('crypto').randomUUID(),
  validate: (s) => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s),
};
