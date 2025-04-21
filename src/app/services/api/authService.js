
const authService = {
  /*
    @requires
    {
      "email": "example@gmail.com",
      "password": "password123"
    }
    
    @returns
    ACCESS_TOKEN, REFRESH_TOKEN,
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "role": "guest",
      "email_verified": false,
      "identity_verified": false,
      "profile_image": "https://example.com/profile.jpg",
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    }

    @throws
    {
      "error": "Some error message"
    }
  */
  login: async (loginData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  },


  /*
    @requires
    {
      "redirectTo": "/"
    }
    
    @returns
    BROWSER REDIRECT TO GOOGLE OAUTH PAGE

    @throws
    {
      "error": "Some error message"
    }
  */
  googleLogin: (redirectTo = '/') => {
    try {
      const encodedRedirect = encodeURIComponent(redirectTo);
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google?redirect=${encodedRedirect}`;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      throw error;
    }
  },


  /*
    @requires
    NOTHING

    @returns
    REMOVES THE COOKIES FROM THE BROWSER

    @throws
    {
      "error": "Some error message"
    }
  */
  logout: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  },

  /*
    @requires
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "password": "password123"
    }

    @returns
    ACCESS_TOKEN, REFRESH_TOKEN,
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "role": "guest",
      "email_verified": false,
      "identity_verified": false,
      "profile_image": "https://example.com/profile.jpg",
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    }

    @throws
    {
      "error": "Some error message"
    }
  */
  signup: async (signUpData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signUpData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },


  /*
    @requires
    ACCESS_TOKEN,
    {
      "code": "123456"
    }

    @returns
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "role": "guest",
      "email_verified": true,
      "identity_verified": false,
      "profile_image": "https://example.com/profile.jpg",
      "created_at": "2023-10-01T12:00:00Z",
      "updated_at": "2023-10-01T12:00:00Z"
    }

    @throws
    {
      "error": "Some error message"
    }
  */
  verifyEmail: async (code) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ code })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error verifying email:', error)
      throw error
    }
  },


  /*
    @requires
    REFRESH_TOKEN

    @returns
    ACCESS_TOKEN, REFRESH_TOKEN

    @throws
    {
      "error": "Some error message"
    }
  */
  refresh: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error refreshing tokens:', error)
      throw error
    }
  },
}

export default authService

