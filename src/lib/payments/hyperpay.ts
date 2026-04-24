// HyperPay Payment Gateway - Stub
// TODO: تفعيل عند الجاهزية

// export async function prepareCheckout(params: { amount: number; currency: string; merchantTransactionId: string; customer: { email: string; givenName: string; surname: string } }) {
//   const data = new URLSearchParams({
//     entityId: process.env.HYPERPAY_ENTITY_ID!, amount: params.amount.toFixed(2), currency: params.currency,
//     paymentType: 'DB', merchantTransactionId: params.merchantTransactionId,
//     'customer.email': params.customer.email, 'customer.givenName': params.customer.givenName, 'customer.surname': params.customer.surname,
//   })
//   const res = await fetch(`https://eu-prod.oppwa.com/v1/checkouts`, {
//     method: 'POST', headers: { 'Authorization': `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN!}` }, body: data,
//   })
//   return res.json()
// }

// export async function getPaymentStatus(checkoutId: string) {
//   const res = await fetch(`https://eu-prod.oppwa.com/v1/checkouts/${checkoutId}/payment?entityId=${process.env.HYPERPAY_ENTITY_ID!}`, {
//     headers: { 'Authorization': `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN!}` },
//   })
//   return res.json()
// }

export const hyperpay = { enabled: false }
