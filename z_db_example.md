
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
// Our supabase storage bucket names
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
('Scenic Views'), -- 1
('Bathroom'), -- 2
('Bedroom and laundry'), -- 3
('Entertainment'), -- 4
('Family'), -- 5
('Heating and cooling'), -- 6
('Home safety'), -- 7
('Internet and office'), -- 8
('Kitchen and dining'), -- 9
('Location features'), -- 10
('Outdoor'), -- 11
('Parking and facilities'), -- 12
('Services'), -- 13
('Not included'); -- 14


-- AMENITY EXAMPLES DON'T HAVE COMPLETE SVGs FOR PROMPTING PURPOSES
-- THIS SAVES PROMPT CONTEXT, JUST KNOW THERE IS ACTUALLY SVG DATA THERE

-- Scenic Views
INSERT INTO amenities (category_id, name, svg) VALUES
(1,'Beach view','<svg></svg>'), -- 1
(1,'Garden view','<svg></svg>'), -- 2
(1,'Mountain view','<svg></svg>'), -- 3
(1,'Ocean view','<svg></svg>'), -- 4
(1,'City view', '<svg></svg>'); -- 5


-- Bathroom
INSERT INTO amenities (category_id, name, svg) VALUES
(2,'Hair dryer','<svg></svg>'), -- 6
(2,'Shampoo','<svg></svg>'), -- 7
(2,'Hot water','<svg></svg>'), -- 8
(2,'Shower gel','<svg></svg>'), -- 9
(2,'Bathtub','<svg></svg>'), -- 10
(2,'Conditioner','<svg></svg>'), -- 11
(2,'Body soap','<svg></svg>'), -- 12
(2,'Bidet','<svg></svg>'), -- 13
(2,'Cleaning products','<svg></svg>'); -- 14

-- Bedroom and laundry
INSERT INTO amenities (category_id, name, svg) VALUES
(3,'Washer','<svg></svg>'), -- 15
(3,'Dryer','<svg></svg>'), -- 16
(3,'Essentials','<svg></svg>'), -- 17
(3,'Hangers','<svg></svg>'), -- 18
(3,'Bed linens','<svg></svg>'), -- 19
(3,'Extra pillows and blankets','<svg></svg>'), -- 20
(3,'Iron','<svg></svg>'), -- 21
(3,'Room-darkening shades','<svg></svg>'), -- 22
(3,'Safe','<svg></svg>'), -- 23
(3,'Hair dryer','<svg></svg>'), -- 24
(3,'Clothing storage','<svg></svg>'); -- 25

-- Entertainment
INSERT INTO amenities (category_id, name, svg) VALUES
(4,'TV with Standard cable','<svg></svg>'), -- 26
(4,'Record player','<svg></svg>'), -- 27
(4,'Exercise equipment','<svg></svg>'), -- 28
(4,'Books and reading material','<svg></svg>'), -- 29
(4,'Bluetooth sound system','<svg></svg>'), -- 30
(4,'Ethernet connection','<svg></svg>'), -- 31
(4,'HDTV with standard cable, premium cable','<svg></svg>'), -- 32
(4,'TV','<svg></svg>'); -- 33

-- Family
INSERT INTO amenities (category_id, name, svg) VALUES
(5,'Window guards','<svg></svg>'), -- 34
(5,'Babysitter recommendations','<svg></svg>'), -- 35
(5,'Pack ’n play/Travel crib','<svg></svg>'), -- 36
(5,'Standalone high chair','<svg></svg>'); -- 37

-- Heating and cooling
INSERT INTO amenities (category_id, name, svg) VALUES
(6,'Air conditioning','<svg></svg>'), -- 38
(6,'Portable air conditioning','<svg></svg>'), -- 39
(6,'Indoor fireplace: electric','<svg></svg>'), -- 40
(6,'Heating','<svg></svg>'), -- 41
(6,'Ceiling fan','<svg></svg>'), -- 42
(6,'AC - split type ductless system','<svg></svg>'), -- 43
(6,'Central air conditioning','<svg></svg>'), -- 44
(6,'Central heating','<svg></svg>'); -- 45

-- Home safety
INSERT INTO amenities (category_id, name, svg) VALUES
(7,'Smoke alarm','<svg></svg>'), -- 46
(7,'Carbon monoxide alarm','<svg></svg>'), -- 47
(7,'Fire extinguisher','<svg></svg>'), -- 48
(7,'First aid kit','<svg></svg>'), -- 49
(7,'Exterior security cameras on property','<svg></svg>'); -- 50

-- Internet and office
INSERT INTO amenities (category_id, name, svg) VALUES
(8,'Wifi','<svg></svg>'), -- 51
(8,'Dedicated workspace','<svg></svg>'); -- 52

