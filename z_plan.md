For our Next.js app, we want an API sort of like this

/api
  /health           -GET
  /email            -POST
  /upload           -POST
  /auth
    /login          -POST
    /logout         -POST
    /refresh        -POST
    /me             -GET
  /amenities        -GET
  /listings         -GET -POST
    /[id]           -GET -PUT -DELETE
  /users
    /register
    /profile
  /reservations
    /[id]
      /approve
      /reject
      /cancel
  /payment-plans
    /[id]
  /payments
    /create-checkout
    /installments
    /[id]
      /pay
  /deposits
    /authorize
    /capture
    /release
  /webhooks
    /stripe
  
  Project Stack:
  Next.js with App router, TailwindCSS 4.0, Resend for email sending,
  Supabase for the database, Supabase storage for images, Next.js
  API routes for our API, Access and Refresh token JWT Auth, NOT USING
  SUPABASE, do not use Supabase's auth or use Supabase on the Client,
  only on the API routes, do not use semicolons where unnecessary,
  Zustand stores will be used for state management, we are using only
  JavaScript, NOT TypeScript, add high quality comments to all code,
  make code concise, modular, and self-documenting, jsdocs can help
  with this


```

```

**DO NOT INCLUDE POSITIONS in LISTINGS OR ANYTHING, this app doesn't need to be that complex**

How this should work is that our database should already contain
1 admin that we manually put in there, and all the amenities
and their categories that a admin on the frontend could choose, this
data is from our public/json/icons.json which has all the amenity
categories and names, this is all used on the frontend for a admin
to create a json object we'll use to make a new listing, on the
frontend we'll also have a multi-step form that should be able
to be used for both the creation and editing of a form, these
forms for listings will also need to get images, which we will
want to upload to supabase storage and get the url, all of this
should be done through our next.js api routes though, I'm aware
we can use supabase on the client, but we WILL NOT, we will only
interact with supabase via our next.js api routes

Here is the name of our supabase storage bucket,


```js

"supabase-bucket-storage": property-images
```

For listings we will have to create them accordingly and have data sort
of similar to our listings right here, we are using SQL, so we'll
make this response object in the get route,

```json
{
  "Properties": [
    {
      "id": 1,
      "host_id": 1,
      
      "title": "Beautiful Apartment",
      "description": "A beautiful apartment in the city center.",
      "price": 120,
      "price_description": "daily",
      "currency": "USD",
      "main_image": "https://placehold.co/1024x1024/png?text=Main+Image",
      "side_image1": "https://placehold.co/1024x1024/png?text=Side+Image+1",
      "side_image2": "https://placehold.co/1024x1024/png?text=Side+Image+2",
      "extra_images": [
        "https://placehold.co/1024x1024/png?text=Side+Image+3",
        "https://placehold.co/1024x1024/png?text=Side+Image+4",
        "https://placehold.co/1024x1024/png?text=Side+Image+5"
      ],

      "location": {
        "address": "123 Main St, New York, NY",
        "street": "123 Main St",
        "apt": "Apt 1",
        "city": "New York",
        "state": "NY",
        "zip": "10001",
        "country": "USA",
        "latitude": 40.7128,
        "longitude": -74.0060
      },

      "number_of_guests": 4,
      "number_of_bedrooms": 2,
      "number_of_beds": 3,
      "additional_info": "House rules: No smoking, no pets. Check-in after 3 PM, check-out before 11 AM.",
      "amenities": {
        "Scenic Views": {
          "Beach view": true,
          "Garden view": true
        },
        "Bathroom": {
          "Hair dryer": true,
          "Shampoo": true,
          "Hot water": true,
          "Shower gel": true
        },
        "Entertainment": {
          "TV": true
        }
      },

      "is_active": true,
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    },
    {
      "id": 2,
      "host_id": 2,
      "title": "Cozy Cottage",
      "description": "A cozy cottage in the countryside.",
      "price": 150,
      "price_description": "for five days",
      "currency": "USD",
      "main_image": "https://placehold.co/1024x1024/png?text=Main+Image",
      "side_image1": "https://placehold.co/1024x1024/png?text=Side+Image+1",
      "side_image2": "https://placehold.co/1024x1024/png?text=Side+Image+2",
      "extra_images": [
        "https://placehold.co/1024x1024/png?text=Side+Image+3",
        "https://placehold.co/1024x1024/png?text=Side+Image+4",
        "https://placehold.co/1024x1024/png?text=Side+Image+5"
      ],

      "location": {
        "address": "456 Elm St, Springfield, IL",
        "street": "456 Elm St",
        "apt": "",
        "city": "Springfield",
        "state": "IL",
        "zip": "62701",
        "country": "USA",
        "latitude": 39.7817,
        "longitude": -89.6501
      },

      "number_of_guests": 6,
      "number_of_bedrooms": 3,
      "number_of_beds": 3,
      "additional_info": "",
      "amenities": {
        "Scenic Views": {
          "Mountain view": true
        },
        "Bathroom": {
          "Conditioner": true,
          "Body soap": true,
          "Cleaning products": true
        },
        "Bedroom and laundry": {
          "Washing machine": true,
          "Dryer": true
        },
        "Entertainment": {
          "TV": true
        }
      },
      "is_active": true,
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    }
  ]
}
```

