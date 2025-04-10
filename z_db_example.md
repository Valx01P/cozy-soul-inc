
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

__* Clear Database *__
```sql
-- Temporarily disable triggers to avoid foreign key constraint issues
SET session_replication_role = 'replica';

-- Truncate all tables (in order of dependencies)
TRUNCATE TABLE PropertyAmenities;
TRUNCATE TABLE PropertyImages;
TRUNCATE TABLE Properties;
TRUNCATE TABLE Amenities;
TRUNCATE TABLE Locations;
TRUNCATE TABLE AmenitiesCategories;
TRUNCATE TABLE Admins;

-- Re-enable triggers
SET session_replication_role = 'origin';
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


-- Bathroom
INSERT INTO Amenities (category_id, name, svg) VALUES
(2,'Hair dryer','<svg></svg>'), -- 5
(2,'Shampoo','<svg></svg>'), -- 6
(2,'Hot water','<svg></svg>'), -- 7
(2,'Shower gel','<svg></svg>'), -- 8
(2,'Bathtub','<svg></svg>'), -- 9
(2,'Conditioner','<svg></svg>'), -- 10
(2,'Body soap','<svg></svg>'), -- 11
(2,'Bidet','<svg></svg>'), -- 12
(2,'Cleaning products','<svg></svg>'), -- 13

-- Bedroom and laundry
INSERT INTO Amenities (category_id, name, svg) VALUES
(3,'Washer','<svg></svg>'), -- 14
(3,'Dryer','<svg></svg>'), -- 15
(3,'Essentials','<svg></svg>'), -- 16
(3,'Hangers','<svg></svg>'), -- 17
(3,'Bed linens','<svg></svg>'), -- 18
(3,'Extra pillows and blankets','<svg></svg>'), -- 19
(3,'Iron','<svg></svg>'), -- 20
(3,'Room-darkening shades','<svg></svg>'), -- 21
(3,'Safe','<svg></svg>'), -- 22
(3,'Hair dryer','<svg></svg>'), -- 23
(3,'Clothing storage','<svg></svg>'), -- 24

-- Entertainment
INSERT INTO Amenities (category_id, name, svg) VALUES
(4,'TV with Standard cable','<svg></svg>'), -- 25
(4,'Record player','<svg></svg>'), -- 26
(4,'Books and reading material','<svg></svg>'), -- 27
(4,'Bluetooth sound system','<svg></svg>'), -- 28
(4,'Ethernet connection','<svg></svg>'), -- 29
(4,'HDTV with standard cable, premium cable','<svg></svg>'), -- 30
(4,'TV','<svg></svg>'), -- 31

-- Family
INSERT INTO Amenities (category_id, name, svg) VALUES
(5,'Window guards','<svg></svg>'), -- 32
(5,'Babysitter recommendations','<svg></svg>'), -- 33

-- Heating and cooling
INSERT INTO Amenities (category_id, name, svg) VALUES
(6,'Air conditioning','<svg></svg>'), -- 34
(6,'Portable air conditioning','<svg></svg>'), -- 35
(6,'Indoor fireplace: electric','<svg></svg>'), -- 36
(6,'Heating','<svg></svg>'), -- 37
(6,'Ceiling fan','<svg></svg>'), -- 38
(6,'AC - split type ductless system','<svg></svg>'), -- 39
(6,'Central air conditioning','<svg></svg>'), -- 40
(6,'Central heating','<svg></svg>'), -- 41

-- Home safety
INSERT INTO Amenities (category_id, name, svg) VALUES
(7,'Smoke alarm','<svg></svg>'), -- 42
(7,'Carbon monoxide alarm','<svg></svg>'), -- 43
(7,'Fire extinguisher','<svg></svg>'), -- 44
(7,'First aid kit','<svg></svg>'), -- 45
(7,'Exterior security cameras on property','<svg></svg>'), -- 46

-- Internet and office
INSERT INTO Amenities (category_id, name, svg) VALUES
(8,'Wifi','<svg></svg>'), -- 47
(8,'Dedicated workspace','<svg></svg>'), -- 48

-- Kitchen and dining
INSERT INTO Amenities (category_id, name, svg) VALUES
(9,'Refrigerator','<svg></svg>'), -- 49
(9,'Microwave','<svg></svg>'), -- 50
(9,'Dishes and silverware','<svg></svg>'), -- 51
(9,'Coffee maker','<svg></svg>'), -- 52
(9,'Kitchen','<svg></svg>'), -- 53
(9,'Cooking basics','<svg></svg>'), -- 54
(9,'Mini fridge','<svg></svg>'), -- 55
(9,'Freezer','<svg></svg>'), -- 56
(9,'Dishwasher','<svg></svg>'), -- 57
(9,'Induction stove','<svg></svg>'), -- 58
(9,'Stainless steel oven','<svg></svg>'), -- 59
(9,'Hot water kettle','<svg></svg>'), -- 60
(9,'Coffee maker','<svg></svg>'), -- 61
(9,'Wine glasses','<svg></svg>'), -- 62
(9,'Toaster','<svg></svg>'), -- 63
(9,'Dining table','<svg></svg>'), -- 64
(9,'Coffee','<svg></svg>'), -- 65

-- Location features
INSERT INTO Amenities (category_id, name, svg) VALUES
(10,'Beach access - Beachfront','<svg></svg>'), -- 66
(10,'Private entrance','<svg></svg>'), -- 67
(10,'Waterfront','<svg></svg>'), -- 68
(10,'Free resort access','<svg></svg>'), -- 69

-- Outdoor
INSERT INTO Amenities (category_id, name, svg) VALUES
(11,'Private backyard - Fully fenced','<svg></svg>'), -- 70
(11,'Outdoor furniture','<svg></svg>'), -- 71
(11,'Outdoor dining area','<svg></svg>'), -- 72
(11,'Patio or balcony','<svg></svg>'), -- 73
(11,'Backyard','<svg></svg>'), -- 74
(11,'Beach essentials','<svg></svg>'), -- 75
(11,'Shared backyard - Fully fenced','<svg></svg>'), -- 76
(11,'Sun loungers','<svg></svg>'), -- 77

-- Parking and facilities
INSERT INTO Amenities (category_id, name, svg) VALUES
(12,'Free parking on premises','<svg></svg>'), -- 78
(12,'Pool','<svg></svg>'), -- 79
(12,'Gym','<svg></svg>'), -- 80
(12,'Free street parking','<svg></svg>'), -- 81
(12,'Private living room','<svg></svg>'), -- 82
(12,'Shared outdoor pool - available all year, open 24 hours','<svg></svg>'), -- 83
(12,'Paid parking off premises','<svg></svg>'), -- 84
(12,'Paid parking on premises','<svg></svg>'), -- 85
(12,'Elevator','<svg></svg>'), -- 86

-- Services
INSERT INTO Amenities (category_id, name, svg) VALUES
(13,'Self check-in','<svg></svg>'), -- 87
(13,'Building staff','<svg></svg>'), -- 88
(13,'Smart lock','<svg></svg>'), -- 89
(13,'Luggage dropoff allowed','<svg></svg>'), -- 90
(13,'Breakfast','<svg></svg>'), -- 91
(13,'Smoking allowed','<svg></svg>'), -- 92
(13,'Long term stays allowed','<svg></svg>'), -- 93
(13,'Cleaning available during stay','<svg></svg>'), -- 94
(13,'Host greets you','<svg></svg>'), -- 95
(13,'Keypad','<svg></svg>'), -- 96
(13,'Lockbox','<svg></svg>'), -- 97
(13,'Housekeeping - available at extra cost','<svg></svg>'), -- 98

-- Not included
INSERT INTO Amenities (category_id, name, svg) VALUES
(14,'Exterior security cameras on property','<svg></svg>'), -- 99
(14,'Kitchen','<svg></svg>'), -- 100
(14,'Heating','<svg></svg>'), -- 101
(14,'Wifi','<svg></svg>'), -- 102
(14,'TV','<svg></svg>'), -- 103
(14,'Washer','<svg></svg>'), -- 104
(14,'Hair dryer','<svg></svg>'), -- 105
(14,'Smoke alarm','<svg></svg>'), -- 106
(14,'Carbon monoxide alarm','<svg></svg>'), -- 107
(14,'Shampoo','<svg></svg>'), -- 108
(14,'Private entrance','<svg></svg>'), -- 109
(14,'Essentials','<svg></svg>'); -- 110

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