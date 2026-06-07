// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../common/services/prisma.service';
// import Stripe from 'stripe';



// @Injectable()
// export class StripeService {
//     private stripe: Stripe;

//     constructor(
//         private config: ConfigService,
//         private prisma: PrismaService,
//     ) {
//         this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY'), {
//             apiVersion: '2026-02-25.clover',
//         });
//     }

//     // ============================================
//     // CLIENT STRIPE — créer ou récupérer
//     // ============================================
//     async getOrCreateCustomer(userId: number): Promise<string> {
//         const user = await this.prisma.user.findUnique({ where: { id: userId } });
//         if (!user) throw new NotFoundException('Utilisateur introuvable');

//         // Si l'utilisateur a déjà un customer Stripe, on le retourne
//         if (user.stripeCustomerId) return user.stripeCustomerId;

//         // Sinon on le crée sur Stripe
//         const customer = await this.stripe.customers.create({
//             email: user.email,
//             name: user.name,
//             metadata: { userId: String(userId) },
//         });

//         // On sauvegarde l'ID Stripe en base
//         await this.prisma.user.update({
//             where: { id: userId },
//             data: { stripeCustomerId: customer.id },
//         });

//         return customer.id;
//     }

//     // ============================================
//     // ABONNEMENTS
//     // ============================================

//     // Créer une session de paiement pour s'abonner
//     async createSubscriptionCheckout(userId: number, plan: 'monthly' | 'yearly') {
//         const customerId = await this.getOrCreateCustomer(userId);

//         // Prix Stripe selon le plan (vous créerez ces prix dans le dashboard Stripe)
//         const priceId = plan === 'monthly'
//             ? this.config.get('STRIPE_PRICE_MONTHLY')
//             : this.config.get('STRIPE_PRICE_YEARLY');

//         const session = await this.stripe.checkout.sessions.create({
//             customer: customerId,
//             mode: 'subscription',
//             payment_method_types: ['card'],
//             line_items: [{ price: priceId, quantity: 1 }],
//             success_url: `${this.config.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${this.config.get('FRONTEND_URL')}/payment/cancel`,
//             metadata: { userId: String(userId), plan },
//         });

//         return { url: session.url, sessionId: session.id };
//     }

//     // Annuler un abonnement
//     async cancelSubscription(userId: number) {
//         const subscription = await this.prisma.subscription.findUnique({
//             where: { userId },
//         });

//         if (!subscription) throw new NotFoundException('Aucun abonnement actif');

//         // Annulation à la fin de la période en cours (pas immédiatement)
//         await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
//             cancel_at_period_end: true,
//         });

//         await this.prisma.subscription.update({
//             where: { userId },
//             data: { status: 'canceled' },
//         });

//         return { message: 'Abonnement annulé à la fin de la période' };
//     }

//     // Récupérer l'abonnement actuel
//     async getSubscription(userId: number) {
//         return this.prisma.subscription.findUnique({ where: { userId } });
//     }

//     // ============================================
//     // TRANSFERTS — envoyer de l'argent
//     // ============================================
//     async sendMoney(senderId: number, receiverEmail: string, amount: number, description?: string) {
//         if (amount <= 0) throw new BadRequestException('Le montant doit être positif');
//         if (amount > 10000) throw new BadRequestException('Montant maximum : 10 000€');

//         // Trouver le destinataire
//         const receiver = await this.prisma.user.findUnique({
//             where: { email: receiverEmail },
//         });
//         if (!receiver) throw new NotFoundException('Destinataire introuvable');
//         if (receiver.id === senderId) throw new BadRequestException('Vous ne pouvez pas vous envoyer de l\'argent');

//         // S'assurer que le destinataire a un customer Stripe
//         await this.getOrCreateCustomer(receiver.id);

//         // Créer un PaymentIntent (simulation de transfert en mode test)
//         const paymentIntent = await this.stripe.paymentIntents.create({
//             amount: Math.round(amount * 100), // en centimes
//             currency: 'eur',
//             description: description || `Transfert de ${amount}€`,
//             metadata: {
//                 senderId: String(senderId),
//                 receiverId: String(receiver.id),
//                 type: 'transfer',
//             },
//         });

