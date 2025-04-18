const userService = {
  /*
    @requires
    ACCESS_TOKEN

    @returns
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "email_verified": false,
      "phone_verified": false,
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
  getMe: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/users/me`, {
        method: 'GET',
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
      console.error('Error fetching user information:', error)
      throw error
    }
  },
  

  /*
    @requires
    ACCESS_TOKEN, ADMIN_ROLE

    @returns
    [
      {
        "id": "1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "example@gmail.com",
        "phone": "1234567890",
        "role": "guest",
        "email_verified": false,
        "phone_verified": false,
        "identity_verified": false,
        "profile_image": "https://example.com/profile.jpg",
        "created_at": "2023-10-01T12:00:00Z",
        "updated_at": "2023-10-01T12:00:00Z"
      },
      more users...
    ]
  */
  getAllUsers: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/users`, {
        method: 'GET',
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
      console.error('Error fetching all users:', error)
      throw error
    }
  },
  

  /*
    @requires
    ACCESS_TOKEN

    @returns
    {
      "id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "phone": "1234567890",
      "role": "guest",
      "email_verified": false,
      "phone_verified": false,
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
  getUserById: async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/users/${id}`, {
        method: 'GET',
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
      console.error(`Error fetching user with ID ${id}:`, error)
      throw error
    }
  },
  
  /*
    @requires
    ACCESS_TOKEN,
    {
      "first_name": "Updated First",
      "last_name": "Updated Last",
      "profile_image": "https://example.com/new-image.jpg"
    }

    @returns
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "example@gmail.com",
      "phone": "1234567890",
      "role": "guest",
      "email_verified": false,
      "phone_verified": false,
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
  updateMe: async (profileUpdateData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileUpdateData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error updating user information:', error)
      throw error
    }
  }
}

export default userService