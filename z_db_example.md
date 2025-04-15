
__* Database Setup SQL Query *__

```sql
-- Table for admin access
CREATE TABLE Admins (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL, -- unhashed, as specified
  username VARCHAR(255) UNIQUE NOT NULL,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for amenity categories
CREATE TABLE AmenitiesCategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

-- Table for amenities
CREATE TABLE Amenities (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  svg TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES AmenitiesCategories(id) ON DELETE CASCADE
);

-- Table for locations
CREATE TABLE Locations (
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
CREATE TABLE Properties (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  price_description VARCHAR(50) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  main_image VARCHAR(255),
  side_image1 VARCHAR(255),
  side_image2 VARCHAR(255),
  location_id INTEGER NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  number_of_bedrooms INTEGER NOT NULL DEFAULT 1,
  number_of_beds INTEGER NOT NULL DEFAULT 1,
  number_of_bathrooms INTEGER NOT NULL DEFAULT 1,
  additional_info TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES Admins(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES Locations(id) ON DELETE CASCADE
);

-- Table for property images
CREATE TABLE PropertyImages (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE
);

-- Junction table for property amenities
CREATE TABLE PropertyAmenities (
  property_id INTEGER NOT NULL,
  amenity_id INTEGER NOT NULL,
  PRIMARY KEY (property_id, amenity_id),
  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES Amenities(id) ON DELETE CASCADE
);

-- Payment Integration Update 4/13/2025

-- Table for regular users (not admins)
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  password TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- Table for property availability (calendars)
CREATE TABLE PropertyAvailability (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  price DECIMAL(10, 2) NOT NULL,
  availability_type VARCHAR(50) NOT NULL DEFAULT 'default', -- 'default', 'booked', 'blocked'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE
);


-- Table for reservations
CREATE TABLE Reservations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests_count INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  total_installments INTEGER,
  current_installment INTEGER DEFAULT 0,
  next_payment_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES Properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
);

-- Table for installments (future payments)
CREATE TABLE Installments (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'overdue'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE CASCADE
);

-- Table for payments
CREATE TABLE Payments (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL,
  installment_id INTEGER, -- Optional reference to an installment
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- pending, succeeded, failed, refunded
  payment_type VARCHAR(50) NOT NULL, -- booking, installment, deposit, refund
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (installment_id) REFERENCES Installments(id) ON DELETE SET NULL
);

-- Table for email notifications
CREATE TABLE Notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  admin_id INTEGER,
  reservation_id INTEGER,
  type VARCHAR(50) NOT NULL, -- reservation_request, reservation_approved, payment_success, etc.
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES Admins(id) ON DELETE SET NULL,
  FOREIGN KEY (reservation_id) REFERENCES Reservations(id) ON DELETE CASCADE
);


```





__* Drop Database *__
```sql
-- This will forcibly drop all tables regardless of dependencies
DROP TABLE IF EXISTS PropertyAmenities CASCADE;
DROP TABLE IF EXISTS PropertyImages CASCADE;
DROP TABLE IF EXISTS Properties CASCADE;
DROP TABLE IF EXISTS Amenities CASCADE;
DROP TABLE IF EXISTS Locations CASCADE;
DROP TABLE IF EXISTS AmenitiesCategories CASCADE;
DROP TABLE IF EXISTS Admins CASCADE;

-- Also drop the trigger function
DROP FUNCTION IF EXISTS update_timestamp() CASCADE;
```





__* Database Seeding SQL Query *__

