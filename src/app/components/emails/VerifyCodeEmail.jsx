import React from 'react';
import { Html, Body, Container, Text, Section, Hr, Head } from '@react-email/components';

export default function VerifyCodeEmail({
  verificationCode,
  first_name,
  last_name
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
              Verify Your Email
            </Text>
          </Section>

          {/* Welcome Section */}
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
              Hello, {first_name} {last_name}
            </Text>
            
            <Text style={{ margin: '16px 0', color: darkGray, fontSize: '16px', lineHeight: '1.6' }}>
              Thank you for signing up with Cozy Soul. Please use the verification code below to complete your email verification.
            </Text>
          </Section>

          <Hr style={{ 
            borderColor: '#EEEEEE', 
            borderWidth: '1px',
            margin: '0',
          }} />

          {/* Verification Code Section */}
          <Section style={{ padding: '32px 24px 16px', textAlign: 'center' }}>
            <Text style={{ 
              fontSize: '22px', 
              fontWeight: '700',
              color: darkGray,
              borderBottom: `2px solid ${primaryRed}`,
              paddingBottom: '12px',
              margin: '0 0 24px 0',
              letterSpacing: '-0.3px',
              textAlign: 'left',
            }}>
              Your Verification Code
            </Text>

            <Section style={{ 
              backgroundColor: lightGray, 
              padding: '32px 24px', 
              borderRadius: '12px',
              margin: '8px 0 24px',
              textAlign: 'center',
            }}>
              <Text style={{ 
                color: primaryRed, 
                margin: '0',
                lineHeight: '1.2',
                fontSize: '36px',
                fontWeight: '800',
                letterSpacing: '8px',
              }}>
                {verificationCode}
              </Text>
            </Section>
            
            <Text style={{ margin: '24px 0', color: darkGray, fontSize: '16px', lineHeight: '1.6', textAlign: 'left' }}>
              This code will expire in 15 minutes. If you did not request this verification, please ignore this email.
            </Text>
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
              This is an automated message from Cozy Soul Inc.
            </Text>
            <Text style={{ 
              color: darkGray, 
              fontSize: '14px',
              margin: '4px 0 0 0',
              lineHeight: '1.5',
            }}>
              © {new Date().getFullYear()} Cozy Soul Inc. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}