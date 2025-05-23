export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Replace with your production API URL
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh-token'
  },
  tasks: {
    base: '/tasks',
    userTasks: '/tasks/user',
    complete: '/tasks/complete',
    incomplete: '/tasks/incomplete'
  }
};
