import React, { useState } from "react";

interface MockPaymentButtonProps {
  onPaid: () => void;
  amount: number;
  label?: string;
}

export default function MockPaymentButton({ onPaid, amount, label }: MockPaymentButtonProps) {
  const [paid, setPaid] = useState(false);
  return (
    <div style={{textAlign:"center"}}>
      <p>จำนวนเงินที่ต้องชำระ: <b>{amount?.toLocaleString()} บาท</b></p>
      {!paid ? (
        <button
          style={{background:"#43a047",color:"#fff",padding:"12px 24px",borderRadius:8,fontSize:18,fontWeight:600,border:"none"}}
          onClick={() => { setPaid(true); onPaid && onPaid(); }}
        >{label || "ชำระเงิน (Mock)"}</button>
      ) : (
        <span style={{color:"green",fontWeight:600,fontSize:18}}>✓ ชำระเงินเรียบร้อย (จำลอง)</span>
      )}
    </div>
  );
}