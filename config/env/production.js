module.exports = {
    // This is your MYSQL Database configuration
    db: {
        name: 'spine',
        password: '',
        username: 'root1',
        //host:'192.168.100.88',
        host:'192.168.1.88',
        port:3306
    },
    app: {
        name: 'Anerve'
    },
// You will need to get your own client id's before this will work properly
    facebook: {
        clientID: '824770854361592',
        clientSecret: '8599cce8d0533a0ef57ab6c68c395e9c',
        callbackURL: 'http://localhost:3000/api/auth/facebook/callback'
    },
    twitter: {
        clientID: 'qiRHRqGv8Xx0SgZ8B0f9I2fqb',
        clientSecret: '5Tt474fnjccFgXwEjYtlM6OjQxgAcczaKppSjBhMbjBTYtKFD0',
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
