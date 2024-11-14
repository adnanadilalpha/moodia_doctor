// Add this logging middleware at the top of your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers
  });
  next();
});

// Update your CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.0.102:3000'], // Add your frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Update your checkout session endpoint
app.post('/stripe/create-checkout-session', authenticate, async (req, res) => {
  console.log('Received checkout session request:', req.body);
  const { priceId, doctorId } = req.body;
  const uid = req.user.uid;

  try {
    console.log('Creating/retrieving Stripe customer...');
    // Get or create Stripe customer
    const userDoc = await firestore.collection('users').doc(uid).get();
    let customerId = userDoc.exists ? userDoc.data().stripeCustomerId : null;

    if (!customerId) {
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { firebaseUID: uid }
      });
      customerId = customer.id;
      await firestore.collection('users').doc(uid).set(
        { stripeCustomerId: customerId },
        { merge: true }
      );
    }

    console.log('Creating checkout session...');
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
      }
    });

    console.log('Checkout session created:', session.id);
    res.status(200).json({ 
      sessionId: session.id,
      url: session.url // Add the URL to the response
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Get Doctor's Subscription Status
app.get('/api/doctors/:doctorId/subscription', authenticate, async (req, res) => {
  const { doctorId } = req.params;

  try {
    const doctorDoc = await firestore.collection('doctors').doc(doctorId).get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const subscriptionData = doctorDoc.data()?.subscription || {
      status: 'inactive',
      planId: null,
      currentPeriodEnd: null
    };
    
    res.status(200).json(subscriptionData);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Get Doctor's Availability
app.get('/api/doctors/:doctorId/availability', authenticate, async (req, res) => {
  const { doctorId } = req.params;

  try {
    const doctorDoc = await firestore.collection('doctors').doc(doctorId).get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const availability = doctorDoc.data()?.availability || [];
    res.status(200).json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update Doctor's Availability
app.put('/api/doctors/:doctorId/availability', authenticate, async (req, res) => {
  const { doctorId } = req.params;
  const { availability } = req.body;

  try {
    await firestore.collection('doctors').doc(doctorId).set({
      availability: availability
    }, { merge: true });

    res.status(200).json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// ... rest of your server code ... 