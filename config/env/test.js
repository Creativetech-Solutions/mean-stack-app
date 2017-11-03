module.exports = {
    port: 3001,
    // This is your MYSQL Database configuration
    db: {
        name: 'spine',
        password: '',
        username: 'root'
    },
    app: {
        name: 'MEAN - A Modern Stack - Test'
    },
    facebook: {
        clientID: '824770854361592',
        clientSecret: '8599cce8d0533a0ef57ab6c68c395e9c',
        callbackURL: 'http://localhost:3000/api/auth/facebook/callback'
    },
    twitter: {
        clientID: 'dqpcbvpKkEmNHgGoK69gwsv1d',
        clientSecret: 'NZqr7Yg7GQkNlYkLahHSqz1OX8W0Cgo6Ohsw10yVH2fL0Vyr3P',
        callbackURL: 'http://localhost:3000/api/auth/twitter/callback'
    },
    github: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/api/auth/github/callback'
    },
    google: {
        realm: 'http://localhost:3000/',
        clientID: '594893509074-9gtvkl1qo1e369cuhd4be8vo00ta581e.apps.googleusercontent.com',
        clientSecret: 'xGdqMahlXGDYJFBH16bEl4_A',
        callbackURL: 'http://localhost:3000/api/auth/google/callback'
    }
};