DATABASE TO RUN IN SUPABASE, SETUP QUERY
```sql

```

And our example .env,
```SHELL
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# Resend Email
RESEND_API_KEY=
ADMIN_EMAIL=

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

```


our general app file structure

my-app/
  .next/
  node_modules/
  public/
    json/
      icons.json
      listingDetails.json
      Properties.json
    main/
      image.png
    svg/
      red-logo-full.svg
      red-logo.svg
  src/
    app/
      (admin)/
        admin/
          listings/
            [id]/
              edit/
                page.js
              page.js
            create/
              page.js
            testing/
              page.js
          page.js
        layout.js
      (site)/
        about/
          page.js
        contact/
          page.js
        listings/
          [id]/
            page.js
        layout.js
        page.js
      api/
        amenities/
          route.js
        auth/
          login/
            route.js
          logout/
            route.js
          me/
            route.js
          refresh/
            route.js
        email/
          route.js
        health/
          route.js
        listings/
          [id]/
            route.js
          route.js
        upload/
          route.js
      components/
        admin/
          forms/
            BasicInfoFormStep.jsx
            ConfirmSubmitStep.jsx
            DetailsFormStep.jsx
            FormStepper.jsx
            LocationFormStep.jsx
            PropertyForm.jsx
          AdminListings.jsx
          AdminLogin.jsx
          AdminNav.jsx
        site/
          Footer.jsx
          Hero.jsx
          ImageGallery.jsx
          ListingCard.jsx
          Listings.jsx
          Loading.jsx
          LoadingSpinner.jsx
          Navbar.jsx
        svg/
          icons.jsx
      lib/
        auth.js -- helper functions for auth, tokens, etc --
      schemas/
        -- empty --
      services/
        supabase.js
      stores/
        authStore.js
        propertyForm.jsx
      globals.css
      layout.js
    middleware.js
    .env.local
    .gitignore
    jsconfig.json
    next.config.mjs
    package-lock.json
    package.json
    postcss.config.mjs
    README.md


Remember DON'T use Supabase on the Client, only through our API,
you can use absolute imports for the project if you'd like, our
Client will make requests using the basic Fetch Web API, you can
make a custom solution for handling access token refresh and
request retries, don't use Axios Interceptors, just make some
class or function to help with this, API requests will likely
be made in zustand stores to adjust state accordingly

Try to stick to our file structure provided as much as possible unless you truly need to make a new file for better code

Here is our supabase.js file,
```js
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for server-side usage
// We only use this on the server side, never on the client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;
```

