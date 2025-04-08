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
          {/* Header with brand colors */}
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
              New Website Inquiry
            </Text>
          </Section>

          {/* Inquiry Details Section */}
          <Section style={{ padding: '32px 24px 16px' }}>
            <Text style={{ 
              fontSize: '22px', 
              fontWeight: '700',
              color: darkGray,
              borderBottom: `2px solid ${primaryRed}`,
              paddingBottom: '12px',
              margin: '0 0 24px 0',
              letterSpacing: '-0.3px',
            }}>
              Inquiry Details
            </Text>
            
            <Text style={{ margin: '12px 0', color: darkGray, fontSize: '16px', lineHeight: '1.6' }}>
              <span style={{ fontWeight: '600' }}>From:</span> {name}
            </Text>
            <Text style={{ margin: '12px 0', color: darkGray, fontSize: '16px', lineHeight: '1.6' }}>
              <span style={{ fontWeight: '600' }}>Email:</span> {email}
            </Text>
            <Text style={{ margin: '12px 0', color: darkGray, fontSize: '16px', lineHeight: '1.6' }}>
              <span style={{ fontWeight: '600' }}>Phone:</span> {phone || 'Not provided'}
            </Text>
          </Section>

          <Hr style={{ 
            borderColor: '#EEEEEE', 
            borderWidth: '1px',
            margin: '0',
          }} />

          {/* Message Section */}
          <Section style={{ padding: '32px 24px 16px' }}>
            <Text style={{ 
              fontSize: '22px', 
              fontWeight: '700',
              color: darkGray,
              borderBottom: `2px solid ${primaryRed}`,
              paddingBottom: '12px',
              margin: '0 0 24px 0',
              letterSpacing: '-0.3px',
            }}>
              Message
            </Text>

            <Section style={{ 
              backgroundColor: lightGray, 
              padding: '24px', 
              borderRadius: '12px',
              margin: '8px 0 24px' 
            }}>
              <Text style={{ 
                color: darkGray, 
                margin: '0',
                lineHeight: '1.6',
                fontSize: '16px',
              }}>
                {message}
              </Text>
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