```sql
-- Insert admin user
INSERT INTO Admins (first_name, last_name, email, password, username, profile_image)
VALUES ('Pablo', 'Valdes', 'example@gmail.com', 'password123', 'Admin', 'https://placehold.co/1024x1024/png?text=Admin');


-- Insert amenity categories
INSERT INTO AmenitiesCategories (name) VALUES 
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
INSERT INTO Amenities (category_id, name, svg) VALUES
(1,'Beach view','<svg></svg>'), -- 1
(1,'Garden view','<svg></svg>'), -- 2
(1,'Mountain view','<svg></svg>'), -- 3
(1,'Ocean view','<svg></svg>'), -- 4
(1,'City view', '<svg></svg>'), -- 5


-- Bathroom
INSERT INTO Amenities (category_id, name, svg) VALUES
(2,'Hair dryer','<svg></svg>'), -- 6
(2,'Shampoo','<svg></svg>'), -- 7
(2,'Hot water','<svg></svg>'), -- 8
(2,'Shower gel','<svg></svg>'), -- 9
(2,'Bathtub','<svg></svg>'), -- 10
(2,'Conditioner','<svg></svg>'), -- 11
(2,'Body soap','<svg></svg>'), -- 12
(2,'Bidet','<svg></svg>'), -- 13
(2,'Cleaning products','<svg></svg>'), -- 14

-- Bedroom and laundry
INSERT INTO Amenities (category_id, name, svg) VALUES
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
(3,'Clothing storage','<svg></svg>'), -- 25

-- Entertainment
INSERT INTO Amenities (category_id, name, svg) VALUES
(4,'TV with Standard cable','<svg></svg>'), -- 26
(4,'Record player','<svg></svg>'), -- 27
(4,'Exercise equipment','<svg></svg>'), -- 28
(4,'Books and reading material','<svg></svg>'), -- 29
(4,'Bluetooth sound system','<svg></svg>'), -- 30
(4,'Ethernet connection','<svg></svg>'), -- 31
(4,'HDTV with standard cable, premium cable','<svg></svg>'), -- 32
(4,'TV','<svg></svg>'), -- 33

-- Family
INSERT INTO Amenities (category_id, name, svg) VALUES
(5,'Window guards','<svg></svg>'), -- 34
(5,'Babysitter recommendations','<svg></svg>'), -- 35
(5,'Pack ’n play/Travel crib','<svg></svg>'), -- 36
(5,'Standalone high chair','<svg></svg>'), -- 37

-- Heating and cooling
INSERT INTO Amenities (category_id, name, svg) VALUES
(6,'Air conditioning','<svg></svg>'), -- 38
(6,'Portable air conditioning','<svg></svg>'), -- 39
(6,'Indoor fireplace: electric','<svg></svg>'), -- 40
(6,'Heating','<svg></svg>'), -- 41
(6,'Ceiling fan','<svg></svg>'), -- 42
(6,'AC - split type ductless system','<svg></svg>'), -- 43
(6,'Central air conditioning','<svg></svg>'), -- 44
(6,'Central heating','<svg></svg>'), -- 45

-- Home safety
INSERT INTO Amenities (category_id, name, svg) VALUES
(7,'Smoke alarm','<svg></svg>'), -- 46
(7,'Carbon monoxide alarm','<svg></svg>'), -- 47
(7,'Fire extinguisher','<svg></svg>'), -- 48
(7,'First aid kit','<svg></svg>'), -- 49
(7,'Exterior security cameras on property','<svg></svg>'), -- 50

-- Internet and office
INSERT INTO Amenities (category_id, name, svg) VALUES
(8,'Wifi','<svg></svg>'), -- 51
(8,'Dedicated workspace','<svg></svg>'), -- 52

-- Kitchen and dining
INSERT INTO Amenities (category_id, name, svg) VALUES
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
(9,'Oven','<svg></svg>'), -- 73

-- Location features
INSERT INTO Amenities (category_id, name, svg) VALUES
(10,'Beach access - Beachfront','<svg></svg>'), -- 74
(10,'Private entrance','<svg></svg>'), -- 75
(10,'Waterfront','<svg></svg>'), -- 76
(10,'Free resort access','<svg></svg>'), -- 77

-- Outdoor
INSERT INTO Amenities (category_id, name, svg) VALUES
(11,'Private backyard - Fully fenced','<svg></svg>'), -- 78
(11,'Outdoor furniture','<svg></svg>'), -- 79
(11,'Outdoor dining area','<svg></svg>'), -- 80
(11,'Patio or balcony','<svg></svg>'), -- 81
(11,'Backyard','<svg></svg>'), -- 82
(11,'Beach essentials','<svg></svg>'), -- 83
(11,'Shared backyard - Fully fenced','<svg></svg>'), -- 84
(11,'Sun loungers','<svg></svg>'), -- 85

-- Parking and facilities
INSERT INTO Amenities (category_id, name, svg) VALUES
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
(12,'Shared gym in building','<svg></svg>'), -- 96

-- Services
INSERT INTO Amenities (category_id, name, svg) VALUES
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
(13,'Housekeeping - available at extra cost','<svg></svg>'), -- 108

-- Not included
INSERT INTO Amenities (category_id, name, svg) VALUES
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
INSERT INTO Locations (address, street, apt, city, state, zip, country, latitude, longitude) VALUES
('123 Main St, New York, NY', '123 Main St', 'Apt 1', 'New York', 'NY', '10001', 'USA', 40.7128, -74.0060),
('456 Elm St, Springfield, IL', '456 Elm St', '', 'Springfield', 'IL', '62701', 'USA', 39.7817, -89.6501);

-- Insert sample properties
INSERT INTO Properties (
  host_id, title, description, price, price_description, currency, 
  main_image, side_image1, side_image2, location_id, 
  number_of_guests, number_of_bedrooms, number_of_beds, number_of_bathrooms, additional_info
) VALUES
(1, 'Beautiful Apartment', 'A beautiful apartment in the city center.', 120, 'daily', 'USD',
'https://placehold.co/1024x1024/png?text=Main+Image', 'https://placehold.co/1024x1024/png?text=Side+Image+1',
'https://placehold.co/1024x1024/png?text=Side+Image+2', 1,
4, 2, 3, 2, 'House rules: No smoking, no pets. Check-in after 3 PM, check-out before 11 AM.'),

(1, 'Cozy Cottage', 'A cozy cottage in the countryside.', 150, 'for five days', 'USD',
'https://placehold.co/1024x1024/png?text=Main+Image', 'https://placehold.co/1024x1024/png?text=Side+Image+1', 
'https://placehold.co/1024x1024/png?text=Side+Image+2', 2,
6, 3, 3, 2, '');

-- Insert sample property images
INSERT INTO PropertyImages (property_id, image_url) VALUES
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+3'),
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+4'),
(1, 'https://placehold.co/1024x1024/png?text=Side+Image+5'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+3'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+4'),
(2, 'https://placehold.co/1024x1024/png?text=Side+Image+5');

-- Insert sample property amenities
-- Property 1 (Beautiful Apartment) amenities
INSERT INTO PropertyAmenities (property_id, amenity_id) VALUES
(1, 1), -- (property 1, beach view)
(1, 2),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 11);

-- Property 2 (Cozy Cottage) amenities
INSERT INTO PropertyAmenities (property_id, amenity_id) VALUES
(2, 3), -- (property 2, mountain view)
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13);
```