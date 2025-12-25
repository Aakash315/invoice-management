import clientApi from './clientApi';

export const clientAuthService = {
  login: async (credentials) => {
    // FastAPI's OAuth2PasswordRequestForm expects username and password
    const form_data = new URLSearchParams();
    form_data.append('username', credentials.email);
    form_data.append('password', credentials.password);

    const response = await clientApi.post('/client-auth/token', form_data, { // Removed /api from path
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.access_token) {
      localStorage.setItem('client_token', response.data.access_token);
      localStorage.setItem('client_user', JSON.stringify(response.data.client)); // 'user' key in token response will actually be the client object
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('client_user');
  },

  getCurrentClient: () => {
    const clientUser = localStorage.getItem('client_user');
    try {
      return clientUser ? JSON.parse(clientUser) : null;
    } catch (e) {
      console.error("Error parsing client_user from localStorage", e);
      localStorage.removeItem('client_user'); // Clear invalid data
      return null;
    }
  },

  // No register or getProfile for clients for now, as per the plan (internal users manage client accounts)
};
