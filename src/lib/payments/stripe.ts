// Stripe Payment Gateway - Stub
// TODO: تفعيل عند الجاهزية

// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

// export async function createCheckoutSession(priceId: string, customerId: string, successUrl: string, cancelUrl: string) {
//   return stripe.checkout.sessions.create({
//     mode: 'subscription', customer: customerId,
//     line_items: [{ price: priceId, quantity: 1 }],
//     success_url: successUrl, cancel_url: cancelUrl,
//   })
// }

// export async function createCustomer(email: string, name: string) {
//   return stripe.customers.create({ email, name })
// }

// export async function cancelSubscription(subscriptionId: string) {
//   return stripe.subscriptions.cancel(subscriptionId)
// }

export const stripe = { enabled: false }
