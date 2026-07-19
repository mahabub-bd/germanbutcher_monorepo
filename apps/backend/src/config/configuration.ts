export default () => ({
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    isLive: process.env.SSLCOMMERZ_IS_LIVE,
  },
  payment: {
    successUrl: process.env.PAYMENT_SUCCESS_URL,
    failUrl: process.env.PAYMENT_FAIL_URL,
    cancelUrl: process.env.PAYMENT_CANCEL_URL,
    ipnUrl: process.env.PAYMENT_IPN_URL,
    baseUrl: process.env.BASE_URL,
    frontendUrl: process.env.FRONTEND_URL,
  },
});
