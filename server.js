// Add this new endpoint for getting or creating a Stripe customer
app.post('/api/stripe/get-or-create-customer', authenticate, async (req, res) => {
  const { doctorId, email } = req.body;
  const uid = req.user.uid;

  try {
    // First check if user already has a Stripe customer ID
    const userDoc = await firestore.collection('users').doc(uid).get();
    let customerId = userDoc.exists ? userDoc.data().stripeCustomerId : null;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: { 
          firebaseUID: uid,
          doctorId: doctorId
        }
      });
      customerId = customer.id;

      // Update user document with new Stripe customer ID
      await firestore.collection('users').doc(uid).set(
        { stripeCustomerId: customerId },
        { merge: true }
      );

      console.log('Created new Stripe customer:', customerId);
    } else {
      console.log('Using existing customer:', customerId);
    }

    res.status(200).json({ customerId });
  } catch (error) {
    console.error('Error in get-or-create-customer:', error);
    res.status(500).json({ 
      error: 'Failed to get or create customer',
      message: error.message 
    });
  }
}); 

// Update the create-checkout-session endpoint
app.post('/api/stripe/create-checkout-session', authenticate, async (req, res) => {
  const { priceId, doctorId, doctorEmail } = req.body;
  
  if (!priceId || !doctorId) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      message: 'Price ID and Doctor ID are required' 
    });
  }

  const uid = req.user.uid;

  try {
    // First ensure the doctor document exists
    const doctorRef = firestore.collection('doctors').doc(doctorId);
    const doctorDoc = await doctorRef.get();
    let customerId;

    // Check if doctor already has a Stripe customer ID
    if (doctorDoc.exists) {
      const doctorData = doctorDoc.data();
      if (doctorData.subscription?.customerId) {
        customerId = doctorData.subscription.customerId;
        console.log('Using existing customer ID:', customerId);
      }
    }

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: doctorEmail,
        metadata: { 
          firebaseUID: uid,
          doctorId: doctorId
        }
      });
      customerId = customer.id;
      console.log('Created new customer ID:', customerId);

      // Update doctor document with the new customer ID
      await doctorRef.set({
        subscription: {
          customerId: customerId,
          status: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/setting?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/setting?canceled=true`,
      metadata: {
        doctorId: doctorId,
        firebaseUID: uid
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto'
      }
    });

    console.log('Created checkout session:', session.id);

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url,
      customerId: customerId
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}); 