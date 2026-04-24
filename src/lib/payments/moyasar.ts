// Moyasar Payment Gateway - Stub
// TODO: تفعيل عند الجاهزية

export interface MoyasarPayment {
  amount: number
  currency: string
  description: string
  callback_url: string
  source: { type: 'creditcard' | 'applepay' | 'stcpay'; name?: string; number?: string; cvc?: string; month?: string; year?: string }
}

// export async function createPayment(payment: MoyasarPayment) {
//   const res = await fetch('https://api.moyasar.com/v1/payments', {
//     method: 'POST',
//     headers: { 'Authorization': `Basic ${Buffer.from(process.env.MOYASAR_SECRET_KEY + ':').toString('base64')}`, 'Content-Type': 'application/json' },
//     body: JSON.stringify(payment),
//   })
//   return res.json()
// }

// export async function getPayment(id: string) {
//   const res = await fetch(`https://api.moyasar.com/v1/payments/${id}`, {
//     headers: { 'Authorization': `Basic ${Buffer.from(process.env.MOYASAR_SECRET_KEY + ':').toString('base64')}` },
//   })
//   return res.json()
// }

export const moyasar = { enabled: false }
