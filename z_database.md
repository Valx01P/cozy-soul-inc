
__* Database Setup SQL Query *__

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE, -- Required for OAuth users, null for others
  password TEXT, -- Required for password-based auth
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) NOT NULL DEFAULT 'guest', -- 'guest', 'admin'
  identity_verified BOOLEAN DEFAULT FALSE,
  profile_image VARCHAR(255) DEFAULT 'https://placehold.co/1024x1024/png?text=User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE emailverificationcodes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  code VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- can only get new once expired, then reset expires and attempts
  attempts INTEGER DEFAULT 3, -- 3 tries then wait until expired for new code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- on new code, just override the old one
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE emaillogs (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(50) NOT NULL, -- 'verification', 'notification', 'reminder', etc.
  is_read BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table for amenity categories
CREATE TABLE amenitiescategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Table for amenities
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  svg TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES amenitiescategories(id) ON DELETE CASCADE
);

-- Table for locations
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  address VARCHAR(255),
  street VARCHAR(255),
  apt VARCHAR(50),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL
);

-- Table for properties (listings)
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  main_image VARCHAR(255),
  side_image1 VARCHAR(255),
  side_image2 VARCHAR(255),
  minimum_stay INTEGER NOT NULL DEFAULT 1,
  location_id INTEGER NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  number_of_bedrooms INTEGER NOT NULL DEFAULT 1,
  number_of_beds INTEGER NOT NULL DEFAULT 1,
  number_of_bathrooms INTEGER NOT NULL DEFAULT 1,
  additional_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE TABLE additionalfees (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'flat', -- 'flat' or 'per_night'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Table for property images
CREATE TABLE propertyimages (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Junction table for property amenities
CREATE TABLE propertyamenities (
  property_id INTEGER NOT NULL,
  amenity_id INTEGER NOT NULL,
  PRIMARY KEY (property_id, amenity_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);

-- Payment Integration Update 4/13/2025

-- Table for property availability (calendars)
CREATE TABLE propertyavailability (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  price DECIMAL(10, 2) NOT NULL,
  availability_type VARCHAR(50) NOT NULL DEFAULT 'default', -- 'default', 'booked', 'blocked'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Table for conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Table for messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table for user participation in conversations (for quick access, previews, and notifications)
CREATE TABLE user_conversations (
  user_id INTEGER NOT NULL,
  conversation_id INTEGER NOT NULL,
  unread_count INTEGER DEFAULT 0,
  last_read_message_id INTEGER,
  is_hidden BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, conversation_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Table for reservations (core fields only)
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table for payment plans (one per reservation)
CREATE TABLE payment_plans (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL UNIQUE, -- ONE plan per reservation (1:1 relationship)
  created_by INTEGER NOT NULL, -- Admin who created the plan
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Table for installments (simplified)
CREATE TABLE installments (
  id SERIAL PRIMARY KEY,
  payment_plan_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'overdue'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE
);

-- Table for payments (simplified)
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  installment_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- pending, succeeded, failed, refunded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE
);

-- Table for reservation notifications for admins and users
CREATE TABLE reservationnotifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  reservation_id INTEGER,
  type VARCHAR(50) NOT NULL, -- reservation_request, reservation_approved, payment_success, etc.
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- Table for identity verification
CREATE TABLE identityverifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  stripe_verification_session_id VARCHAR(255) UNIQUE,
  verification_url VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected, expired, processing
  verification_type VARCHAR(50) NOT NULL DEFAULT 'id_document',
  submitted_at TIMESTAMP,
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

```


__* Drop Database *__
```sql
-- This will forcibly drop all tables regardless of dependencies
DROP TABLE IF EXISTS user_conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS reservationnotifications CASCADE;
DROP TABLE IF EXISTS identityverifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS installments CASCADE;
DROP TABLE IF EXISTS payment_plans CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS propertyavailability CASCADE;
DROP TABLE IF EXISTS propertyamenities CASCADE;
DROP TABLE IF EXISTS propertyimages CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS additionalfees CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS amenitiescategories CASCADE;
DROP TABLE IF EXISTS emaillogs CASCADE;
DROP TABLE IF EXISTS emailverificationcodes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Also drop the trigger function
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
```


```js
// Our supabase storage bucket name
property-images
profile-images
```


__* Database Seeding SQL Query *__

```sql
-- Insert admin user
INSERT INTO users (first_name, last_name, email, password, email_verified, role, identity_verified, profile_image)
VALUES ('Pablo', 'Valdes', 'example@gmail.com', 'password123', TRUE, 'admin', FALSE, 'https://placehold.co/1024x1024/png?text=Admin'),
('John', 'Doe', 'john.doe@example.com', 'password456', TRUE, 'guest', FALSE, 'https://placehold.co/1024x1024/png?text=User'),
('Alice', 'Smith', 'alice.smith@example.com', 'password789', FALSE, 'guest', FALSE, 'https://placehold.co/1024x1024/png?text=User');

-- Insert amenity categories
INSERT INTO amenitiescategories (name) VALUES 
('Scenic Views'),
('Bathroom'),
('Bedroom and laundry'),
('Entertainment'),
('Family'),
('Heating and cooling'),
('Home safety'),
('Internet and office'),
('Kitchen and dining'),
('Location features'),
('Outdoor'),
('Parking and facilities'),
('Services'),
('Not included');


-- Scenic Views
INSERT INTO amenities (category_id, name, svg) VALUES
(1,'Beach view','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 27c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 29c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 29c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 29c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 27c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 27c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 27zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 24c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 24c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 24c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 22c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 22c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 22zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 19c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 19c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 19c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 17c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 17c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 17zM16 1a9 9 0 0 1 8.76 11.07c.71.13 1.37.45 1.91.94.3.27.71.44 1.14.48l.19.01v2h-.23a3.96 3.96 0 0 1-2.44-1 1.95 1.95 0 0 0-1.14-.5H23.96a2 2 0 0 0-1.15.38l-.14.11A3.98 3.98 0 0 1 20 15.5a3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 14c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1 1.95 1.95 0 0 0-1.14-.5H7.96a2 2 0 0 0-1.15.38l-.14.11a3.96 3.96 0 0 1-2.44 1L4 15.5v-2h.19a1.95 1.95 0 0 0 1.14-.5 3.92 3.92 0 0 1 1.9-.93A9 9 0 0 1 16 1zm0 2a7 7 0 0 0-6.64 9.23c.49.17.93.43 1.31.78.35.32.83.49 1.33.49.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 12c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5a2 2 0 0 0 1.2-.38l.13-.11c.38-.35.82-.6 1.3-.78A7 7 0 0 0 16 3z"></path></svg>'),
(1,'Garden view', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a5 5 0 0 1 5 5 5 5 0 0 1 0 10 5 5 0 0 1-4 4.9v4.29A9.04 9.04 0 0 1 23.95 22a8.94 8.94 0 0 1 3.74.81l.31.15v2.33A6.96 6.96 0 0 0 23.95 24a6.88 6.88 0 0 0-6.93 5.87l-.02.15v.1a1 1 0 0 1-.88.87L16 31a1 1 0 0 1-.97-.77l-.02-.12A6.95 6.95 0 0 0 7.97 24 6.96 6.96 0 0 0 4 25.23v-2.31a9.16 9.16 0 0 1 11 2.3V20.9a5 5 0 0 1-4-4.68V16h-.22a5 5 0 0 1 0-10H11v-.22A5 5 0 0 1 16 1zm2.86 14.1a4.98 4.98 0 0 1-5.72 0l-.07.23a3 3 0 1 0 5.85 0zM11 8a3 3 0 1 0 .67 5.93l.23-.07A4.98 4.98 0 0 1 11 11c0-1.06.33-2.05.9-2.86l-.23-.07A3.01 3.01 0 0 0 11 8zm10 0c-.23 0-.45.03-.67.07l-.23.07c.57.8.9 1.8.9 2.86a4.98 4.98 0 0 1-.9 2.86l.23.07A3 3 0 1 0 21 8zm-5 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-5a3 3 0 0 0-2.93 3.67l.07.23a4.98 4.98 0 0 1 5.72 0l.07-.23A3 3 0 0 0 16 3z"></path></svg>'),
(1,'Mountain view', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V4a2 2 0 0 1 1.85-2H4zm-5.92 20H9.92L4 27.91V28h24v-.09zM28 4H4v21.08l12-12 12 12zM16 15.91 11.91 20h8.17zM22 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>'),
(1,'Ocean view', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2H4v15.5h.19c.37-.04.72-.17 1-.38l.14-.11A3.98 3.98 0 0 1 8 18c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 18c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 18c.99 0 1.94.35 2.67 1 .35.33.83.5 1.33.5v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1v3h.19c.37-.04.72-.17 1-.38l.14-.11A3.98 3.98 0 0 1 8 23c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 23c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 23c.99 0 1.94.35 2.67 1 .35.33.83.5 1.33.5v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1V28h24zm-6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>'),
(1,'City view', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V4a2 2 0 0 1 1.85-2H4zM15 13H9v8H4v7h24v-7h-3v4H15zm-3 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM28 4H4v15h3v-6a2 2 0 0 1 1.85-2H15a2 2 0 0 1 2 1.85V23h6v-2a2 2 0 0 1 1.85-2H28zM12 19a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm10-8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>');


-- Bathroom
INSERT INTO amenities (category_id, name, svg) VALUES
(2,'Hair dryer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M14 27v.2a4 4 0 0 1-3.8 3.8H4v-2h6.15a2 2 0 0 0 1.84-1.84L12 27zM10 1c.54 0 1.07.05 1.58.14l.38.07 17.45 3.65a2 2 0 0 1 1.58 1.79l.01.16v6.38a2 2 0 0 1-1.43 1.91l-.16.04-13.55 2.83 1.76 6.5A2 2 0 0 1 15.87 27l-.18.01h-3.93a2 2 0 0 1-1.88-1.32l-.05-.15-1.88-6.76A9 9 0 0 1 10 1zm5.7 24-1.8-6.62-1.81.38a9 9 0 0 1-1.67.23h-.33L11.76 25zM10 3a7 7 0 1 0 1.32 13.88l.33-.07L29 13.18V6.8L11.54 3.17A7.03 7.03 0 0 0 10 3zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>'),
(2,'Shampoo','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M20 1v2h-3v2h1a2 2 0 0 1 2 1.85V9a4 4 0 0 1 4 3.8V27a4 4 0 0 1-3.8 4H12a4 4 0 0 1-4-3.8V13a4 4 0 0 1 3.8-4h.2V7a2 2 0 0 1 1.85-2H15V3H8V1zm2 21H10v5a2 2 0 0 0 1.85 2H20a2 2 0 0 0 2-1.85V27zm0-6H10v4h12zm-2-5h-8a2 2 0 0 0-2 1.85V14h12v-1a2 2 0 0 0-2-2zm-2-4h-4v2h4z"></path></svg>'),
(2,'Hot water','<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m4 2v2h2l.001 2h-1.001c-1.1045695 0-2 .8954305-2 2v16.3846154c0 3.0720253 2.20424471 5.6153846 5 5.6153846h16c2.7957553 0 5-2.5433593 5-5.6153846v-9.3846154h-2l.0006267 2.2441864c-.2957862.1662973-.6415947.2556548-1.0003023.2558136-.3770726-.0001668-.7397707-.0987428-1.0448826-.2813581l-.147435-.0980881-.0698054-.0542225-.0669618-.0575717c-.1674894-.1516722-.3473184-.2870627-.5370123-.4056091-.1267551-.0791722-.2576057-.1507019-.3921007-.2145789l-.2041007-.0899647c-.4828805-.1966888-1.005996-.2986069-1.537908-.2986069-.1521835 0-.3034078.0083174-.453179.0247859l-.2234033.0307902c-.658505.1092272-1.2810008.3778141-1.8035225.7911936l-.1911344.1617761c-.3493432.3161496-.8261929.4912319-1.3293208.4914542-.5021258-.0002223-.9789755-.1753046-1.3283187-.4914542-.7261733-.6571745-1.6832835-1.0085458-2.6712392-1.0085458-.9878365 0-1.9453342.3515135-2.6706493 1.008332-.3497754.3163381-.8267557.4914457-1.3290263.491668-.502832-.0002223-.97980321-.1753492-1.32908476-.4912404-.72578749-.6572461-1.68328523-1.0087596-2.67112174-1.0087596-.34005846 0-.67646247.0416292-1.00105227.1230294l.00093437-8.1230294h4v2h2v-2c0-1.1045695-.8954305-2-2-2h-.999l-.001-2.001 2 .001v-2zm22.0003242 17.4999999c.3396204-.0001501.6755904-.0417799.9997827-.1230407v5.0076562c0 2.0259877-1.3775842 3.6153845-3.0001069 3.6153845h-16c-1.62252271 0-3-1.5893968-3-3.6153845l-.00148637-6.1285018c.29592169-.1666518.64208407-.2561137 1.00160427-.2561137.5026133 0 .97950576.1750753 1.32911493.4916681.72598912.6565871 1.68280283 1.0078952 2.67109137 1.0083319.9877-.0004367 1.9445263-.3517037 2.6710333-1.0087595.3491367-.3161652.8260292-.4912405 1.3286425-.4912405.5028479 0 .9795643.1750107 1.3292324.4914543.725724.6567679 1.6826278 1.008109 2.6713278 1.0085457.987581-.0004368 1.9447946-.351846 2.6704432-1.0085457.3496467-.3164242.826354-.4914543 1.3288787-.4914543.5028479 0 .9795643.1750107 1.3292324.4914543.6698295.6061843 1.5369688.9522395 2.4431705 1.0022354zm-8.0059505-15.50004556-1.999421.00109132c.0017379 1.66765868-.3914074 2.67484348-1.6096005 4.57626989l-.4357339.67326735c-1.1985316 1.8730246-1.7578573 3.1084741-1.9072678 4.7489216l2.013841.0007885c.1565646-1.2622433.6616712-2.2705308 1.7787146-3.9820993l.243287-.37580218c1.405662-2.19695557 1.9189882-3.50550246 1.9161806-5.64243718zm3.0005862.00002214c-.0019426 1.6881104-.3993036 2.69826243-1.6537336 4.66840333l-.3870791.60284703c-1.2033592 1.89238746-1.7606515 3.11545826-1.9109072 4.72843796h2.0148819c.1395749-1.0872185.5479182-1.9947141 1.4095297-3.3786139l.7616667-1.19781229c1.2938583-2.07979737 1.7634695-3.36210955 1.7656416-5.42219097zm5 0c-.0019426 1.6881104-.3993036 2.69826243-1.6537336 4.66840333l-.3870791.60284703c-1.2033592 1.89238746-1.7606515 3.11545826-1.9109072 4.72843796h2.0148819c.1395749-1.0872185.5479182-1.9947141 1.4095297-3.3786139l.7616667-1.19781229c1.2938583-2.07979737 1.7634695-3.36210955 1.7656416-5.42219097z"></path></svg>'),
(2,'Shower gel','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M18 1v2h-7v2h1a2 2 0 0 1 2 1.85V9.1a5 5 0 0 1 4 4.67V28a3 3 0 0 1-2.82 3H5a3 3 0 0 1-3-2.82V14a5 5 0 0 1 4-4.9V7a2 2 0 0 1 1.85-2H9V3H6V1h12zm-2 15.06c-1.14.15-2.08.6-3.58 1.55l-.34.23C9.63 19.41 8.29 20 6 20a9 9 0 0 1-2-.22V28a1 1 0 0 0 .88 1H15a1 1 0 0 0 1-.88V16.06zM27 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-14-2H7a3 3 0 0 0-3 2.82v3.89A6.85 6.85 0 0 0 6 18c1.63 0 2.64-.36 4.4-1.46l.64-.4c2.01-1.32 3.28-1.93 4.96-2.09V14a3 3 0 0 0-3-3zm14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM25 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 7H8v2h4V7zm13-3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(2,'Bathtub','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M7.5 2a4.5 4.5 0 0 1 4.47 4H14v2H8V6h1.95A2.5 2.5 0 0 0 5 6.34V16h26v2h-2v5a5 5 0 0 1-3 4.58V30h-2v-2H8v2H6v-2.42a5 5 0 0 1-3-4.34V18H1v-2h2V6.5A4.5 4.5 0 0 1 7.5 2zM27 18H5v5a3 3 0 0 0 2.65 2.98l.17.01L8 26h16a3 3 0 0 0 3-2.82V23z"></path></svg>'),
(2,'Conditioner','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M20 1v2h-3v2h1a2 2 0 0 1 2 1.85V9a4 4 0 0 1 4 3.8V27a4 4 0 0 1-3.8 4H12a4 4 0 0 1-4-3.8V13a4 4 0 0 1 3.8-4h.2V7a2 2 0 0 1 1.85-2H15V3H8V1zm2 21H10v5a2 2 0 0 0 1.85 2H20a2 2 0 0 0 2-1.85V27zm0-6H10v4h12zm-2-5h-8a2 2 0 0 0-2 1.85V14h12v-1a2 2 0 0 0-2-2zm-2-4h-4v2h4z"></path></svg>'),
(2,'Body soap','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M18 1v2h-7v2h1a2 2 0 0 1 2 1.85V9.1a5 5 0 0 1 4 4.67V28a3 3 0 0 1-2.82 3H5a3 3 0 0 1-3-2.82V14a5 5 0 0 1 4-4.9V7a2 2 0 0 1 1.85-2H9V3H6V1h12zm-2 15.06c-1.14.15-2.08.6-3.58 1.55l-.34.23C9.63 19.41 8.29 20 6 20a9 9 0 0 1-2-.22V28a1 1 0 0 0 .88 1H15a1 1 0 0 0 1-.88V16.06zM27 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-14-2H7a3 3 0 0 0-3 2.82v3.89A6.85 6.85 0 0 0 6 18c1.63 0 2.64-.36 4.4-1.46l.64-.4c2.01-1.32 3.28-1.93 4.96-2.09V14a3 3 0 0 0-3-3zm14 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM25 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 7H8v2h4V7zm13-3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(2,'Bidet','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M10 2a3 3 0 0 1 3 2.82V16h14a1 1 0 0 1 1 .88V17a8 8 0 0 1-7.75 8h-4.77l1.45 3.63a1 1 0 0 1-.7 1.35l-.11.01L16 30H4a1 1 0 0 1-1-.88V5a3 3 0 0 1 2.82-3H10zm15.91 16H5v10h9.52l-1.45-3.63a1 1 0 0 1 .7-1.35l.11-.01L14 23h6a6 6 0 0 0 5.85-4.67l.05-.23.01-.1zM10 4H6a1 1 0 0 0-1 .88V16h6V5a1 1 0 0 0-.77-.97L10.12 4 10 4zm11 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm6-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM8 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(2,'Cleaning products','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1c4.26 0 7.6 4.44 7.97 10h.91a2 2 0 0 1 2 2v.22l-1.79 16A2 2 0 0 1 23.26 31l-.16.01H8.9a2 2 0 0 1-1.97-1.62l-.02-.16L6.44 25H5a2 2 0 0 1-2-1.85V14a5 5 0 0 1 4.78-5h.52c.94-4.62 4-8 7.7-8zm8.21 18H17v4a2 2 0 0 1-1.85 2h-6.7l.45 4h14.2zM15 21H5v2h10zm0-10H8a3 3 0 0 0-3 2.82V19h10zm9.88 2H17v4h7.44zM16 3c-2.52 0-4.8 2.44-5.65 6H15a2 2 0 0 1 2 1.85V11h4.96c-.34-4.55-2.95-8-5.96-8z"></path></svg>');

-- Bedroom and laundry
INSERT INTO amenities (category_id, name, svg) VALUES
(3,'Washer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26.29 2a3 3 0 0 1 2.96 2.58c.5 3.56.75 7.37.75 11.42s-.25 7.86-.75 11.42a3 3 0 0 1-2.79 2.57l-.17.01H5.7a3 3 0 0 1-2.96-2.58C2.25 23.86 2 20.05 2 16s.25-7.86.75-11.42a3 3 0 0 1 2.79-2.57L5.7 2zm0 2H5.72a1 1 0 0 0-1 .86A80.6 80.6 0 0 0 4 16c0 3.96.24 7.67.73 11.14a1 1 0 0 0 .87.85l.11.01h20.57a1 1 0 0 0 1-.86c.48-3.47.72-7.18.72-11.14 0-3.96-.24-7.67-.73-11.14A1 1 0 0 0 26.3 4zM16 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm-5.84 7.5c-.34 0-.68.02-1.02.07a7 7 0 0 0 13.1 4.58 9.09 9.09 0 0 1-6.9-2.37l-.23-.23a6.97 6.97 0 0 0-4.95-2.05zM16 9a7 7 0 0 0-6.07 3.5h.23c2.26 0 4.44.84 6.12 2.4l.24.24a6.98 6.98 0 0 0 6.4 1.9A7 7 0 0 0 16 9zM7 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(3,'Dryer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26.29 2a3 3 0 0 1 2.96 2.58c.5 3.56.75 7.37.75 11.42s-.25 7.86-.75 11.42a3 3 0 0 1-2.79 2.57l-.17.01H5.7a3 3 0 0 1-2.96-2.58C2.25 23.86 2 20.05 2 16s.25-7.86.75-11.42a3 3 0 0 1 2.79-2.57L5.7 2zm0 2H5.72a1 1 0 0 0-1 .86A80.6 80.6 0 0 0 4 16c0 3.96.24 7.67.73 11.14a1 1 0 0 0 .87.85l.11.01h20.57a1 1 0 0 0 1-.86c.48-3.47.72-7.18.72-11.14 0-3.96-.24-7.67-.73-11.14a1 1 0 0 0-.87-.85zM16 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm-4.8 5.58c1.36.2 2.64.8 3.68 1.75l.46.45a8.97 8.97 0 0 0 4.62 2.28 5.02 5.02 0 0 1-2.01 1.55 10.98 10.98 0 0 1-4.26-2.65 4.96 4.96 0 0 0-2.66-1.38 4.68 4.68 0 0 1 .17-2zm3.09-3.28c1.34.55 2.58 1.36 3.64 2.42a4.97 4.97 0 0 0 3 1.44 4.99 4.99 0 0 1-.07 2 6.97 6.97 0 0 1-4.11-1.8l-.47-.45a8.96 8.96 0 0 0-4.07-2.17 5 5 0 0 1 2.08-1.44zM7 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(3,'Essentials','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M11 1v7l1.9 20.82v.17a2.01 2.01 0 0 1-1.81 2 2 2 0 0 1-.18.01H2.92a2.01 2.01 0 0 1-1.82-2v-.09l1.9-21V1zm6 0h.15a2 2 0 0 1 1.84 1.84L19 3v7.12l-2 8V31h-2V17.96l.03-.16.03-.16L16.72 11H13V1zm11 0a2 2 0 0 1 2 1.85V29a2 2 0 0 1-1.85 2H21v-2h7v-2h-7v-2h7v-2h-7v-2h7v-2h-7v-2h7v-2h-7v-2h7v-2h-7V9h7V7h-7V5h7V3h-7V1zM9.09 9H4.9L3.1 29h7.81v-.06zM17 3h-2v6h2zM9 3H5v4h4z"></path></svg>'),
(3,'Hangers','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 2a5 5 0 0 1 1.66 9.72 1 1 0 0 0-.65.81l-.01.13v.81l13.23 9.05a3 3 0 0 1 1.3 2.28v.2a3 3 0 0 1-3 3H3.47a3 3 0 0 1-1.69-5.48L15 13.47v-.81a3 3 0 0 1 1.82-2.76l.17-.07a3 3 0 1 0-3.99-3V7h-2a5 5 0 0 1 5-5zm0 13.21L2.9 24.17A1 1 0 0 0 3.46 26h25.07a1 1 0 0 0 .57-1.82z"></path></svg>'),
(3,'Bed linens','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M19.59 2a2 2 0 0 1 1.28.47l.13.12L29.41 11a2 2 0 0 1 .58 1.24l.01.17V25a5 5 0 0 1-4.78 5H4a2 2 0 0 1-2-1.85V7a5 5 0 0 1 4.78-5H7zM7 4a3 3 0 0 0-3 2.82V21a3 3 0 0 0 2.82 3H26v2H7a4.98 4.98 0 0 1-3-1v3h21a3 3 0 0 0 3-2.82V22H6v-2h22v-6h-5a5 5 0 0 1-5-4.78V4zm20.59 8L20 4.42V9a3 3 0 0 0 2.82 3H23z"></path></svg>'),
(3,'Extra pillows and blankets','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26.8 4a3 3 0 0 0-1.87.83l-.02.02-.11-.02A47.19 47.19 0 0 0 7.94 4.7l-.85.15-.02-.02A3 3 0 0 0 2 7v.21a3 3 0 0 0 .56 1.54l.03.03-.05.28a44.99 44.99 0 0 0 0 13.88l.05.28-.03.03A3 3 0 0 0 5 28h.2a3 3 0 0 0 1.87-.83l.02-.02.11.02a47.19 47.19 0 0 0 16.86.13l.85-.15.02.02A3 3 0 0 0 30 25v-.21a3 3 0 0 0-.56-1.54l-.03-.03.05-.28c.71-4.74.72-9.16 0-13.88l-.05-.28.03-.03A3 3 0 0 0 27 4h-.2zm.2 2a1 1 0 0 1 .68 1.74l-.4.36.09.54a43.3 43.3 0 0 1 0 14.72l-.1.54.4.36a1 1 0 1 1-1.52 1.27l-.37-.6-.68.15a45.29 45.29 0 0 1-18.2 0l-.68-.14-.37.59a1 1 0 1 1-1.52-1.27l.4-.36-.1-.54a43.25 43.25 0 0 1 0-14.72l.1-.54-.4-.36a1 1 0 1 1 1.52-1.27l.37.6.68-.15a45.29 45.29 0 0 1 18.2 0l.68.14.37-.59A1 1 0 0 1 27 6z"></path></svg>'),
(3,'Iron','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M12 28a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM16.03 3h.3a12.5 12.5 0 0 1 11.82 9.48l.07.3 1.73 7.79.03.14A2 2 0 0 1 28.15 23H2.1a2 2 0 0 1-1.85-1.84v-7.38a5 5 0 0 1 4.77-4.77L5.25 9h9V5h-14V3zm11.53 16H2.25v2H28zM16.24 5v6H5.07a3 3 0 0 0-2.82 2.82V17H27.1l-.84-3.78-.07-.28a10.5 10.5 0 0 0-9.6-7.92L16.32 5z"></path></svg>'),
(3,'Room-darkening shades','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M1 2V0h30v2h-2v18a2 2 0 0 1-1.85 2H17v2.17a3 3 0 1 1-2 0V22H5a2 2 0 0 1-2-1.85V2zm15 24a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM27 2H5v18h22z"></path></svg>'),
(3,'Safe','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 2a5 5 0 0 1 5 4.78V25a5 5 0 0 1-4.78 5H7a5 5 0 0 1-5-4.78V7a5 5 0 0 1 4.78-5H7zm0 2H7a3 3 0 0 0-3 2.82V11h2V6h20v20H6v-5H4v4a3 3 0 0 0 2.82 3H25a3 3 0 0 0 3-2.82V7a3 3 0 0 0-2.82-3zm-1 4H8v16h16zm-8 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 13H4v6h2z"></path></svg>'),
(3,'Hair dryer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M14 27v.2a4 4 0 0 1-3.8 3.8H4v-2h6.15a2 2 0 0 0 1.84-1.84L12 27zM10 1c.54 0 1.07.05 1.58.14l.38.07 17.45 3.65a2 2 0 0 1 1.58 1.79l.01.16v6.38a2 2 0 0 1-1.43 1.91l-.16.04-13.55 2.83 1.76 6.5A2 2 0 0 1 15.87 27l-.18.01h-3.93a2 2 0 0 1-1.88-1.32l-.05-.15-1.88-6.76A9 9 0 0 1 10 1zm5.7 24-1.8-6.62-1.81.38a9 9 0 0 1-1.67.23h-.33L11.76 25zM10 3a7 7 0 1 0 1.32 13.88l.33-.07L29 13.18V6.8L11.54 3.17A7.03 7.03 0 0 0 10 3zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path></svg>'),
(3,'Clothing storage','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 1a3 3 0 0 1 3 2.82V26a3 3 0 0 1-2.82 3H25v2h-2v-2H9v2H7v-2a3 3 0 0 1-3-2.82V4a3 3 0 0 1 2.82-3H25zm1 20H6v5a1 1 0 0 0 .88 1H25a1 1 0 0 0 1-.88V21zm-10 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm9-20h-8v16h9V4a1 1 0 0 0-.88-1H25zM15 3H7a1 1 0 0 0-1 .88V19h9V3zm-3 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>');

-- Entertainment
INSERT INTO amenities (category_id, name, svg) VALUES
(4,'TV with Standard cable','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M9 29v-2h2v-2H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 4.78-5H26a5 5 0 0 1 5 4.78V20a5 5 0 0 1-4.78 5H21v2h2v2zm10-4h-6v2h6zm7-20H6a3 3 0 0 0-3 2.82V20a3 3 0 0 0 2.82 3H26a3 3 0 0 0 3-2.82V8a3 3 0 0 0-2.82-3z"></path></svg>'),
(4,'Record player','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 3a5 5 0 0 1 5 4.78V24a5 5 0 0 1-4.78 5H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 4.78-5H6zm0 2H6a3 3 0 0 0-3 2.82V24a3 3 0 0 0 2.82 3H26a3 3 0 0 0 3-2.82V8a3 3 0 0 0-2.82-3zm1 2v15.41l-3.3 3.3-1.4-1.42 2.7-2.7V7zM14 7a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(4,'Exercise equipment','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M10 5a2 2 0 0 1 2 1.85V15h8V7a2 2 0 0 1 1.85-2H24a2 2 0 0 1 2 1.85V9h2a2 2 0 0 1 2 1.85V15h2v2h-2v4a2 2 0 0 1-1.85 2H26v2a2 2 0 0 1-1.85 2H22a2 2 0 0 1-2-1.85V17h-8v8a2 2 0 0 1-1.85 2H8a2 2 0 0 1-2-1.85V23H4a2 2 0 0 1-2-1.85V17H0v-2h2v-4a2 2 0 0 1 1.85-2H6V7a2 2 0 0 1 1.85-2H8zm14 2h-2v18h2zM10 7H8v18h2zm18 4h-2v10h2zM6 11H4v10h2z"></path></svg>'),
(4,'Books and reading material','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M1.67 2.68A2 2 0 0 1 4.1.72l.14.04L16.01 4.3 27.78.91a2 2 0 0 1 2.53 1.63l.02.14v23.25a2 2 0 0 1-1.27 1.85l-.15.06-12.62 3.78a1 1 0 0 1-.46.03l-.12-.03L3.1 27.84a2 2 0 0 1-1.42-1.75v-.17zm2 0v23.24L16 29.62l12.33-3.7V2.82L16.28 6.3a1 1 0 0 1-.46.03l-.1-.03zm21.66 17.48v2.08L16 25.04v-2.08zm0-6v2.08L16 19.04v-2.08zm0-6v2.08L16 13.04v-2.08z"></path></svg>'),
(4,'Bluetooth sound system','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 1a5 5 0 0 1 5 4.78V26a5 5 0 0 1-4.78 5H8a5 5 0 0 1-5-4.78V6a5 5 0 0 1 4.78-5H8zm0 2H8a3 3 0 0 0-3 2.82V26a3 3 0 0 0 2.82 3H24a3 3 0 0 0 3-2.82V6a3 3 0 0 0-2.82-3zm-8 10a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm0-14a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>'),
(4,'Ethernet connection','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 1a5 5 0 0 1 5 4.78V26a5 5 0 0 1-4.78 5H19v-2h5a3 3 0 0 0 3-2.82V6a3 3 0 0 0-2.82-3H8a3 3 0 0 0-3 2.82V26a3 3 0 0 0 2.82 3H15v-8h-2a2 2 0 0 1-2-1.85V13a2 2 0 0 1 1.85-2H19a2 2 0 0 1 2 1.85V19a2 2 0 0 1-1.85 2H17v8a2 2 0 0 1-1.85 2H8a5 5 0 0 1-5-4.78V6a5 5 0 0 1 4.78-5H8zm-5 12h-6v6h2v-4h2v4h2z"></path></svg>'),
(4,'HDTV with standard cable, premium cable','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M9 29v-2h2v-2H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 4.78-5H26a5 5 0 0 1 5 4.78V20a5 5 0 0 1-4.78 5H21v2h2v2zm10-4h-6v2h6zm7-20H6a3 3 0 0 0-3 2.82V20a3 3 0 0 0 2.82 3H26a3 3 0 0 0 3-2.82V8a3 3 0 0 0-2.82-3z"></path></svg>'),
(4,'TV','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M9 29v-2h2v-2H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 4.78-5H26a5 5 0 0 1 5 4.78V20a5 5 0 0 1-4.78 5H21v2h2v2zm10-4h-6v2h6zm7-20H6a3 3 0 0 0-3 2.82V20a3 3 0 0 0 2.82 3H26a3 3 0 0 0 3-2.82V8a3 3 0 0 0-2.82-3z"></path></svg>');

-- Family
INSERT INTO amenities (category_id, name, svg) VALUES
(5,'Window guards','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 1a2 2 0 0 1 2 1.85V14h2v2h-2v6h2v2h-2v5h2v2H2v-2h2v-5H2v-2h2v-6H2v-2h2V3a2 2 0 0 1 1.85-2H26zM11 24H6v5h5v-5zm8 0h-6v5h6v-5zm7 0h-5v5h5v-5zm-15-8H6v6h5v-6zm8 0h-6v6h6v-6zm7 0h-5v6h5v-6zm0-13H6v11h5v-3h2v3h6v-3h2v3h5V3z"></path></svg>'),
(5,'Babysitter recommendations','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M31 2v2h-2.34a3 3 0 0 0-1.98.74l-.14.14-.54.53V19a4.98 4.98 0 0 1-1.08 3.1A4 4 0 0 1 24 30a4 4 0 0 1-3.46-6h-9.07a4 4 0 1 1-5.3-1.56l.06-.07.06-.08L10.6 18h-1.6a3 3 0 0 0-1.97.74l-.14.14-3.83 3.83-1.41-1.42 3.82-3.83a5 5 0 0 1 3.28-1.45L9 16h3.58l4.2-4.19A4 4 0 0 1 18 4a4 4 0 0 1 3.81 2.78l3.31-3.32a5 5 0 0 1 3.27-1.45l.27-.01zm-7 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 24a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm16-5V7.41L9.41 22H21a3 3 0 0 0 2.98-2.65l.01-.17zM18 6a2 2 0 1 0 .15 0z"></path></svg>'),
(5,'Pack ’n play/Travel crib','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M3 4v4h26V4h2v17a5 5 0 0 1-2.78 4.48L30.6 30h-2.26l-2.1-4H5.76l-2.11 4H1.4l2.38-4.52A5 5 0 0 1 1 21.22L1 21V4zm11.6 6.35a3 3 0 0 0-1.14 1.06l-.11.2L6.82 24h18.36l-6.53-12.4a3 3 0 0 0-4.05-1.25zM12 10H3v11a3 3 0 0 0 1.71 2.71l6.87-13.04A5 5 0 0 1 12 10zm17 0h-9c.11.15.22.3.31.47l.11.2 6.87 13.04a3 3 0 0 0 1.7-2.53L29 21z"></path></svg>'),
(5,'Standalone high chair','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a7 7 0 0 1 7 6.76V15a2 2 0 0 1-1.5 1.94L23.85 31h-2.03l-2.33-14H12.5l-2.33 14H8.15l2.35-14.06A2 2 0 0 1 9 15.16V8a7 7 0 0 1 7-7zm0 2a5 5 0 0 0-5 4.78V15h10V8a5 5 0 0 0-5-5zm9 6v2h-8v5h-2v-5H7V9z"></path></svg>');

-- Heating and cooling
INSERT INTO amenities (category_id, name, svg) VALUES
(6,'Air conditioning','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M17 1v4.03l4.03-2.32 1 1.73L17 7.34v6.93l6-3.47V5h2v4.65l3.49-2.02 1 1.74L26 11.38l4.03 2.33-1 1.73-5.03-2.9L18 16l6 3.46 5.03-2.9 1 1.73L26 20.62l3.49 2.01-1 1.74L25 22.35V27h-2v-5.8l-6-3.47v6.93l5.03 2.9-1 1.73L17 26.97V31h-2v-4.03l-4.03 2.32-1-1.73 5.03-2.9v-6.93L9 21.2V27H7v-4.65l-3.49 2.02-1-1.74L6 20.62l-4.03-2.33 1-1.73L8 19.46 14 16l-6-3.46-5.03 2.9-1-1.73L6 11.38 2.51 9.37l1-1.74L7 9.65V5h2v5.8l6 3.47V7.34l-5.03-2.9 1-1.73L15 5.03V1z"></path></svg>'),
(6,'Portable air conditioning','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M17 1v4.03l4.03-2.32 1 1.73L17 7.34v6.93l6-3.47V5h2v4.65l3.49-2.02 1 1.74L26 11.38l4.03 2.33-1 1.73-5.03-2.9L18 16l6 3.46 5.03-2.9 1 1.73L26 20.62l3.49 2.01-1 1.74L25 22.35V27h-2v-5.8l-6-3.47v6.93l5.03 2.9-1 1.73L17 26.97V31h-2v-4.03l-4.03 2.32-1-1.73 5.03-2.9v-6.93L9 21.2V27H7v-4.65l-3.49 2.02-1-1.74L6 20.62l-4.03-2.33 1-1.73L8 19.46 14 16l-6-3.46-5.03 2.9-1-1.73L6 11.38 2.51 9.37l1-1.74L7 9.65V5h2v5.8l6 3.47V7.34l-5.03-2.9 1-1.73L15 5.03V1z"></path></svg>'),
(6,'Indoor fireplace: electric','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M31 6v2h-1v23h-6V13H8v18H2V8H1V6zm-15.37 9 .96.7c3.32 2.42 5.14 5.06 5.38 7.93l.02.28v.21l.01.14c0 3.18-2.7 5.74-6 5.74a5.9 5.9 0 0 1-5.99-5.39v-.21l-.01-.15a9.3 9.3 0 0 1 1.64-4.99l.22-.34.68-.98 1.24.79zM28 8H4v21h2V13a2 2 0 0 1 1.7-1.98l.15-.01L8 11h16a2 2 0 0 1 2 1.85V29h2zM16 25.36l-.1.09c-.61.65-.9 1.23-.9 1.72 0 .42.41.83 1 .83s1-.4 1-.83c0-.45-.24-.97-.76-1.56l-.15-.16zm.35-7.32-1.77 3.56-1.46-.93-.15.27a7.28 7.28 0 0 0-.94 2.75l-.02.29-.01.26v.12c.03.92.4 1.76 1.03 2.4.14-1.14.86-2.24 2.1-3.33l.23-.2.64-.53.64.53c1.38 1.16 2.19 2.32 2.33 3.53A3.6 3.6 0 0 0 20 24.49l.01-.22V24c-.1-1.86-1.12-3.7-3.13-5.5l-.27-.24zM31 2v2H1V2z"></path></svg>'),
(6,'Heating','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 0a5 5 0 0 1 5 4.78v12.98l.26.21a7.98 7.98 0 0 1 2.72 5.43l.02.3v.3a8 8 0 1 1-13.25-6.04l.25-.2V5A5 5 0 0 1 15.56.02l.22-.01zm0 2a3 3 0 0 0-3 2.82V18.78l-.43.3a6 6 0 1 0 7.06.15l-.2-.16-.43-.3V11h-4V9h4V7h-4V5h4a3 3 0 0 0-3-3zm1 11v7.13A4 4 0 0 1 16 28a4 4 0 0 1-1-7.87V13zm-1 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(6,'Ceiling fan','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M20.33 3.08c1.5 2.24.96 5.55-1.38 9.9l-.12.2.18.18c.1.13.21.26.3.4l.23.38.14.02c.7.06 1.78-.11 2.87-.48.89-.3 1.78-.78 2.68-1.45l.66-.52a3 3 0 0 1 4.77 1.33l.12.44c.59 3.35.02 5.73-1.86 6.98-2.24 1.5-5.54.96-9.9-1.39a3 3 0 0 1-.27-.16l-.07.07-.39.3-.28.19V20c-.03.7.15 1.68.48 2.68.3.88.78 1.78 1.45 2.68l.26.33.26.33a3 3 0 0 1-.36 4.22C19 31 17.95 31 17 31h-.54l-1.39-.1c-1.24-.19-2.56-.65-3.36-1.84-1.5-2.25-.96-5.55 1.39-9.91.04-.09.1-.17.15-.25a4.12 4.12 0 0 1-.37-.4.82.82 0 0 0-.18-.23.5.5 0 0 0-.21-.11c-.7-.1-1.85.06-3.04.46-.88.3-1.78.78-2.68 1.45l-.66.52a3 3 0 0 1-4.77-1.33l-.12-.44c-.59-3.35-.02-5.73 1.86-6.98 2.24-1.5 5.55-.96 9.9 1.38l.1.05c.3-.3.55-.5.72-.61l.2-.13.03-.2c.06-.7-.11-1.78-.48-2.88a9.6 9.6 0 0 0-1.45-2.68l-.52-.66a3 3 0 0 1 1.33-4.77l.44-.12c3.35-.59 5.73-.02 6.98 1.86zm-5.31 16.8-.16.22c-2.04 3.77-2.5 6.45-1.49 7.85 1.13 1.55 4.63 1.55 5.44.77.38-.36.47-.89.2-1.31l-.37-.45a11.94 11.94 0 0 1-2.05-3.64 10.93 10.93 0 0 1-.59-3.03V20h-.14a4.01 4.01 0 0 1-.63-.07l-.21-.05zM4.09 13.52c-1.56 1.13-1.56 4.63-.78 5.44.36.38.9.46 1.32.19l.44-.36c1.2-.96 2.42-1.64 3.65-2.05 1.16-.4 2.33-.6 3.28-.6V16c0-.14 0-.28.02-.42l.08-.46-.16-.12c-3.78-2.03-6.46-2.5-7.85-1.48zm23.24-.36-.45.36c-1.2.96-2.41 1.64-3.64 2.05-1.15.38-2.3.6-3.24.6-.01.25-.05.5-.1.74l-.07.26.19.14c3.77 2.03 6.45 2.5 7.85 1.48 1.55-1.13 1.55-4.63.78-5.44-.36-.38-.9-.47-1.32-.19zM16 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13.2 3.39c-.37.36-.46.89-.18 1.31l.36.45c.95 1.2 1.64 2.42 2.05 3.64.37 1.14.59 2.27.59 3.2l.54.05.3.05.2.05.1-.13c2.04-3.77 2.5-6.45 1.49-7.84-1.13-1.56-4.63-1.56-5.44-.78z"></path></svg>'),
(6,'AC - split type ductless system','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M17 1v4.03l4.03-2.32 1 1.73L17 7.34v6.93l6-3.47V5h2v4.65l3.49-2.02 1 1.74L26 11.38l4.03 2.33-1 1.73-5.03-2.9L18 16l6 3.46 5.03-2.9 1 1.73L26 20.62l3.49 2.01-1 1.74L25 22.35V27h-2v-5.8l-6-3.47v6.93l5.03 2.9-1 1.73L17 26.97V31h-2v-4.03l-4.03 2.32-1-1.73 5.03-2.9v-6.93L9 21.2V27H7v-4.65l-3.49 2.02-1-1.74L6 20.62l-4.03-2.33 1-1.73L8 19.46 14 16l-6-3.46-5.03 2.9-1-1.73L6 11.38 2.51 9.37l1-1.74L7 9.65V5h2v5.8l6 3.47V7.34l-5.03-2.9 1-1.73L15 5.03V1z"></path></svg>'),
(6,'Central air conditioning','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M17 1v4.03l4.03-2.32 1 1.73L17 7.34v6.93l6-3.47V5h2v4.65l3.49-2.02 1 1.74L26 11.38l4.03 2.33-1 1.73-5.03-2.9L18 16l6 3.46 5.03-2.9 1 1.73L26 20.62l3.49 2.01-1 1.74L25 22.35V27h-2v-5.8l-6-3.47v6.93l5.03 2.9-1 1.73L17 26.97V31h-2v-4.03l-4.03 2.32-1-1.73 5.03-2.9v-6.93L9 21.2V27H7v-4.65l-3.49 2.02-1-1.74L6 20.62l-4.03-2.33 1-1.73L8 19.46 14 16l-6-3.46-5.03 2.9-1-1.73L6 11.38 2.51 9.37l1-1.74L7 9.65V5h2v5.8l6 3.47V7.34l-5.03-2.9 1-1.73L15 5.03V1z"></path></svg>'),
(6,'Central heating','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 0a5 5 0 0 1 5 4.78v12.98l.26.21a7.98 7.98 0 0 1 2.72 5.43l.02.3v.3a8 8 0 1 1-13.25-6.04l.25-.2V5A5 5 0 0 1 15.56.02l.22-.01zm0 2a3 3 0 0 0-3 2.82V18.78l-.43.3a6 6 0 1 0 7.06.15l-.2-.16-.43-.3V11h-4V9h4V7h-4V5h4a3 3 0 0 0-3-3zm1 11v7.13A4 4 0 0 1 16 28a4 4 0 0 1-1-7.87V13zm-1 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>');

-- Home safety
INSERT INTO amenities (category_id, name, svg) VALUES
(7,'Smoke alarm','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 2a13 13 0 1 0 0 26 13 13 0 0 0 0-26zm-4.9 14a5 5 0 0 0 3.9 3.9v2.03A7 7 0 0 1 9.07 17zm9.8 0h2.03A7 7 0 0 1 17 22.93V20.9a5 5 0 0 0 3.9-3.9zM16 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm1-5.93A7 7 0 0 1 22.93 15H20.9a5 5 0 0 0-3.9-3.9zm-2 0v2.03a5 5 0 0 0-3.9 3.9H9.07A7 7 0 0 1 15 9.07zM23 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(7,'Carbon monoxide alarm','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 2a5 5 0 0 1 5 4.78V25a5 5 0 0 1-4.78 5H7a5 5 0 0 1-5-4.78V7a5 5 0 0 1 4.78-5H7zm0 2H7a3 3 0 0 0-3 2.82V25a3 3 0 0 0 2.82 3H25a3 3 0 0 0 3-2.82V7a3 3 0 0 0-2.82-3zM11.1 17a5 5 0 0 0 3.9 3.9v2.03A7 7 0 0 1 9.07 17zm9.8 0h2.03A7 7 0 0 1 17 22.93V20.9a5 5 0 0 0 3.9-3.9zM16 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm1-5.93A7 7 0 0 1 22.93 15H20.9a5 5 0 0 0-3.9-3.9zm-2 0v2.03a5 5 0 0 0-3.9 3.9H9.07A7 7 0 0 1 15 9.07zM23 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(7,'Fire extinguisher','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M7 28H5V15a11 11 0 0 1 8.06-10.6 3 3 0 0 1 4.63-1.88L20.35.24l1.3 1.52L19.04 4H23v2h-4.17A3 3 0 0 1 17 7.83v.24a7 7 0 0 1 5.98 6.45l.02.24V30a2 2 0 0 1-1.85 2H11a2 2 0 0 1-2-1.85V24H7zm9-18a5 5 0 0 0-4.98 4.57l-.02.22V30h10V14.82A5 5 0 0 0 16 10zm-2.65-3.6A9 9 0 0 0 7 14.73V22h2v-7.26a7 7 0 0 1 6-6.67v-.24a3.01 3.01 0 0 1-1.65-1.43zM16 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>'),
(7,'First aid kit','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 3a5 5 0 0 1 5 4.78V24a5 5 0 0 1-4.78 5H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 4.78-5H6zm0 2H6a3 3 0 0 0-3 2.82V24a3 3 0 0 0 2.82 3H26a3 3 0 0 0 3-2.82V8a3 3 0 0 0-2.82-3zm-7 4v4h4v6h-4v4h-6v-4H9v-6h4V9zm-2 2h-2v4h-4v2h4v4h2v-4h4v-2h-4z"></path></svg>'),
(7,'Exterior security cameras on property','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M23 3a2 2 0 0 1 2 1.85v1.67l5-2v11.96l-5-2V16a2 2 0 0 1-1.85 2H16.9a5 5 0 0 1-3.98 3.92A5 5 0 0 1 8.22 26H4v4H2V20h2v4h4a3 3 0 0 0 2.87-2.13A5 5 0 0 1 7.1 18H4a2 2 0 0 1-2-1.85V5a2 2 0 0 1 1.85-2H4zM12 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm11-9H4v11h3.1a5 5 0 0 1 9.8 0H23zm5 2.48-3 1.2v3.64l3 1.2zM7 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>');

-- Internet and office
INSERT INTO amenities (category_id, name, svg) VALUES
(8,'Wifi','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 20.33a3.67 3.67 0 1 1 0 7.34 3.67 3.67 0 0 1 0-7.34zm0 2a1.67 1.67 0 1 0 0 3.34 1.67 1.67 0 0 0 0-3.34zM16 15a9 9 0 0 1 8.04 4.96l-1.51 1.51a7 7 0 0 0-13.06 0l-1.51-1.51A9 9 0 0 1 16 15zm0-5.33c4.98 0 9.37 2.54 11.94 6.4l-1.45 1.44a12.33 12.33 0 0 0-20.98 0l-1.45-1.45A14.32 14.32 0 0 1 16 9.66zm0-5.34c6.45 0 12.18 3.1 15.76 7.9l-1.43 1.44a17.64 17.64 0 0 0-28.66 0L.24 12.24c3.58-4.8 9.3-7.9 15.76-7.9z"></path></svg>'),
(8,'Dedicated workspace','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 2a1 1 0 0 1 .92.61l.04.12 2 7a1 1 0 0 1-.85 1.26L28 11h-3v5h6v2h-2v13h-2v-2.54a3.98 3.98 0 0 1-1.73.53L25 29H7a3.98 3.98 0 0 1-2-.54V31H3V18H1v-2h5v-4a1 1 0 0 1 .88-1h.36L6.09 8.4l1.82-.8L9.43 11H12a1 1 0 0 1 1 .88V16h10v-5h-3a1 1 0 0 1-.99-1.16l.03-.11 2-7a1 1 0 0 1 .84-.72L22 2h4zm1 16H5v7a2 2 0 0 0 1.7 1.98l.15.01L7 27h18a2 2 0 0 0 2-1.85V18zm-16-5H8v3h3v-3zm14.24-9h-2.49l-1.43 5h5.35l-1.43-5z"></path></svg>');

-- Kitchen and dining
INSERT INTO amenities (category_id, name, svg) VALUES
(9,'Refrigerator','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 1a2 2 0 0 1 2 1.85V29a2 2 0 0 1-1.85 2H7a2 2 0 0 1-2-1.85V3a2 2 0 0 1 1.85-2H7zm0 10H7v18h18zm-15 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM25 3H7v6h18zM10 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(9,'Microwave','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 3a2 2 0 0 1 2 1.85V27a2 2 0 0 1-1.85 2H3a2 2 0 0 1-2-1.85V5a2 2 0 0 1 1.85-2H3zm0 2H3v22h26zm-6 2v18H5V7zm-2 2H7v14h3a4.97 4.97 0 0 1-1-2.72V17h10v3a4.98 4.98 0 0 1-1 3h3zm-4 10h-6v1a3 3 0 0 0 2.65 2.98l.17.01.18.01a3 3 0 0 0 3-2.82V20zm9-8a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(9,'Dishes and silverware','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 1v2a13 13 0 0 0-.3 26h.3v2a15 15 0 0 1-.31-30zM3 1h2v6h2V1h2v6h2V1h2v9a5 5 0 0 1-4 4.9V31H7V14.9a5.01 5.01 0 0 1-3.98-4.44L3 10.22V10zm26 6v2a7 7 0 0 0-.24 14H29v2a9 9 0 0 1-.27-18zM11 9H5v1.15a3 3 0 0 0 6 .03V10z"></path></svg>'),
(9,'Coffee maker','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 2a1 1 0 0 1 .94.65l.03.1 1 4A1 1 0 0 1 26.11 8L26 8h-9v2h-2V8H5v20h3a5 5 0 0 1-.72-4.66l.1-.26 2.52-6.04-1.8-3.6a1 1 0 0 1 .78-1.43L9 12h14a1 1 0 0 1 .94 1.34l-.05.1L22.62 16H24a5 5 0 0 1 5 4.78V25h-2v-4a3 3 0 0 0-2.82-3H22.5l2.12 5.08A5 5 0 0 1 24 28h3v2H4a1 1 0 0 1-1-.88V3a1 1 0 0 1 .88-1H4zM12.65 22a6.64 6.64 0 0 0-2.91.63l-.5 1.22a3 3 0 0 0-.2.68l-.03.23L9 25a3 3 0 0 0 2.82 3h8.19l.23-.01a3 3 0 0 0 2.6-2.02c-1.7-.12-2.93-.67-4.84-1.9l-.37-.23c-2.14-1.4-3.18-1.84-4.98-1.84zm7.68-4h-8.66l-.92 2.19a9.06 9.06 0 0 1 1.9-.19c2.19 0 3.51.52 5.75 1.95l.38.25c1.74 1.13 2.74 1.62 4.03 1.76l-.04-.11zm1.05-4H10.62l1 2h8.76zm2.84-10H5v2h19.72z"></path></svg>'),
(9,'Kitchen','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 1a5 5 0 0 1 5 5c0 6.39-1.6 13.19-4 14.7V31h-2V20.7c-2.36-1.48-3.94-8.07-4-14.36v-.56A5 5 0 0 1 26 1zm-9 0v18.12c2.32.55 4 3 4 5.88 0 3.27-2.18 6-5 6s-5-2.73-5-6c0-2.87 1.68-5.33 4-5.88V1zM2 1h1c4.47 0 6.93 6.37 7 18.5V21H4v10H2zm14 20c-1.6 0-3 1.75-3 4s1.4 4 3 4 3-1.75 3-4-1.4-4-3-4zM4 3.24V19h4l-.02-.96-.03-.95C7.67 9.16 6.24 4.62 4.22 3.36L4.1 3.3zm19 2.58v.49c.05 4.32 1.03 9.13 2 11.39V3.17a3 3 0 0 0-2 2.65zm4-2.65V17.7c.99-2.31 2-7.3 2-11.7a3 3 0 0 0-2-2.83z"></path></svg>'),
(9,'Cooking basics','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 1a5 5 0 0 1 5 5c0 6.39-1.6 13.19-4 14.7V31h-2V20.7c-2.36-1.48-3.94-8.07-4-14.36v-.56A5 5 0 0 1 26 1zm-9 0v18.12c2.32.55 4 3 4 5.88 0 3.27-2.18 6-5 6s-5-2.73-5-6c0-2.87 1.68-5.33 4-5.88V1zM2 1h1c4.47 0 6.93 6.37 7 18.5V21H4v10H2zm14 20c-1.6 0-3 1.75-3 4s1.4 4 3 4 3-1.75 3-4-1.4-4-3-4zM4 3.24V19h4l-.02-.96-.03-.95C7.67 9.16 6.24 4.62 4.22 3.36L4.1 3.3zm19 2.58v.49c.05 4.32 1.03 9.13 2 11.39V3.17a3 3 0 0 0-2 2.65zm4-2.65V17.7c.99-2.31 2-7.3 2-11.7a3 3 0 0 0-2-2.83z"></path></svg>'),
(9,'Mini fridge','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 1v2a13 13 0 0 0-.3 26h.3v2a15 15 0 0 1-.31-30zM3 1h2v6h2V1h2v6h2V1h2v9a5 5 0 0 1-4 4.9V31H7V14.9a5.01 5.01 0 0 1-3.98-4.44L3 10.22V10zm26 6v2a7 7 0 0 0-.24 14H29v2a9 9 0 0 1-.27-18zM11 9H5v1.15a3 3 0 0 0 6 .03V10z"></path></svg>'),
(9,'Freezer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 1a2 2 0 0 1 2 1.85V29a2 2 0 0 1-1.85 2H7a2 2 0 0 1-2-1.85V3a2 2 0 0 1 1.85-2H7zm0 10H7v18h18zm-15 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM25 3H7v6h18zM10 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(9,'Dishwasher','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V4a2 2 0 0 1 1.85-2H4zm0 10H4v16h24zm-2 2v4a3 3 0 0 1-2 2.83V24h2v2h-6v-2h2v-3.17a3 3 0 0 1-2-2.65V14zm-14 0a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm12 0h-2v2a1 1 0 0 0 .77.97l.11.02.12.01a1 1 0 0 0 1-.88V18zm4-12H4v6h24zm-6 2v2H10V6zM7 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(9,'Induction stove','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M27 0a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H5a2 2 0 0 1-2-1.85V2a2 2 0 0 1 1.85-2H5zm0 2H5v26h22zm-3 22a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.33 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.34 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM8 24a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm13-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-10 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM11 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM11 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(9,'Stainless steel oven','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V4a2 2 0 0 1 1.85-2H4zm0 10H4v16h24zm-2 2v12H6V14zm-2 2H8v8h16zm4-12H4v6h24zm-3 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(9,'Stainless steel electric stove','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M27 0a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H5a2 2 0 0 1-2-1.85V2a2 2 0 0 1 1.85-2H5zm0 2H5v26h22zm-3 22a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.33 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.34 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM8 24a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm13-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-10 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM11 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM11 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(9,'Rice maker','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M21 3a9 9 0 0 1 9 8.73V16h1v2h-1v9a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V18H1v-2h1v-4a9 9 0 0 1 8.73-9H11zm7 11H4v13h24zm-8 2v2h-8v-2zM9 16a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm14 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM21 5H11a7 7 0 0 0-7 6.76V12h7V8h10v4h7a7 7 0 0 0-6.76-7zm-2 5h-6v2h6z"></path></svg>'),
(9,'Blender','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M23 1a1 1 0 0 1 1 .88V6l-.02.2-2.9 14.53a5 5 0 0 1 2.31 3.4l.04.25.56 4.5a1 1 0 0 1-.87 1.11L23 30H9a1 1 0 0 1-1-1v-.12l.57-4.5a5 5 0 0 1 2.36-3.65L8.18 7H7a1 1 0 0 0-1 .88V15H4V8a3 3 0 0 1 2.82-3H8V2a1 1 0 0 1 .88-1H23zm-9.5 21a3 3 0 0 0-2.92 2.45l-.03.18-.42 3.37h11.74l-.42-3.37a3 3 0 0 0-2.62-2.6L18.5 22h-5zm2.5 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm5.78-17H10.22l2.6 13H15v-9h2v9h2.18l2.6-13zM22 3H10v2h12V3z"></path></svg>'),
(9,'Baking sheet','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M4 25c.51 0 .94.5 1 1v2h22v-2c0-.51.5-1 1-1h3v2h-2v2c0 .51-.5 1-1 1H4c-.5 0-1-.5-1-1v-2H1v-2zm16-10a5.7 5.7 0 0 1 5.67 5.2l.18 2.6a3 3 0 0 1-2.79 3.2H9.14a3 3 0 0 1-3-3l.17-2.57A5.93 5.93 0 0 1 12 15zm-5 2h-2v3h-2v-2.83a3.83 3.83 0 0 0-2.67 3.19A21.5 21.5 0 0 0 8.14 23c0 .51.36.94.86 1h14c.51-.04.83-.45.86-.95a343.57 343.57 0 0 0-.17-2.48 3.83 3.83 0 0 0-2.69-3.4V20h-2v-3h-2v3h-2zm9-15h2c0 2.06-.48 3.34-1.77 5.42l-.75 1.19c-1.06 1.7-1.44 2.68-1.48 4.15V13h-2c0-2.16.52-3.47 1.95-5.73l.57-.88c1.06-1.7 1.44-2.68 1.47-4.15zm-5 0h2c0 2.06-.48 3.34-1.77 5.42l-.75 1.19c-1.06 1.7-1.44 2.68-1.48 4.15V13h-2c0-2.16.52-3.47 1.95-5.73l.57-.88c1.06-1.7 1.44-2.68 1.47-4.15zm-5 0h2c0 2.06-.48 3.34-1.77 5.42l-.75 1.19c-1.06 1.7-1.44 2.68-1.48 4.15V13h-2c0-2.16.51-3.47 1.95-5.73l.57-.88c1.06-1.7 1.44-2.68 1.47-4.15z"></path></svg>'),
(9,'Hot water kettle','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 28v2H6v-2h20zM16 1a8.64 8.64 0 0 1 7.83 5H28a1 1 0 0 1 1 1.08c-.3 3.87-1.58 6.45-3.9 7.56l.9 10.27a1 1 0 0 1-.88 1.08L25 26H7a1 1 0 0 1-1-.97v-.12L7.4 8.9c.02-.3.06-.6.12-.89H5a1 1 0 0 0-1 .88V19H2V9a3 3 0 0 1 2.82-3h3.35A8.64 8.64 0 0 1 16 1zm6.43 7H9.57a6.65 6.65 0 0 0-.14.7l-.04.36L8.1 24h15.82L22.6 9.06A6.67 6.67 0 0 0 22.43 8zm-5.45 3a9.82 9.82 0 0 1-2.7 5.78l-.23.24A6.96 6.96 0 0 0 12.07 21h-2.02a8.96 8.96 0 0 1 2.36-5.16l.23-.23A7.99 7.99 0 0 0 14.97 11h2.01zm4 0 .02.5a9.6 9.6 0 0 1-2.72 6.28l-.23.24A6.97 6.97 0 0 0 16.28 21h-2.06a8.96 8.96 0 0 1 2.19-4.16l.22-.23C18.09 15.16 19 13.2 19 11.5a4.94 4.94 0 0 0-.03-.5h2.01zm5.9-3h-2.4l.1.63.02.26.3 3.51c.99-.79 1.64-2.16 1.96-4.17l.03-.23zM16 3a6.63 6.63 0 0 0-5.55 3h11.1a6.63 6.63 0 0 0-5.04-2.98L16.23 3H16z"></path></svg>'),
(9,'Stove','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M27 0a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H5a2 2 0 0 1-2-1.85V2a2 2 0 0 1 1.85-2H5zm0 2H5v26h22zm-3 22a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.33 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5.34 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM8 24a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm13-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-10 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM11 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM11 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path></svg>'),
(9,'Wine glasses','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m9.24 3-.2.4a20.37 20.37 0 0 0-1.7 5.02v.03A9 9 0 0 1 10.16 8c2.26 0 4.44.84 6.12 2.4l.24.24a6.98 6.98 0 0 0 4.95 2.05 6.99 6.99 0 0 0 3.53-.95v-.23a19.57 19.57 0 0 0-2.04-8.1l-.2-.41H9.24zm.92 7a7 7 0 0 0-3.11.73C7 11.15 7 11.57 7 12a9 9 0 0 0 9 9c4.06 0 7.7-3.14 8.72-6.92a9 9 0 0 1-3.25.6 8.98 8.98 0 0 1-6.13-2.4l-.23-.23A6.97 6.97 0 0 0 10.16 10zm13.8-9 .29.52A21.78 21.78 0 0 1 27 12c0 5.4-4.53 10.4-10 10.95V29h6v2H9v-2h6v-6.04A11 11 0 0 1 5 12c0-3.6.92-7.09 2.75-10.48L8.04 1h15.92z"></path></svg>'),
(9,'Toaster','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M20.93 2a3.93 3.93 0 0 1 3.93 3.93c0 .87-.29 1.7-.83 2.4l-.03.04V10a5 5 0 0 1 5 4.78V27a2 2 0 0 1-1.85 2H26v1h-2v-1H8v1H6v-1H5a2 2 0 0 1-2-1.85V17H1v-2h2a5 5 0 0 1 4.78-5H8V8.38a3.93 3.93 0 0 1 0-4.9l.14-.17.15-.16a3.93 3.93 0 0 1 2.56-1.14l.22-.01h9.86zM24 12H8a3 3 0 0 0-3 2.82V27h22V15a3 3 0 0 0-2.82-3H24zM8 23a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM20.93 4h-9.86a1.93 1.93 0 0 0-1.36 3.3 1 1 0 0 1 .28.57L10 8v2h12V8a1 1 0 0 1 .12-.48l.07-.1.08-.1.12-.13a1.93 1.93 0 0 0-1.31-3.18L20.93 4z"></path></svg>'),
(9,'Dining table','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 15v16h-2v-6h-6v6h-2v-6.15a2 2 0 0 1 1.84-1.84L21 23h6v-8zM5 15v8h6a2 2 0 0 1 2 1.85V31h-2v-6H5v6H3V15zM16 1a15 15 0 0 1 13.56 8.57 1 1 0 0 1-.8 1.42l-.1.01H17v8h8v2h-8v10h-2V21H7v-2h8v-8H3.35a1 1 0 0 1-.95-1.32l.04-.1A15 15 0 0 1 16 1zm0 2A13 13 0 0 0 5.4 8.47l-.2.28-.16.25h21.92l-.17-.25a13 13 0 0 0-10.1-5.73L16.34 3z"></path></svg>'),
(9,'Oven','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 1.85V28a2 2 0 0 1-1.85 2H4a2 2 0 0 1-2-1.85V4a2 2 0 0 1 1.85-2H4zm0 10H4v16h24zm-2 2v12H6V14zm-2 2H8v8h16zm4-12H4v6h24zm-3 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>');

-- Location features
INSERT INTO amenities (category_id, name, svg) VALUES
(10,'Beach access - Beachfront','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 27c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 29c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 29c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 29c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 27c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 27c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 27zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 24c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 24c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 24c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 22c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 22c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 22zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 19c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 19c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 19c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 17c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 17c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 17zM16 1a9 9 0 0 1 8.76 11.07c.71.13 1.37.45 1.91.94.3.27.71.44 1.14.48l.19.01v2h-.23a3.96 3.96 0 0 1-2.44-1 1.95 1.95 0 0 0-1.14-.5H23.96a2 2 0 0 0-1.15.38l-.14.11A3.98 3.98 0 0 1 20 15.5a3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 14c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1 1.95 1.95 0 0 0-1.14-.5H7.96a2 2 0 0 0-1.15.38l-.14.11a3.96 3.96 0 0 1-2.44 1L4 15.5v-2h.19a1.95 1.95 0 0 0 1.14-.5 3.92 3.92 0 0 1 1.9-.93A9 9 0 0 1 16 1zm0 2a7 7 0 0 0-6.64 9.23c.49.17.93.43 1.31.78.35.32.83.49 1.33.49.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 12c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5a2 2 0 0 0 1.2-.38l.13-.11c.38-.35.82-.6 1.3-.78A7 7 0 0 0 16 3z"></path></svg>'),
(10,'Private entrance','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 1a2 2 0 0 1 2 1.85V29h2v2H3v-2h2V3a2 2 0 0 1 1.85-2H7zm0 2H7v26h18zm-3 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(10,'Waterfront','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M28 2a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2H4v15.5h.19c.37-.04.72-.17 1-.38l.14-.11A3.98 3.98 0 0 1 8 18c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 18c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 18c.99 0 1.94.35 2.67 1 .35.33.83.5 1.33.5v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 20c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1v3h.19c.37-.04.72-.17 1-.38l.14-.11A3.98 3.98 0 0 1 8 23c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 23c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 23c.99 0 1.94.35 2.67 1 .35.33.83.5 1.33.5v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 25c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1V28h24zm-6 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"></path></svg>'),
(10,'Free resort access','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M21.54.8a13.67 13.67 0 0 1 9.74 16.43l-.08.3-.26.97-12.35-3.3-3.86 14.13h-2.07l4-14.66-12.12-3.24.26-.97A13.67 13.67 0 0 1 21.54.8zM5.67 21a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM25.33 4.92l.05.17c.74 2.34.77 5.38 0 8.5l-.1.33-.24.93 4.45 1.2.03-.2c.68-4.21-1-8.36-4.2-10.93zm-3.46-1.75-2.75 10.1 3.99 1.06.25-.93c1.23-4.6.44-8.83-1.5-10.23zm-1.95-.45c-2.28.38-4.9 3.46-6.14 7.79l-.08.3-.25.93 3.73 1zm-3.67-.26-.22.04a11.68 11.68 0 0 0-8.8 7.03l-.13.31-.07.19 4.48 1.2.25-.94c.9-3.33 2.55-6.12 4.5-7.83z"></path></svg>');

-- Outdoor
INSERT INTO amenities (category_id, name, svg) VALUES
(11,'Private backyard - Fully fenced','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a5 5 0 0 1 5 5 5 5 0 0 1 0 10 5 5 0 0 1-4 4.9v4.29A9.04 9.04 0 0 1 23.95 22a8.94 8.94 0 0 1 3.74.81l.31.15v2.33A6.96 6.96 0 0 0 23.95 24a6.88 6.88 0 0 0-6.93 5.87l-.02.15v.1a1 1 0 0 1-.88.87L16 31a1 1 0 0 1-.97-.77l-.02-.12A6.95 6.95 0 0 0 7.97 24 6.96 6.96 0 0 0 4 25.23v-2.31a9.16 9.16 0 0 1 11 2.3V20.9a5 5 0 0 1-4-4.68V16h-.22a5 5 0 0 1 0-10H11v-.22A5 5 0 0 1 16 1zm2.86 14.1a4.98 4.98 0 0 1-5.72 0l-.07.23a3 3 0 1 0 5.85 0zM11 8a3 3 0 1 0 .67 5.93l.23-.07A4.98 4.98 0 0 1 11 11c0-1.06.33-2.05.9-2.86l-.23-.07A3.01 3.01 0 0 0 11 8zm10 0c-.23 0-.45.03-.67.07l-.23.07c.57.8.9 1.8.9 2.86a4.98 4.98 0 0 1-.9 2.86l.23.07A3 3 0 1 0 21 8zm-5 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-5a3 3 0 0 0-2.93 3.67l.07.23a4.98 4.98 0 0 1 5.72 0l.07-.23A3 3 0 0 0 16 3z"></path></svg>'),
(11,'Outdoor furniture','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 15v16h-2v-6h-6v6h-2v-6.15a2 2 0 0 1 1.84-1.84L21 23h6v-8zM5 15v8h6a2 2 0 0 1 2 1.85V31h-2v-6H5v6H3V15zM16 1a15 15 0 0 1 13.56 8.57 1 1 0 0 1-.8 1.42l-.1.01H17v8h8v2h-8v10h-2V21H7v-2h8v-8H3.35a1 1 0 0 1-.95-1.32l.04-.1A15 15 0 0 1 16 1zm0 2A13 13 0 0 0 5.4 8.47l-.2.28-.16.25h21.92l-.17-.25a13 13 0 0 0-10.1-5.73L16.34 3z"></path></svg>'),
(11,'Outdoor dining area','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 15v16h-2v-6h-6v6h-2v-6.15a2 2 0 0 1 1.84-1.84L21 23h6v-8zM5 15v8h6a2 2 0 0 1 2 1.85V31h-2v-6H5v6H3V15zM16 1a15 15 0 0 1 13.56 8.57 1 1 0 0 1-.8 1.42l-.1.01H17v8h8v2h-8v10h-2V21H7v-2h8v-8H3.35a1 1 0 0 1-.95-1.32l.04-.1A15 15 0 0 1 16 1zm0 2A13 13 0 0 0 5.4 8.47l-.2.28-.16.25h21.92l-.17-.25a13 13 0 0 0-10.1-5.73L16.34 3z"></path></svg>'),
(11,'Patio or balcony','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M23 1a2 2 0 0 1 2 1.85V19h4v2h-2v8h2v2H3v-2h2v-8H3v-2h4V3a2 2 0 0 1 1.85-2H9zM9 21H7v8h2zm4 0h-2v8h2zm4 0h-2v8h2zm4 0h-2v8h2zm4 0h-2v8h2zm-10-8H9v6h6zm8 0h-6v6h6zM15 3H9v8h6zm8 0h-6v8h6z"></path></svg>'),
(11,'Backyard','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a5 5 0 0 1 5 5 5 5 0 0 1 0 10 5 5 0 0 1-4 4.9v4.29A9.04 9.04 0 0 1 23.95 22a8.94 8.94 0 0 1 3.74.81l.31.15v2.33A6.96 6.96 0 0 0 23.95 24a6.88 6.88 0 0 0-6.93 5.87l-.02.15v.1a1 1 0 0 1-.88.87L16 31a1 1 0 0 1-.97-.77l-.02-.12A6.95 6.95 0 0 0 7.97 24 6.96 6.96 0 0 0 4 25.23v-2.31a9.16 9.16 0 0 1 11 2.3V20.9a5 5 0 0 1-4-4.68V16h-.22a5 5 0 0 1 0-10H11v-.22A5 5 0 0 1 16 1zm2.86 14.1a4.98 4.98 0 0 1-5.72 0l-.07.23a3 3 0 1 0 5.85 0zM11 8a3 3 0 1 0 .67 5.93l.23-.07A4.98 4.98 0 0 1 11 11c0-1.06.33-2.05.9-2.86l-.23-.07A3.01 3.01 0 0 0 11 8zm10 0c-.23 0-.45.03-.67.07l-.23.07c.57.8.9 1.8.9 2.86a4.98 4.98 0 0 1-.9 2.86l.23.07A3 3 0 1 0 21 8zm-5 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-5a3 3 0 0 0-2.93 3.67l.07.23a4.98 4.98 0 0 1 5.72 0l.07-.23A3 3 0 0 0 16 3z"></path></svg>'),
(11,'Beach essentials','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M21.54.8a13.67 13.67 0 0 1 9.74 16.43l-.08.3-.26.97-12.35-3.3-3.86 14.13h-2.07l4-14.66-12.12-3.24.26-.97A13.67 13.67 0 0 1 21.54.8zM5.67 21a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM25.33 4.92l.05.17c.74 2.34.77 5.38 0 8.5l-.1.33-.24.93 4.45 1.2.03-.2c.68-4.21-1-8.36-4.2-10.93zm-3.46-1.75-2.75 10.1 3.99 1.06.25-.93c1.23-4.6.44-8.83-1.5-10.23zm-1.95-.45c-2.28.38-4.9 3.46-6.14 7.79l-.08.3-.25.93 3.73 1zm-3.67-.26-.22.04a11.68 11.68 0 0 0-8.8 7.03l-.13.31-.07.19 4.48 1.2.25-.94c.9-3.33 2.55-6.12 4.5-7.83z"></path></svg>'),
(11,'Shared backyard - Fully fenced','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M16 1a5 5 0 0 1 5 5 5 5 0 0 1 0 10 5 5 0 0 1-4 4.9v4.29A9.04 9.04 0 0 1 23.95 22a8.94 8.94 0 0 1 3.74.81l.31.15v2.33A6.96 6.96 0 0 0 23.95 24a6.88 6.88 0 0 0-6.93 5.87l-.02.15v.1a1 1 0 0 1-.88.87L16 31a1 1 0 0 1-.97-.77l-.02-.12A6.95 6.95 0 0 0 7.97 24 6.96 6.96 0 0 0 4 25.23v-2.31a9.16 9.16 0 0 1 11 2.3V20.9a5 5 0 0 1-4-4.68V16h-.22a5 5 0 0 1 0-10H11v-.22A5 5 0 0 1 16 1zm2.86 14.1a4.98 4.98 0 0 1-5.72 0l-.07.23a3 3 0 1 0 5.85 0zM11 8a3 3 0 1 0 .67 5.93l.23-.07A4.98 4.98 0 0 1 11 11c0-1.06.33-2.05.9-2.86l-.23-.07A3.01 3.01 0 0 0 11 8zm10 0c-.23 0-.45.03-.67.07l-.23.07c.57.8.9 1.8.9 2.86a4.98 4.98 0 0 1-.9 2.86l.23.07A3 3 0 1 0 21 8zm-5 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0-5a3 3 0 0 0-2.93 3.67l.07.23a4.98 4.98 0 0 1 5.72 0l.07-.23A3 3 0 0 0 16 3z"></path></svg>'),
(11,'Sun loungers','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M5 17a1 1 0 0 1-.93-1.36 13.28 13.28 0 0 1 15.3-8.33 4 4 0 1 1 7.03 3.8l-.13.2.21.24a13.81 13.81 0 0 1 2.45 4.09 1 1 0 0 1-.82 1.35L28 17H17v9h13v2h-4v3h-2v-3H9v3H7v-3H2v-2h3.59l-4.3-4.3 1.42-1.4L8.4 26H15v-9zm11.5-8a11.2 11.2 0 0 0-9.77 5.69l-.17.31h19.88l-.17-.32a11.2 11.2 0 0 0-9.12-5.66L16.81 9zM31 8v2h-3V8zm-8-1a2 2 0 0 0-1.67.9 13.1 13.1 0 0 1 3.45 2.01A2 2 0 0 0 23 7zm4.95-4.36 1.41 1.41-2.12 2.12-1.41-1.41zm-9.9 0 2.12 2.12-1.41 1.41-2.12-2.12zM24 1v3h-2V1z"></path></svg>');

-- Parking and facilities
INSERT INTO amenities (category_id, name, svg) VALUES
(12,'Free parking on premises','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm20.7-5 .41 1.12A4.97 4.97 0 0 1 30 18v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H8v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.57.75-2.96 1.89-3.88L4.3 13H2v-2h3v.15L6.82 6.3A2 2 0 0 1 8.69 5h14.62c.83 0 1.58.52 1.87 1.3L27 11.15V11h3v2h-2.3zM6 25H4v2h2v-2zm22 0h-2v2h2v-2zm0-2v-5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5h24zm-3-10h.56L23.3 7H8.69l-2.25 6H25zm-15 7h12v-2H10v2z"></path></svg>'),
(12,'Pool','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 26c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 28c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 26zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 23c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 23c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 23c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 21c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 21c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 21zM20 3a4 4 0 0 1 4 3.8V9h4v2h-4v5a4 4 0 0 1 2.5.86l.17.15c.3.27.71.44 1.14.48l.19.01v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 18c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 18c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 18c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 16c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5a3.96 3.96 0 0 1 2.44-1H16v-5H4V9h12V7a2 2 0 0 0-4-.15V7h-2a4 4 0 0 1 7-2.65A3.98 3.98 0 0 1 20 3zm-2 13.52.46.31.21.18c.35.31.83.49 1.33.49a2 2 0 0 0 1.2-.38l.13-.11c.2-.19.43-.35.67-.49V11h-4zM20 5a2 2 0 0 0-2 1.85V9h4V7a2 2 0 0 0-2-2z"></path></svg>'),
(12,'Gym','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M10 5a2 2 0 0 1 2 1.85V15h8V7a2 2 0 0 1 1.85-2H24a2 2 0 0 1 2 1.85V9h2a2 2 0 0 1 2 1.85V15h2v2h-2v4a2 2 0 0 1-1.85 2H26v2a2 2 0 0 1-1.85 2H22a2 2 0 0 1-2-1.85V17h-8v8a2 2 0 0 1-1.85 2H8a2 2 0 0 1-2-1.85V23H4a2 2 0 0 1-2-1.85V17H0v-2h2v-4a2 2 0 0 1 1.85-2H6V7a2 2 0 0 1 1.85-2H8zm14 2h-2v18h2zM10 7H8v18h2zm18 4h-2v10h2zM6 11H4v10h2z"></path></svg>'),
(12,'Free street parking','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm20.7-5 .41 1.12A4.97 4.97 0 0 1 30 18v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H8v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.57.75-2.96 1.89-3.88L4.3 13H2v-2h3v.15L6.82 6.3A2 2 0 0 1 8.69 5h14.62c.83 0 1.58.52 1.87 1.3L27 11.15V11h3v2h-2.3zM6 25H4v2h2v-2zm22 0h-2v2h2v-2zm0-2v-5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5h24zm-3-10h.56L23.3 7H8.69l-2.25 6H25zm-15 7h12v-2H10v2z"></path></svg>'),
(12,'Private living room','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M29 3a1 1 0 0 1 .96.72l.03.12 1 6a1 1 0 0 1-.88 1.15L30 11h-2v17h2v2h-6v-2h2V11h-2a1 1 0 0 1-1-1.05l.01-.11 1-6a1 1 0 0 1 .87-.83L25 3zm-12 9a2 2 0 0 1 2 1.85V15h1a3 3 0 0 1 3 2.82V30h-2v-2H4v2H2V18a3 3 0 0 1 2.82-3H6v-1a2 2 0 0 1 1.7-1.98l.15-.01L8 12zm3 10H5a1 1 0 0 0-1 .88V26h17v-3a1 1 0 0 0-.77-.97l-.11-.02zm0-5h-1v3h1c.35 0 .69.06 1 .17V18a1 1 0 0 0-.88-1zM6 17H5a1 1 0 0 0-1 .88v2.29a3 3 0 0 1 .8-.16L5 20h1zm11-3H8v6h9zm11.15-9h-2.3l-.67 4h3.64z"></path></svg>'),
(12,'Shared outdoor pool - available all year, open 24 hours','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 26c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 28c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 28c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 26c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 26zm0-5c.99 0 1.95.35 2.67 1 .3.29.71.45 1.14.5H28v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 23c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 23c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 23c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 21c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.97 3.97 0 0 1 16 21c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5A3.98 3.98 0 0 1 24 21zM20 3a4 4 0 0 1 4 3.8V9h4v2h-4v5a4 4 0 0 1 2.5.86l.17.15c.3.27.71.44 1.14.48l.19.01v2h-.23a3.96 3.96 0 0 1-2.44-1A1.98 1.98 0 0 0 24 18c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 16 18c-.5 0-.98.17-1.33.5a3.98 3.98 0 0 1-2.67 1 3.98 3.98 0 0 1-2.67-1A1.98 1.98 0 0 0 8 18c-.5 0-.98.17-1.33.5a3.96 3.96 0 0 1-2.44 1H4v-2h.19a1.95 1.95 0 0 0 1.14-.5A3.98 3.98 0 0 1 8 16c.99 0 1.95.35 2.67 1 .35.33.83.5 1.33.5.5 0 .98-.17 1.33-.5a3.96 3.96 0 0 1 2.44-1H16v-5H4V9h12V7a2 2 0 0 0-4-.15V7h-2a4 4 0 0 1 7-2.65A3.98 3.98 0 0 1 20 3zm-2 13.52.46.31.21.18c.35.31.83.49 1.33.49a2 2 0 0 0 1.2-.38l.13-.11c.2-.19.43-.35.67-.49V11h-4zM20 5a2 2 0 0 0-2 1.85V9h4V7a2 2 0 0 0-2-2z"></path></svg>'),
(12,'Paid parking off premises','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm20.7-5 .41 1.12A4.97 4.97 0 0 1 30 18v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H8v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.57.75-2.96 1.89-3.88L4.3 13H2v-2h3v.15L6.82 6.3A2 2 0 0 1 8.69 5h14.62c.83 0 1.58.52 1.87 1.3L27 11.15V11h3v2h-2.3zM6 25H4v2h2v-2zm22 0h-2v2h2v-2zm0-2v-5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5h24zm-3-10h.56L23.3 7H8.69l-2.25 6H25zm-15 7h12v-2H10v2z"></path></svg>'),
(12,'Paid parking on premises','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M26 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 18a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm20.7-5 .41 1.12A4.97 4.97 0 0 1 30 18v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2H8v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.57.75-2.96 1.89-3.88L4.3 13H2v-2h3v.15L6.82 6.3A2 2 0 0 1 8.69 5h14.62c.83 0 1.58.52 1.87 1.3L27 11.15V11h3v2h-2.3zM6 25H4v2h2v-2zm22 0h-2v2h2v-2zm0-2v-5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v5h24zm-3-10h.56L23.3 7H8.69l-2.25 6H25zm-15 7h12v-2H10v2z"></path></svg>'),
(12,'Elevator','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M30 1a1 1 0 0 1 1 .88V30a1 1 0 0 1-.88 1H2a1 1 0 0 1-1-.88V2a1 1 0 0 1 .88-1H2zM3 3v26h12V3zm7 9v6.58l1.8-1.79 1.4 1.42-3.5 3.5a1 1 0 0 1-1.31.08l-.1-.08-3.5-3.5 1.42-1.42L8 18.6V12zm12.39-1.5a1 1 0 0 1 1.22 0l.1.09 3.5 3.5-1.42 1.41L24 13.7V20h-2v-6.3l-1.8 1.8-1.4-1.41 3.5-3.5zM17 29h12V3H17z"></path></svg>'),
(12,'Shared hot tub','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M9.5 2a4.5 4.5 0 0 1 3.53 7.3c.6.21 1.17.54 1.66.98l.19.19L17.4 13H31v2h-2v14a2 2 0 0 1-1.85 2H5a2 2 0 0 1-2-1.85V15H1v-2h2.1a5 5 0 0 1 2.96-3.6A4.5 4.5 0 0 1 9.5 2zm7.08 13H5v14h22V15h-7.59l3.3 3.3-1.42 1.4zM9.5 4a2.5 2.5 0 0 0-1 4.8V11H8a3 3 0 0 0-2.83 2h9.41l-1.12-1.12a3 3 0 0 0-1.92-.87l-.2-.01h-.84V8.8a2.5 2.5 0 0 0-1-4.8zm15.49-3a6.96 6.96 0 0 1-1.8 4.07l-.45.46A8.97 8.97 0 0 0 20.35 11h-2a10.97 10.97 0 0 1 3.2-7.12A4.96 4.96 0 0 0 22.97 1zm2 0h2a10.96 10.96 0 0 1-3.2 7.12A4.97 4.97 0 0 0 24.38 11h-2a6.97 6.97 0 0 1 1.8-4.06l.44-.47A8.96 8.96 0 0 0 26.99 1z"></path></svg>'),
(12,'Shared gym in building','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M10 5a2 2 0 0 1 2 1.85V15h8V7a2 2 0 0 1 1.85-2H24a2 2 0 0 1 2 1.85V9h2a2 2 0 0 1 2 1.85V15h2v2h-2v4a2 2 0 0 1-1.85 2H26v2a2 2 0 0 1-1.85 2H22a2 2 0 0 1-2-1.85V17h-8v8a2 2 0 0 1-1.85 2H8a2 2 0 0 1-2-1.85V23H4a2 2 0 0 1-2-1.85V17H0v-2h2v-4a2 2 0 0 1 1.85-2H6V7a2 2 0 0 1 1.85-2H8zm14 2h-2v18h2zM10 7H8v18h2zm18 4h-2v10h2zM6 11H4v10h2z"></path></svg>');

-- Services
INSERT INTO amenities (category_id, name, svg) VALUES
(13,'Self check-in','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 32px; width: 32px; fill: currentcolor;"><path d="M16.84 27.16v-3.4l-.26.09c-.98.32-2.03.51-3.11.55h-.7A11.34 11.34 0 0 1 1.72 13.36v-.59A11.34 11.34 0 0 1 12.77 1.72h.59c6.03.16 10.89 5.02 11.04 11.05V13.45a11.3 11.3 0 0 1-.9 4.04l-.13.3 7.91 7.9v5.6H25.7l-4.13-4.13zM10.31 7.22a3.1 3.1 0 1 1 0 6.19 3.1 3.1 0 0 1 0-6.2zm0 2.06a1.03 1.03 0 1 0 0 2.06 1.03 1.03 0 0 0 0-2.06zM22.43 25.1l4.12 4.13h2.67v-2.67l-8.37-8.37.37-.68.16-.3c.56-1.15.9-2.42.96-3.77v-.64a9.28 9.28 0 0 0-9-9h-.55a9.28 9.28 0 0 0-9 9v.54a9.28 9.28 0 0 0 13.3 8.1l.3-.16 1.52-.8v4.62z"></path></svg>'),
(13,'Building staff','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M21 3a2 2 0 0 1 2 1.85V12a7 7 0 0 1-2.23 5.12l-.2.18-.02.02.28.1A13.01 13.01 0 0 1 28.91 28H26.9a11 11 0 0 0-8.8-9.3l-.1-.02v-2.1a5 5 0 0 0 2.98-4.12l.02-.23V9H11v3a5 5 0 0 0 3 4.58v2.1a10.92 10.92 0 0 0-3 1.02V28H9v-6.99a11 11 0 0 0-3.9 7L3.1 28a13.02 13.02 0 0 1 7.8-10.46l.28-.11.28-.11-.23-.2a7 7 0 0 1-2.2-4.55l-.01-.3L9 12V5a2 2 0 0 1 1.85-2H11zm-3 23a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7-17H11v2h10z"></path></svg>'),
(13,'Smart lock','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 1a2 2 0 0 1 2 1.85V29h2v2H3v-2h2V3a2 2 0 0 1 1.85-2H7zm0 2H7v26h18zm-9 6a3 3 0 0 1 3 2.82V14a5 5 0 1 1-6 0v-2a3 3 0 0 1 3-3zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0-6a1 1 0 0 0-1 .88V13.1a5.02 5.02 0 0 1 2 0V12a1 1 0 0 0-1-1z"></path></svg>'),
(13,'Luggage dropoff allowed','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M30 29v2H2v-2zM20 1a2 2 0 0 1 2 1.85V5h3a5 5 0 0 1 5 4.78V22a5 5 0 0 1-4.78 5H7a5 5 0 0 1-5-4.78V10a5 5 0 0 1 4.78-5H10V3a2 2 0 0 1 1.85-2H12zm5 6H7a3 3 0 0 0-3 2.82V22a3 3 0 0 0 2.82 3H25a3 3 0 0 0 3-2.82V10a3 3 0 0 0-3-3zm-8 2v9.5l3.3-3.3 1.4 1.42-4.64 4.65-.11.1a1.5 1.5 0 0 1-1.9 0l-.11-.1-4.65-4.65 1.42-1.41L15 18.5V9zm3-6h-8v2h8z"></path></svg>'),
(13,'Breakfast','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M2 31a1 1 0 0 1-1-1 9 9 0 0 1 17.95-1H21c.74 0 1.43-.27 1.97-.74A2.99 2.99 0 0 0 24 26.2L24 26V14H13v6h-2v-7a1 1 0 0 1 .88-1H25a1 1 0 0 1 1 .88V15h4a1 1 0 0 1 1 .88V25a1 1 0 0 1-.88 1H26a4.99 4.99 0 0 1-1.71 3.77 4.98 4.98 0 0 1-3.03 1.22L21 31zm3.85-6.64a7 7 0 0 0-2.7 4.16l-.05.3-.03.18h4.1zM10 23c-.82 0-1.61.14-2.35.4l1.6 5.6h1.5l1.6-5.6a6.97 6.97 0 0 0-1.86-.38l-.25-.02zm4.15 1.36L12.82 29h4.1l-.02-.18a7 7 0 0 0-2.75-4.46zM29 17h-3v7h3zM20 1c0 2.06-.48 3.34-1.77 5.42l-.75 1.19C16.6 9 16.2 9.9 16.06 11h-2.02c.15-1.61.71-2.84 1.91-4.73l.57-.88c1.11-1.79 1.47-2.78 1.47-4.4zm5 0c0 2.06-.48 3.34-1.77 5.42l-.75 1.19C21.6 9 21.2 9.9 21.06 11h-2.02c.15-1.61.71-2.84 1.91-4.73l.57-.88c1.11-1.79 1.47-2.78 1.47-4.4z"></path></svg>'),
(13,'Smoking allowed','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M30 19v8h-2v-8zm-4 0v8H3a2 2 0 0 1-2-1.85V21a2 2 0 0 1 1.85-2H3zm-2 2H3v4h21zM21 3a4 4 0 0 1 3.36 6.18l-.1.14.13.04a8 8 0 0 1 5.6 7.4L30 17h-2a6 6 0 0 0-5.78-6H21V9a2 2 0 0 0 .15-4H21zm-4 0v2a4 4 0 0 0-.2 8H22a4 4 0 0 1 4 3.8v.2h-2a2 2 0 0 0-1.85-2H17a6 6 0 0 1-.23-12z"></path></svg>'),
(13,'Long term stays allowed','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M11.67 0v1.67h8.66V0h2v1.67h6a2 2 0 0 1 2 1.85v16.07a2 2 0 0 1-.46 1.28l-.12.13L21 29.75a2 2 0 0 1-1.24.58H6.67a5 5 0 0 1-5-4.78V3.67a2 2 0 0 1 1.85-2h6.15V0zm16.66 11.67H3.67v13.66a3 3 0 0 0 2.82 3h11.18v-5.66a5 5 0 0 1 4.78-5h5.88zm-.08 8h-5.58a3 3 0 0 0-3 2.82v5.76zm-18.58-16h-6v6h24.66v-6h-6v1.66h-2V3.67h-8.66v1.66h-2z"></path></svg>'),
(13,'Cleaning available during stay','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 0v6h-4.3c.13 1.4.67 2.72 1.52 3.78l.2.22-1.5 1.33a9.05 9.05 0 0 1-2.2-5.08c-.83.38-1.32 1.14-1.38 2.2v4.46l4.14 4.02a5 5 0 0 1 1.5 3.09l.01.25.01.25v8.63a3 3 0 0 1-2.64 2.98l-.18.01-.21.01-12-.13A3 3 0 0 1 4 29.2L4 29.02v-8.3a5 5 0 0 1 1.38-3.45l.19-.18L10 12.9V8.85l-4.01-3.4.02-.7A5 5 0 0 1 10.78 0H11zm-5.03 25.69a8.98 8.98 0 0 1-6.13-2.41l-.23-.23A6.97 6.97 0 0 0 6 21.2v7.82c0 .51.38.93.87 1H7l11.96.13h.13a1 1 0 0 0 .91-.88l.01-.12v-3.52c-.34.04-.69.06-1.03.06zM17.67 2H11a3 3 0 0 0-2.92 2.3l-.04.18-.01.08 3.67 3.1h2.72l.02-.1a4.29 4.29 0 0 1 3.23-3.4zM30 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-3-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5 0h-2.33v2H22zm8-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM20 20.52a3 3 0 0 0-.77-2l-.14-.15-4.76-4.61v-4.1H12v4.1l-5.06 4.78a3 3 0 0 0-.45.53 9.03 9.03 0 0 1 7.3 2.34l.23.23A6.98 6.98 0 0 0 20 23.6z"></path></svg>'),
(13,'Host greets you','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m30.78 17.35.11.2a3.53 3.53 0 0 1-1.04 4.4l-.16.12-11.73 7.83a5 5 0 0 1-3.56.77l-.26-.05-11.56-2.47a2 2 0 0 1-1.57-1.8L1 26.2V21a2 2 0 0 1 1.85-2H19.24c.68 0 1.17.32 1.46.81l5.87-3.52a3.07 3.07 0 0 1 4.21 1.06zm-3.07.6-.11.06-6.63 3.98-.08.3a3.83 3.83 0 0 1-3.66 2.7L17 25h-5v-2h5c.39 0 .72-.07 1-.19V21H3v5.2l11.56 2.47a3 3 0 0 0 2.12-.33l.17-.1 11.73-7.83c.6-.4.84-1.17.58-1.83l-.05-.13-.04-.07a1.07 1.07 0 0 0-1.25-.47zM11 1a8 8 0 0 1 7.29 4.7l.13.3h7.5l3 3-3 3h-3.5L20 14.41l-1.84-1.84-.1.2a8 8 0 0 1-6.5 4.21l-.29.02H11a8 8 0 1 1 0-16zm0 2a6 6 0 1 0 5.68 7.95l.07-.23.21-.72h1.45L20 11.58 21.59 10h3.5l1-1-1-1h-8.13l-.2-.71A6 6 0 0 0 11 3zM8 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(13,'Keypad','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 1a5 5 0 0 1 5 4.78V26a5 5 0 0 1-4.78 5H8a5 5 0 0 1-5-4.78V6a5 5 0 0 1 4.78-5H8zm0 2H8a3 3 0 0 0-3 2.82V26a3 3 0 0 0 2.82 3H24a3 3 0 0 0 3-2.82V6a3 3 0 0 0-2.82-3zm-8 14a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-2-6.54a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM16 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-2-3.46a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(13,'Lockbox','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M25 2a5 5 0 0 1 5 4.78V25a5 5 0 0 1-4.78 5H7a5 5 0 0 1-5-4.78V7a5 5 0 0 1 4.78-5H7zm0 2H7a3 3 0 0 0-3 2.82V11h2V6h20v20H6v-5H4v4a3 3 0 0 0 2.82 3H25a3 3 0 0 0 3-2.82V7a3 3 0 0 0-2.82-3zm-1 4H8v16h16zm-8 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 13H4v6h2z"></path></svg>'),
(13,'Housekeeping - available at extra cost','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M24 0v6h-4.3c.13 1.4.67 2.72 1.52 3.78l.2.22-1.5 1.33a9.05 9.05 0 0 1-2.2-5.08c-.83.38-1.32 1.14-1.38 2.2v4.46l4.14 4.02a5 5 0 0 1 1.5 3.09l.01.25.01.25v8.63a3 3 0 0 1-2.64 2.98l-.18.01-.21.01-12-.13A3 3 0 0 1 4 29.2L4 29.02v-8.3a5 5 0 0 1 1.38-3.45l.19-.18L10 12.9V8.85l-4.01-3.4.02-.7A5 5 0 0 1 10.78 0H11zm-5.03 25.69a8.98 8.98 0 0 1-6.13-2.41l-.23-.23A6.97 6.97 0 0 0 6 21.2v7.82c0 .51.38.93.87 1H7l11.96.13h.13a1 1 0 0 0 .91-.88l.01-.12v-3.52c-.34.04-.69.06-1.03.06zM17.67 2H11a3 3 0 0 0-2.92 2.3l-.04.18-.01.08 3.67 3.1h2.72l.02-.1a4.29 4.29 0 0 1 3.23-3.4zM30 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-3-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-5 0h-2.33v2H22zm8-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM20 20.52a3 3 0 0 0-.77-2l-.14-.15-4.76-4.61v-4.1H12v4.1l-5.06 4.78a3 3 0 0 0-.45.53 9.03 9.03 0 0 1 7.3 2.34l.23.23A6.98 6.98 0 0 0 20 23.6z"></path></svg>');

-- Not included
INSERT INTO amenities (category_id, name, svg) VALUES
(14,'Exterior security cameras on property','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m2 6.24 2 2V16h3.1a5 5 0 0 1 1.76-2.9l1.43 1.43a3 3 0 1 0 4.18 4.18l1.42 1.43a5 5 0 0 1-2.97 1.78A5 5 0 0 1 8.22 26H4v4H2V20h2v4h4a3 3 0 0 0 2.87-2.13A5 5 0 0 1 7.1 18H4a2 2 0 0 1-2-1.85V6.24zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM7.25 3H23a2 2 0 0 1 2 1.85v1.67l5-2v11.96l-5-2V16a2 2 0 0 1-1.85 2h-.91l-2-2H23V5H9.24l-2-2zM28 7.48l-3 1.2v3.64l3 1.2V7.48z"></path></svg>'),
(14,'Kitchen','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m24.5 28.74 2 2V31h-2v-2.26zm-10-10 6 6V25c0 3.27-2.18 6-5 6s-5-2.73-5-6c0-2.87 1.68-5.33 4-5.88v-.38zm-13-13 2 2V19h4l-.02-.96-.03-.95a53.9 53.9 0 0 0-.5-5.9l2.28 2.28c.17 1.82.26 3.83.27 6.03V21h-6v10h-2V5.74zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM15.5 21c-1.6 0-3 1.75-3 4s1.4 4 3 4 3-1.75 3-4-1.4-4-3-4zm10-20a5 5 0 0 1 5 5v.37l-.02.74a40.63 40.63 0 0 1-.27 3.67l-.09.71-.1.7-.12.7-.13.67-.14.66c-.7 3.15-1.79 5.63-3.13 6.47v1.57l-3.69-3.69c-1.4-2.79-2.27-7.59-2.3-12.23L20.5 6v-.22a5 5 0 0 1 5-4.78zm-1 2.17a3 3 0 0 0-2 2.65v.49c.05 4.32 1.03 9.13 2 11.39V3.17zm2 0V17.7c.99-2.31 2-7.3 2-11.7a3 3 0 0 0-2-2.83zM16.5 1v11.26l-2-2V1h2z"></path></svg>'),
(14,'Heating','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m11 15.24 2 2v1.54l-.43.3a6 6 0 1 0 9.11 6.85l1.54 1.53a8 8 0 1 1-12.47-9.5l.25-.2v-2.52zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM15 19.24l5 5a4 4 0 1 1-5-4.11v-.89zM16 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0-22a5 5 0 0 1 5 4.78v11.98l-2-2V11h-3.76l-.24-.24V9h4V7h-4V5h4a3 3 0 0 0-6-.18v3.94l-2-2V5A5 5 0 0 1 15.56.02l.22-.01L16 0z"></path></svg>'),
(14,'Wifi','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m4.06 2.3 26 26-1.41 1.4-26-26 1.41-1.4zM16 20h.11L20 23.9V24a4 4 0 1 1-4-4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-3.97-6.08 1.52 1.52a7.02 7.02 0 0 0-4.08 4.03l-1.51-1.51a9.04 9.04 0 0 1 4.07-4.04zM16 10c4.89 0 9.2 2.5 11.7 6.3l-1.45 1.45a12 12 0 0 0-9.64-5.73l-1.95-1.96c.44-.04.89-.06 1.34-.06zm-7.63 2.26 1.45 1.45a12.06 12.06 0 0 0-4.07 4.04L4.3 16.3a14.08 14.08 0 0 1 4.07-4.04zM16 5c6.27 0 11.83 3.03 15.29 7.71l-1.44 1.44a16.98 16.98 0 0 0-17.8-6.69l-1.62-1.63C12.19 5.29 14.06 5 16 5zM4.78 8.67 6.2 10.1a17.1 17.1 0 0 0-4.06 4.05L.7 12.7a19.11 19.11 0 0 1 4.07-4.04z"></path></svg>'),
(14,'TV','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m3.7 2.3 26 26-1.4 1.4-26-26 1.4-1.4zM1.53 5.76l1.56 1.55a3 3 0 0 0-.08.5V20a3 3 0 0 0 2.82 3h12.94L21 25.24V27h1.76l.24.24V29H9v-2h2v-2H6a5 5 0 0 1-5-4.78V8a5 5 0 0 1 .53-2.23zM19 25h-6v2h6v-2zM7.24 3H26a5 5 0 0 1 5 4.78V20a5 5 0 0 1-2.45 4.3l-1.5-1.49A3 3 0 0 0 29 20.18V8a3 3 0 0 0-2.82-3H9.24l-2-2z"></path></svg>'),
(14,'Washer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m2 6.24 2 2V28h19.76l2 2H4a2 2 0 0 1-2-1.85V6.24zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM28 2a2 2 0 0 1 2 1.85v21.91l-2-2V4H8.24l-2-2H28zM7.88 12.12l2.38 2.38h-.1c-.34 0-.68.02-1.02.07a7 7 0 0 0 9.21 8.03l1.53 1.52a9 9 0 0 1-12-12zM16 7a9 9 0 0 1 8.12 12.88l-2.7-2.7h.05a7 7 0 0 0 1.45-.14 7 7 0 0 0-9.27-7.63l-1.53-1.53A8.96 8.96 0 0 1 16 7z"></path></svg>'),
(14,'Hair dryer','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M1.88 6.12 3.4 7.65a7 7 0 0 0 7.92 9.22l1.08-.22 4.25 4.24.97 3.59a2 2 0 0 1-1.75 2.51l-.18.01H14v.2a4 4 0 0 1-3.8 3.8H4v-2h6.15a2 2 0 0 0 1.84-1.84L12 27h-.24a2 2 0 0 1-1.88-1.31l-.05-.16-1.88-6.76A9 9 0 0 1 1.88 6.12zM3.7 2.29l26 26-1.42 1.42-26-26 1.42-1.42zM15.69 25l-1.8-6.62-1.8.38a9 9 0 0 1-1.67.23h-.33L11.76 25h3.93zM10 1c.54 0 1.07.05 1.58.14l.38.07 17.45 3.65a2 2 0 0 1 1.58 1.79l.01.16v6.38a2 2 0 0 1-1.43 1.91l-.16.04-8.3 1.73-1.68-1.69 9.57-2V6.82L11.54 3.17a7.03 7.03 0 0 0-3.9.24L6.13 1.88A8.96 8.96 0 0 1 10 1zM5.05 9.3l5.66 5.65a5 5 0 0 1-5.66-5.66zM10 5a5 5 0 0 1 4.95 5.7L9.29 5.06A5 5 0 0 1 10 5z"></path></svg>'),
(14,'Smoke alarm','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m3.49 7.73 1.44 1.44A12.94 12.94 0 0 0 3 16a13 13 0 0 0 19.82 11.07l1.45 1.44A14.93 14.93 0 0 1 16 31 15 15 0 0 1 3.49 7.73zm.22-5.44 26 26-1.42 1.42-26-26 1.42-1.42zM16 1a15 15 0 0 1 12.52 23.27l-1.45-1.45A12.94 12.94 0 0 0 29 16 13 13 0 0 0 16 3a12.94 12.94 0 0 0-6.83 1.93L7.74 3.5A14.93 14.93 0 0 1 16 1zm-4.9 16a5 5 0 0 0 3.9 3.9v2.03A7 7 0 0 1 9.07 17h2.03zm5.9 4.24 1.35 1.36a6.95 6.95 0 0 1-1.35.33v-1.69zM21.24 17h1.69c-.07.47-.18.92-.34 1.35L21.24 17zM17 9.07A7 7 0 0 1 22.93 15H20.9a5 5 0 0 0-3.9-3.9V9.07zm-7.6 4.58L10.76 15H9.07c.07-.47.18-.92.33-1.35zM15 9.07v1.69L13.65 9.4A6.95 6.95 0 0 1 15 9.07zM23 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(14,'Carbon monoxide alarm','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="M2.05 6.3 4 8.23V25a3 3 0 0 0 2.82 3h16.94l1.95 1.95c-.16.02-.33.04-.5.04L25 30H7a5 5 0 0 1-5-4.78V7c0-.24.02-.48.05-.7zm1.66-4 26 26-1.42 1.4-26-26 1.42-1.4zM25 2a5 5 0 0 1 5 4.78V25a5 5 0 0 1-.05.7L28 23.77V7a3 3 0 0 0-2.82-3H8.24L6.3 2.05c.16-.02.33-.04.5-.04L7 2h18zM11.1 17a5 5 0 0 0 3.9 3.9v2.03A7 7 0 0 1 9.07 17h2.03zm5.9 4.24 1.35 1.36a6.95 6.95 0 0 1-1.35.33v-1.69zM21.24 17h1.69c-.07.47-.18.92-.34 1.35L21.24 17zM17 9.07A7 7 0 0 1 22.93 15H20.9a5 5 0 0 0-3.9-3.9V9.07zm-7.6 4.58L10.76 15H9.07c.07-.47.18-.92.33-1.35zM15 9.07v1.69L13.65 9.4A6.95 6.95 0 0 1 15 9.07zM23 8a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(14,'Shampoo','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m8.06 12.3 3.7 3.7H10v4h5.76l2 2H10v5a2 2 0 0 0 1.85 2H20a2 2 0 0 0 2-1.85v-.91l1.85 1.85A4 4 0 0 1 20.2 31L20 31h-8a4 4 0 0 1-4-3.8V13a4 4 0 0 1 .06-.7zm-4.35-10 26 26-1.42 1.4-26-26 1.42-1.4zM20 1v2h-3v2h1a2 2 0 0 1 2 1.85V9a4 4 0 0 1 4 3.8v6.96l-2-2V16h-1.76l-2-2H22v-1a2 2 0 0 0-2-2h-4.76L12 7.76V7a2 2 0 0 1 1.85-2H15V3H8V1h12zm-2 6h-4v2h4V7z"></path></svg>'),
(14,'Private entrance','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m5 9.24 2 2V29h17.76l2 2H3v-2h2V9.24zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM25 1a2 2 0 0 1 2 1.85v19.91l-2-2V3H7.24L5.71 1.47A2 2 0 0 1 6.85 1H25zm-3 14a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>'),
(14,'Essentials','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 24px; width: 24px; fill: currentcolor;"><path d="m4 8.24 2 2V17h6.76l2 2H6v2h10.76l2 2H6v2h14.76l1.89 1.9-.12.03-.16.03-.07.02a2.02 2.02 0 0 1-.3.02H10v2h14.76l1.89 1.9a1.99 1.99 0 0 1-.5.1H10a2 2 0 0 1-2-1.85V27H6a2 2 0 0 1-2-1.85V8.24zM3.7 2.3l26 26-1.4 1.42-26-26 1.4-1.42zM25.5 1l-.05.03a3 3 0 0 1 2.54 2.8L28 4v1h2v2h-2v16.76l-2-2V7h-2v12.76l-2-2V3H7.24L5.6 1.35c.37-.2.8-.32 1.23-.34L7 1h18.5zM25 3a1 1 0 0 0-1 .88V5h2V4a1 1 0 0 0-.88-1H25z"></path></svg>');

-- Insert sample locations
INSERT INTO locations (address, street, apt, city, state, zip, country, latitude, longitude) VALUES
('123 Main St, New York, NY', '123 Main St', 'Apt 1', 'New York', 'NY', '10001', 'USA', 40.7128, -74.0060),
('456 Elm St, Springfield, IL', '456 Elm St', '', 'Springfield', 'IL', '62701', 'USA', 39.7817, -89.6501);

-- Insert sample properties
INSERT INTO properties (
  host_id, title, description, 
  main_image, side_image1, side_image2, minimum_stay, location_id, 
  number_of_guests, number_of_bedrooms, number_of_beds, number_of_bathrooms, additional_info
) VALUES
(1, 'Beautiful Apartment', 'A beautiful apartment in the city center.',
'https://placehold.co/1024x1024/png?text=Main+Image', 'https://placehold.co/1024x1024/png?text=Side+Image+1',
'https://placehold.co/1024x1024/png?text=Side+Image+2', 5, 1,
4, 2, 3, 2, 'House rules: No smoking, no pets. Check-in after 3 PM, check-out before 11 AM.'),

(1, 'Cozy Cottage', 'A cozy cottage in the countryside.',
'https://placehold.co/1024x1024/png?text=Main+Image', 'https://placehold.co/1024x1024/png?text=Side+Image+1', 
'https://placehold.co/1024x1024/png?text=Side+Image+2', 3, 2,
6, 3, 3, 2, '');

-- Insert sample property images
INSERT INTO propertyimages (property_id, image_url) VALUES
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+3'),
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+4'),
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+5'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+3'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+4'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+5');

-- Insert sample property amenities
-- Property 1 (Beautiful Apartment) amenities
INSERT INTO propertyamenities (property_id, amenity_id) VALUES
(1, 1),
(1, 2),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 11);

-- Property 2 (Cozy Cottage) amenities
INSERT INTO propertyamenities (property_id, amenity_id) VALUES
(2, 3),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13);



-- New UPDATE 4/15/2025

-- Insert sample property availability
INSERT INTO propertyavailability (property_id, start_date, end_date, is_available, price, availability_type) VALUES
-- Property 1 (Beautiful Apartment)
(1, '2025-05-01', '2025-05-14', TRUE, 120.00, 'default'),
(1, '2025-05-15', '2025-05-31', TRUE, 135.00, 'default'),
(1, '2025-06-01', '2025-06-14', TRUE, 150.00, 'default'),
(1, '2025-06-15', '2025-06-20', FALSE, 150.00, 'booked'),
(1, '2025-06-21', '2025-06-30', TRUE, 165.00, 'default'),
(1, '2025-07-01', '2025-07-05', FALSE, 180.00, 'blocked'),
(1, '2025-07-06', '2025-07-31', TRUE, 180.00, 'default'),
(1, '2025-08-01', '2025-08-31', TRUE, 190.00, 'default'),

-- Property 2 (Cozy Cottage)
(2, '2025-05-01', '2025-05-31', TRUE, 150.00, 'default'),
(2, '2025-06-01', '2025-06-10', TRUE, 165.00, 'default'),
(2, '2025-06-11', '2025-06-18', FALSE, 165.00, 'booked'),
(2, '2025-06-19', '2025-06-30', TRUE, 165.00, 'default'),
(2, '2025-07-01', '2025-07-15', TRUE, 185.00, 'default'),
(2, '2025-07-16', '2025-07-23', FALSE, 185.00, 'booked'),
(2, '2025-07-24', '2025-07-31', TRUE, 185.00, 'default'),
(2, '2025-08-01', '2025-08-31', TRUE, 195.00, 'default');
```