-- Kitchen and dining
INSERT INTO amenities (category_id, name, svg) VALUES
(9,'Refrigerator','<svg></svg>'), -- 53
(9,'Microwave','<svg></svg>'), -- 54
(9,'Dishes and silverware','<svg></svg>'), -- 55
(9,'Coffee maker','<svg></svg>'), -- 56
(9,'Kitchen','<svg></svg>'), -- 57
(9,'Cooking basics','<svg></svg>'), -- 58
(9,'Mini fridge','<svg></svg>'), -- 59
(9,'Freezer','<svg></svg>'), -- 60
(9,'Dishwasher','<svg></svg>'), -- 61
(9,'Induction stove','<svg></svg>'), -- 62
(9,'Stainless steel oven','<svg></svg>'), -- 63
(9,'Stainless steel electric stove','<svg></svg>'), -- 64
(9,'Rice maker','<svg></svg>'), -- 65
(9,'Blender','<svg></svg>'), -- 66
(9,'Baking sheet','<svg></svg>'), -- 67
(9,'Hot water kettle','<svg></svg>'), -- 68
(9,'Stove','<svg></svg>'), -- 69
(9,'Wine glasses','<svg></svg>'), -- 70
(9,'Toaster','<svg></svg>'), -- 71
(9,'Dining table','<svg></svg>'), -- 72
(9,'Oven','<svg></svg>'); -- 73

-- Location features
INSERT INTO amenities (category_id, name, svg) VALUES
(10,'Beach access - Beachfront','<svg></svg>'), -- 74
(10,'Private entrance','<svg></svg>'), -- 75
(10,'Waterfront','<svg></svg>'), -- 76
(10,'Free resort access','<svg></svg>'); -- 77

-- Outdoor
INSERT INTO amenities (category_id, name, svg) VALUES
(11,'Private backyard - Fully fenced','<svg></svg>'), -- 78
(11,'Outdoor furniture','<svg></svg>'), -- 79
(11,'Outdoor dining area','<svg></svg>'), -- 80
(11,'Patio or balcony','<svg></svg>'), -- 81
(11,'Backyard','<svg></svg>'), -- 82
(11,'Beach essentials','<svg></svg>'), -- 83
(11,'Shared backyard - Fully fenced','<svg></svg>'), -- 84
(11,'Sun loungers','<svg></svg>'); -- 85

-- Parking and facilities
INSERT INTO amenities (category_id, name, svg) VALUES
(12,'Free parking on premises','<svg></svg>'), -- 86
(12,'Pool','<svg></svg>'), -- 87
(12,'Gym','<svg></svg>'), -- 88
(12,'Free street parking','<svg></svg>'), -- 89
(12,'Private living room','<svg></svg>'), -- 90
(12,'Shared outdoor pool - available all year, open 24 hours','<svg></svg>'), -- 91
(12,'Paid parking off premises','<svg></svg>'), -- 92
(12,'Paid parking on premises','<svg></svg>'), -- 93
(12,'Elevator','<svg></svg>'), -- 94
(12,'Shared hot tub','<svg></svg>'), -- 95
(12,'Shared gym in building','<svg></svg>'); -- 96

-- Services
INSERT INTO amenities (category_id, name, svg) VALUES
(13,'Self check-in','<svg></svg>'), -- 97
(13,'Building staff','<svg></svg>'), -- 98
(13,'Smart lock','<svg></svg>'), -- 99
(13,'Luggage dropoff allowed','<svg></svg>'), -- 100
(13,'Breakfast','<svg></svg>'), -- 101
(13,'Smoking allowed','<svg></svg>'), -- 102
(13,'Long term stays allowed','<svg></svg>'), -- 103
(13,'Cleaning available during stay','<svg></svg>'), -- 104
(13,'Host greets you','<svg></svg>'), -- 105
(13,'Keypad','<svg></svg>'), -- 106
(13,'Lockbox','<svg></svg>'), -- 107
(13,'Housekeeping - available at extra cost','<svg></svg>'); -- 108

-- Not included
INSERT INTO amenities (category_id, name, svg) VALUES
(14,'Exterior security cameras on property','<svg></svg>'), -- 109
(14,'Kitchen','<svg></svg>'), -- 110
(14,'Heating','<svg></svg>'), -- 111
(14,'Wifi','<svg></svg>'), -- 112
(14,'TV','<svg></svg>'), -- 113
(14,'Washer','<svg></svg>'), -- 114
(14,'Hair dryer','<svg></svg>'), -- 115
(14,'Smoke alarm','<svg></svg>'), -- 116
(14,'Carbon monoxide alarm','<svg></svg>'), -- 117
(14,'Shampoo','<svg></svg>'), -- 118
(14,'Private entrance','<svg></svg>'), -- 119
(14,'Essentials','<svg></svg>'); -- 120

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
(1, 1), -- (property 1, beach view)
(1, 2),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 11);

-- Property 2 (Cozy Cottage) amenities
INSERT INTO propertyamenities (property_id, amenity_id) VALUES
(2, 3), -- (property 2, mountain view)
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