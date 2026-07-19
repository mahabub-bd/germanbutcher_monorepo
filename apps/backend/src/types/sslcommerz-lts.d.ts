declare module 'sslcommerz-lts' {
  interface SSLCommerzPaymentData {
    total_amount: string | number;
    currency: string;
    tran_id: string;
    success_url: string;
    fail_url: string;
    cancel_url: string;
    ipn_url: string;
    shipping_method: string;
    product_name: string;
    product_category: string;
    product_profile: string;
    cus_name: string;
    cus_email: string;
    cus_add1: string;
    cus_add2?: string;
    cus_city: string;
    cus_state: string;
    cus_postcode: string;
    cus_country: string;
    cus_phone: string;
    cus_fax?: string;
    ship_name: string;
    ship_add1: string;
    ship_add2?: string;
    ship_city: string;
    ship_state: string;
    ship_postcode: string | number;
    ship_country: string;
    value_a?: string | number;
    value_b?: string | number;
    value_c?: string | number;
    value_d?: string | number;
    multi_card_name?: string;
    emi_option?: number;
    allowed_bin?: string;
    card_type?: string;
  }

  interface SSLCommerzInitResponse {
    GatewayPageURL?: string;
    status?: string;
    sessionkey?: string;
    redirectGatewayURL?: string;
  }

  interface SSLCommerzIPNResponse {
    tran_id: string;
    val_id: string;
    amount: string;
    card_type: string;
    store_amount: string;
    bank_tran_id: string;
    status: string;
    tran_date: string;
    currency: string;
    card_no: string;
    card_holder: string;
    currency_type: string;
    currency_amount: string;
    currency_rate: string;
    base_fair: string;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
    risk_level: number;
    risk_title: string;
  }

  interface SSLCommerzRefundResponse {
    status: string;
    refund_ref_id?: string;
    transaction_id?: string;
    refunded_amount?: string;
    refund_remarks?: string;
    errorReason?: string;
    APIConnect?: string;
    [key: string]: any; // Allow additional properties
  }

  interface SSLCommerzTransactionQueryResponse {
    status: string;
    tran_id: string;
    errorReason?: string;
  }

  class SSLCommerzPayment {
    constructor(storeId: string, storePassword: string, isLive: boolean);

    init(data: SSLCommerzPaymentData): Promise<SSLCommerzInitResponse>;

    validate(validationData: { val_id: string }): Promise<SSLCommerzValidationResponse>;

    query(transactionId: string): Promise<SSLCommerzTransactionQueryResponse>;

    initiateRefund(refundData: {
      refund_amount: string | number;
      refund_remarks: string;
      bank_tran_id: string;
      refe_id: string;
    }): Promise<SSLCommerzRefundResponse>;

    static initTransaction(
      storeId: string,
      storePassword: string,
      isLive: boolean,
      data: SSLCommerzPaymentData,
    ): Promise<SSLCommerzInitResponse>;
  }

  interface SSLCommerzValidationResponse {
    status: string;
    tran_id: string;
    val_id: string;
    amount: string;
    card_type: string;
    store_amount: string;
    bank_tran_id: string;
    currency: string;
    error?: string;
  }

  export default SSLCommerzPayment;
}
