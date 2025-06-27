import { Html, Head, Body, Container, Section, Row, Column, Text, Hr, Link } from '@react-email/components'
import * as React from 'react'

interface OTPEmailProps {
  code: string
}

const OTPEmail = ({ code }: OTPEmailProps) => {
  const styles = {
    wrapper: {
      backgroundColor: '#f4f4f4',
      padding: '20px 0',
      fontFamily: 'Arial, sans-serif',
    },
    main: {
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      color: '#333333',
    },
    content: {
      padding: '30px',
    },
    heading: {
      fontSize: '24px',
      margin: '0 0 20px',
      color: '#333333',
    },
    paragraph: {
      fontSize: '16px',
      lineHeight: '24px',
      margin: '0 0 20px',
    },
    otpBox: {
      display: 'inline-block',
      padding: '10px 20px',
      backgroundColor: '#f8f8f8',
      border: '1px solid #eeeeee',
      borderRadius: '5px',
      fontSize: '24px',
      fontWeight: 'bold',
      letterSpacing: '5px',
      textAlign: 'center',
    },
    footer: {
      backgroundColor: '#f8f8f8',
      padding: '20px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#666666',
    },
    footerLink: {
      color: '#1a73e8',
      margin: '0 10px',
    },
  }

  return (
    <Html>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Mã OTP Xác Thực</title>
      </Head>
      <Body style={styles.wrapper}>
        <Container style={styles.main}>
          {/* Main Content */}
          <Section style={styles.content}>
            <Row>
              <Column>
                <Text style={styles.heading}>Xác Thực Tài Khoản</Text>
                <Text style={styles.paragraph}>
                  Xin chào, <br />
                  Chúng tôi đã nhận được yêu cầu xác thực tài khoản của bạn. Vui lòng sử dụng mã OTP dưới đây để hoàn
                  tất quá trình:
                </Text>
                <Row>
                  <Column style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Text style={styles.otpBox}>{code}</Text>
                  </Column>
                </Row>
                <Text style={styles.paragraph}>
                  Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Divider */}
          <Hr style={{ borderTop: '1px solid #eeeeee' }} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Row>
              <Column>
                <Text style={{ margin: '0 0 10px' }}>© 2025 Công Ty Của Bạn. Mọi quyền được bảo lưu.</Text>
                <Text style={{ margin: '0 0 10px' }}>
                  <Link href="#" style={styles.footerLink}>
                    Hủy Đăng Ký
                  </Link>{' '}
                  |{' '}
                  <Link href="#" style={styles.footerLink}>
                    Chính Sách Bảo Mật
                  </Link>
                </Text>
                <Text style={{ margin: '0' }}>123 Đường Kinh Doanh, Quận 1, TP. Hồ Chí Minh, Việt Nam</Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OTPEmail
