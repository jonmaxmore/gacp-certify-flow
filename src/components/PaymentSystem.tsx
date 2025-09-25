import React, { useState } from 'react';

const PaymentSystem = () => {
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');

  const fees = {
    application: 5000,
    review: 2000,
    certificate: 1000,
  };

  const handlePayment = () => {
    // Integrate payment gateway logic here
    // Example: Call API for payment processing based on selected payment method
  };

  const verifyPayment = (paymentId: string) => {
    // Implement payment verification logic here
  };

  return (
    <div>
      <h1>Payment System for GACP Certification</h1>
      <label>
        Select Payment Method:
        <select onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="">Select...</option>
          <option value="PromptPay">PromptPay</option>
          <option value="BankTransfer">Bank Transfer</option>
          <option value="CreditCard">Credit Card</option>
        </select>
      </label>

      <h2>Fees:</h2>
      <ul>
        <li>Application: {fees.application}฿</li>
        <li>Review: {fees.review}฿</li>
        <li>Certificate: {fees.certificate}฿</li>
      </ul>

      <button onClick={handlePayment}>Proceed to Payment</button>
    </div>
  );
};

export default PaymentSystem;