// // supabase/functions/create-payment-intent/index.ts
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// // Ensure you are using a Deno-compatible version of the Stripe SDK
// import Stripe from "https://esm.sh/stripe@12.12.0?target=deno&no-check";

// // Initialize Stripe with your secret key (set this in Supabase Edge Function environment variables)
// const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
//   httpClient: Stripe.createFetchHttpClient(), // Required for Deno
//   apiVersion: "2023-10-16", // Use your desired API version
// });

// console.log("Create Payment Intent function initialized.");

// serve(async (req: Request) => {
//   try {
//     const { amount, currency, userId, courseId, courseTitle, userEmail } = await req.json();

//     if (!amount || !currency || !userId || !courseId) {
//       return new Response(
//         JSON.stringify({ error: "Missing required parameters: amount, currency, userId, courseId" }),
//         { status: 400, headers: { "Content-Type": "application/json" } }
//       );
//     }
    
//     const S_amount = Math.round(Number(amount));
//     if (isNaN(S_amount) || S_amount <= 0) {
//         return new Response(JSON.stringify({ error: "Invalid amount" }), {
//             status: 400,
//             headers: { "Content-Type": "application/json" },
//         });
//     }

//     // Create or retrieve a Stripe customer
//     // This is good practice for saving payment methods and managing subscriptions.
//     // For simplicity, we'll create a new customer each time.
//     // In a real app, you'd likely check if a Stripe customer ID already exists for this userId.
//     const customer = await stripe.customers.create({
//       email: userEmail || undefined, // Optional: pass user's email
//       metadata: { supabase_user_id: userId },
//     });

//     // Create an Ephemeral Key for the Mobile SDK to authorize actions on the Customer
//     const ephemeralKey = await stripe.ephemeralKeys.create(
//       { customer: customer.id },
//       { apiVersion: '2023-10-16' } // Use the same API version
//     );

//     // Create a PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: S_amount, // Amount in the smallest currency unit (e.g., cents, paise)
//       currency: currency.toLowerCase(),
//       customer: customer.id,
//       automatic_payment_methods: {
//         enabled: true,
//       },
//       metadata: {
//         supabase_user_id: userId,
//         course_id: courseId,
//         course_title: courseTitle || "Course Purchase",
//       },
//       description: `Enrollment for course: ${courseTitle || courseId}`,
//     });

//     return new Response(
//       JSON.stringify({
//         paymentIntentId: paymentIntent.id,
//         clientSecret: paymentIntent.client_secret,
//         ephemeralKey: ephemeralKey.secret,
//         customer: customer.id,
//         // publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY"), // Not strictly needed here, but can be useful
//       }),
//       { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } } // Allow CORS
//     );
//   } catch (error) {
//     console.error("Error in create-payment-intent function:", error);
//     return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, // Allow CORS
//     });
//   }
// });
// supabase/functions/create-payment-intent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.12.0?target=deno&no-check";

const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

console.log("Unified Payment Intent function initialized.");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use generic names now: itemId and itemTitle
    const { amount, currency, userId, itemId, itemTitle, userEmail } = await req.json();
    console.log("Received payment payload:", { amount, currency, userId, itemId, itemTitle, userEmail });

    // --- More Generic Validation ---
    if (!amount || !currency || !userId || !userEmail) {
      throw new Error("Missing required parameters: amount, currency, userId, or userEmail.");
    }

    const numericAmount = Math.round(Number(amount));
    // Stripe requires a minimum amount, usually 50 cents/paise
    if (isNaN(numericAmount) || numericAmount < 50) {
      throw new Error(`Invalid or too small amount for payment: ${numericAmount}`);
    }
    // --- End Validation ---

    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { supabase_user_id: userId },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

const paymentIntent = await stripe.paymentIntents.create({
  amount: numericAmount,
  currency: currency.toLowerCase(),
  customer: customer.id,
  // --- THIS IS THE FINAL, CORRECTED VERSION ---
  payment_method_types: ['card'],
  // --- END OF FIX ---
  description: `Lynkt Purchase: ${itemTitle || 'Order'}`,
  metadata: {
    supabase_user_id: userId,
    item_id: itemId || 'N/A',
    item_title: itemTitle || "Lynkt Purchase",
  },
});

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});