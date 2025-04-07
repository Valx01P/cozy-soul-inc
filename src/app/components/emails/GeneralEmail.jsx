import React from 'react';
import { Html, Body, Container, Text, Section, Hr, Head } from '@react-email/components';

export default function GeneralEmail({
  name,
  email,
  phone,
  message
}) {
  // Define brand colors
  const primaryRed = "#FF0052";
  const darkGray = "#333333";
  const lightGray = "#F5F5F5";
  const white = "#FFFFFF";

  return (
    <Html>
      <Head />
      <Body style={{
        backgroundColor: lightGray,
        fontFamily: 'Arial, sans-serif',
        margin: '0',
        padding: '0',
      }}>
        <Container style={{
          backgroundColor: white,
          margin: '40px auto',
          padding: '20px',
          maxWidth: '600px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Header with logo and brand colors */}
          <Section style={{ 
            backgroundColor: primaryRed, 
            padding: '20px',
            borderRadius: '6px 6px 0 0',
            marginBottom: '20px',
          }}>
            <Text style={{ 
              color: white, 
              fontSize: '24px', 
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '0'
            }}>
              New Website Inquiry
            </Text>
          </Section>

          {/* Inquiry Details Section */}
          <Section style={{ padding: '0 20px' }}>
            <Text style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: darkGray,
              borderBottom: `2px solid ${primaryRed}`,
              paddingBottom: '8px'
            }}>
              Inquiry Details
            </Text>
            
            <Text style={{ margin: '8px 0', color: darkGray }}>
              <span style={{ fontWeight: 'bold' }}>From:</span> {name}
            </Text>
            <Text style={{ margin: '8px 0', color: darkGray }}>
              <span style={{ fontWeight: 'bold' }}>Email:</span> {email}
            </Text>
            <Text style={{ margin: '8px 0', color: darkGray }}>
              <span style={{ fontWeight: 'bold' }}>Phone:</span> {phone || 'Not provided'}
            </Text>
          </Section>

          <Hr style={{ 
            borderColor: lightGray, 
            borderWidth: '1px', 
            margin: '20px 0' 
          }} />

          {/* Message Section */}
          <Section style={{ padding: '0 20px' }}>
            <Text style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: darkGray,
              borderBottom: `2px solid ${primaryRed}`,
              paddingBottom: '8px',
              marginBottom: '15px'
            }}>
              Message
            </Text>

            <Section style={{ 
              backgroundColor: lightGray, 
              padding: '20px', 
              borderRadius: '6px',
              margin: '15px 0' 
            }}>
              <Text style={{ 
                color: darkGray, 
                margin: '0',
                lineHeight: '1.5' 
              }}>
                {message}
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ 
            backgroundColor: lightGray, 
            padding: '15px', 
            borderRadius: '0 0 6px 6px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <Text style={{ 
              color: darkGray, 
              fontSize: '14px',
              margin: '0'
            }}>
              This is an automated message from your rental website.
            </Text>
            <Text style={{ 
              color: darkGray, 
              fontSize: '14px',
              margin: '5px 0 0 0'
            }}>
              © {new Date().getFullYear()} Your Rental Company. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}