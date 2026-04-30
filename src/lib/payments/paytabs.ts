// PayTabs Payment Gateway - Stub
// TODO: تفعيل عند الجاهزية

// export async function createPayPage(params: { amount: number; currency: string; order_id: string; customer: { name: string; email: string; phone: string }; return_url: string; callback_url: string }) {
//   const res = await fetch('https://secure.paytabs.sa/payment/request', {
//     method: 'POST',
//     headers: { 'Authorization': process.env.PAYTABS_SERVER_KEY!, 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       profile_id: process.env.PAYTABS_PROFILE_ID, tran_type: 'sale', tran_class: 'ecom',
//       cart_id: params.order_id, cart_description: 'Sends Bot Subscription', cart_currency: params.currency, cart_amount: params.amount,
//       customer_details: params.customer, return: params.return_url, callback: params.callback_url,
//     }),
//   })
//   return res.json()
// }

// export async function verifyPayment(tranRef: string) {
//   const res = await fetch('https://secure.paytabs.sa/payment/query', {
//     method: 'POST',
//     headers: { 'Authorization': process.env.PAYTABS_SERVER_KEY!, 'Content-Type': 'application/json' },
//     body: JSON.stringify({ profile_id: process.env.PAYTABS_PROFILE_ID, tran_ref: tranRef }),
//   })
//   return res.json()
// }

export const paytabs = { enabled: false }
