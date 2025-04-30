import React from 'react';
import { Html, Body, Container, Text, Link, Section, Img, Hr, Button, Head } from '@react-email/components';

export default function ListingEmail({
  name,
  email,
  phone,
  message,
  propertyDetails
}) {
  // Define brand colors
  const primaryRed = "#FF0052";
  const primaryRedHover = "#FF266C";
  const darkGray = "#333333";
  const lightGray = "#F5F5F5";
  const white = "#FFFFFF";

  return (
    <Html>
      <Head />
      <Body style={{
        backgroundColor: lightGray,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        margin: '0',
        padding: '0',
      }}>
        <Container style={{
          backgroundColor: white,
          margin: '40px auto',
          padding: '0',
          maxWidth: '600px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}>
          {/* Header with logo and brand colors */}
          <Section style={{ 
            backgroundColor: primaryRed, 
            padding: '32px 24px',
            textAlign: 'center',
          }}>
            <Text style={{ 
              color: white, 
              fontSize: '28px', 
              fontWeight: '800',
              letterSpacing: '-0.5px',
              margin: '0',
              lineHeight: '1.2',
            }}>
              New Property Inquiry
            </Text>
          </Section>

          {/* Inquiry Details Section */}
          <Section style={{ padding: '32px 24px 16px' }}>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: darkGray,
              borderBottom: `3px solid ${primaryRed}`,
              paddingBottom: '12px',
              margin: '0 0 24px 0',
              letterSpacing: '-0.3px',
            }}>
              Inquiry Details
            </Text>
            
            <Text style={{ margin: '16px 0', color: darkGray, fontSize: '18px', lineHeight: '1.5' }}>
              <span style={{ fontWeight: '700', minWidth: '70px', display: 'inline-block' }}>Name:</span> {name}
            </Text>
            <Text style={{ margin: '16px 0', color: darkGray, fontSize: '18px', lineHeight: '1.5' }}>
              <span style={{ fontWeight: '700', minWidth: '70px', display: 'inline-block' }}>Email:</span> {email}
            </Text>
            <Text style={{ margin: '16px 0', color: darkGray, fontSize: '18px', lineHeight: '1.5' }}>
              <span style={{ fontWeight: '700', minWidth: '70px', display: 'inline-block' }}>Phone:</span> {phone || 'Not provided'}
            </Text>
            
            <Section style={{ 
              backgroundColor: lightGray, 
              padding: '24px', 
              borderRadius: '12px',
              margin: '24px 0',
              border: '1px solid #EEEEEE',
            }}>
              <Text style={{ 
                fontWeight: '700', 
                color: darkGray, 
                margin: '0 0 12px 0',
                fontSize: '18px',
              }}>
                Message:
              </Text>
              <Text style={{ color: darkGray, margin: '0', lineHeight: '1.6', fontSize: '18px' }}>
                {message}
              </Text>
            </Section>
          </Section>

          <Hr style={{ 
            borderColor: '#EEEEEE', 
            borderWidth: '1px',
            margin: '0',
          }} />

          {/* Property Details Section */}
          <Section style={{ padding: '32px 24px 16px' }}>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: '700',
              color: darkGray,
              borderBottom: `3px solid ${primaryRed}`,
              paddingBottom: '12px',
              margin: '0 0 24px 0',
              letterSpacing: '-0.3px',
            }}>
              Listing Details
            </Text>

            <Text style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              color: primaryRed,
              margin: '0 0 20px 0',
              letterSpacing: '-0.3px',
            }}>
              {propertyDetails.title}
            </Text>

            {/* Property Image */}
            <Img
              src={propertyDetails.main_image_url}
              alt={propertyDetails.title}
              width="100%"
              style={{ 
                borderRadius: '12px',
                marginBottom: '24px',
                maxHeight: '300px',
                objectFit: 'cover'
              }}
            />
            
            <Text style={{ 
              margin: '12px 0 24px', 
              color: darkGray,
              fontSize: '18px',
              lineHeight: '1.6',
            }}>
              <span style={{ fontWeight: '700', minWidth: '90px', display: 'inline-block' }}>Location:</span> {propertyDetails.location}
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0 16px' }}>
              <Button
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/listings/${propertyDetails.id}`}
                style={{
                  backgroundColor: primaryRed,
                  color: white,
                  padding: '16px 32px',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  fontSize: '16px',
                  textDecoration: 'none',
                  textTransform: 'none',
                  letterSpacing: '0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              >
                View Listing
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ 
            backgroundColor: lightGray, 
            padding: '24px', 
            textAlign: 'center'
          }}>
            <Text style={{ 
              color: darkGray, 
              fontSize: '14px',
              margin: '0 0 4px 0',
              lineHeight: '1.5',
            }}>
              This is an automated message from your rental website.
            </Text>
            <Text style={{ 
              color: darkGray, 
              fontSize: '14px',
              margin: '4px 0 0 0',
              lineHeight: '1.5',
            }}>
              © {new Date().getFullYear()} Your Rental Company. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}