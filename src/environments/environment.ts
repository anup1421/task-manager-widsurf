export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api', // Default .NET Core API URL
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh-token',
    logout: '/auth/logout'
  },
  tasks: {
    base: '/tasks',
    userTasks: '/tasks/user',
    complete: '/tasks/complete',
    incomplete: '/tasks/incomplete'
  }
};