//         // Sauvegarder la transaction en base
//         const transaction = await this.prisma.transaction.create({
//             data: {
//                 senderId,
//                 receiverId: receiver.id,
//                 amount,
//                 currency: 'eur',
//                 stripeTransferId: paymentIntent.id,
//                 status: 'pending',
//                 description: description || `Transfert vers ${receiver.name}`,
//             },
//         });

//         return {
//             transactionId: transaction.id,
//             clientSecret: paymentIntent.client_secret,
//             amount,
//             receiver: { name: receiver.name, email: receiver.email },
//         };
//     }

//     // Historique des transactions
//     async getTransactions(userId: number) {
//         const [sent, received] = await Promise.all([
//             this.prisma.transaction.findMany({
//                 where: { senderId: userId },
//                 include: { receiver: { select: { name: true, email: true, avatarUrl: true } } },
//                 orderBy: { createdAt: 'desc' },
//             }),
//             this.prisma.transaction.findMany({
//                 where: { receiverId: userId },
//                 include: { sender: { select: { name: true, email: true, avatarUrl: true } } },
//                 orderBy: { createdAt: 'desc' },
//             }),
//         ]);

//         return { sent, received };
//     }

//     // ============================================
//     // WEBHOOKS — confirmer les événements Stripe
//     // ============================================
//     async handleWebhook(rawBody: Buffer, signature: string) {
//         const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
//         let event: Stripe.Event;

//         try {
//             event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
//         } catch {
//             throw new BadRequestException('Webhook signature invalide');
//         }

//         switch (event.type) {
//             // Abonnement créé ou renouvelé avec succès
//             case 'checkout.session.completed': {
//                 const session = event.data.object as Stripe.Checkout.Session;
//                 if (session.mode === 'subscription') {
//                     await this.handleSubscriptionCreated(session);
//                 }
//                 break;
//             }

//             // Paiement de transfert confirmé
//             case 'payment_intent.succeeded': {
//                 const intent = event.data.object as Stripe.PaymentIntent;
//                 if (intent.metadata?.type === 'transfer') {
//                     await this.prisma.transaction.updateMany({
//                         where: { stripeTransferId: intent.id },
//                         data: { status: 'completed' },
//                     });
//                 }
//                 break;
//             }

//             // Abonnement supprimé
//             case 'customer.subscription.deleted': {
//                 const sub = event.data.object as Stripe.Subscription;
//                 await this.prisma.subscription.updateMany({
//                     where: { stripeSubscriptionId: sub.id },
//                     data: { status: 'canceled' },
//                 });
//                 break;
//             }

//             // Paiement abonnement échoué
//             case 'invoice.payment_failed': {
//                 const invoice = event.data.object as Stripe.Invoice;
//                 await this.prisma.subscription.updateMany({
//                     where: { stripeSubscriptionId: invoice.subscription as string },
//                     data: { status: 'past_due' },
//                 });
//                 break;
//             }
//         }

//         return { received: true };
//     }

//     private async handleSubscriptionCreated(session: Stripe.Checkout.Session) {
//         const userId = parseInt(session.metadata?.userId);
//         const plan = session.metadata?.plan;

//         const stripeSubscription = await this.stripe.subscriptions.retrieve(
//             session.subscription as string,
//         );

//         await this.prisma.subscription.upsert({
//             where: { userId },
//             create: {
//                 userId,
//                 stripeSubscriptionId: stripeSubscription.id,
//                 stripePriceId: stripeSubscription.items.data[0].price.id,
//                 status: stripeSubscription.status,
//                 currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
//                 plan,
//             },
//             update: {
//                 stripeSubscriptionId: stripeSubscription.id,
//                 status: stripeSubscription.status,
//                 currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
//                 plan,
//             },
//         });
//     }
// }