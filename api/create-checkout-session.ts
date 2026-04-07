import {
  getAppUrl,
  getAuthenticatedUserFromRequest,
  getEnv,
  getStripeClient,
  getUserProfileById,
} from './_lib/server';

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const profile = await getUserProfileById(user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (profile.is_premium) {
      return res.status(409).json({ error: 'Premium is already active for this account.' });
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const customerEmail = profile.email || user.email;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${appUrl}/success`,
      cancel_url: `${appUrl}/cancel`,
      customer_email: customerEmail,
      line_items: [
        {
          price: getEnv('STRIPE_PRICE_ID'),
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        email: customerEmail,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          email: customerEmail,
        },
      },
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Stripe session URL missing.' });
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error', error);
    const message =
      error instanceof Error ? error.message : 'Unable to create checkout session.';
    return res.status(500).json({ error: message });
  }
}
