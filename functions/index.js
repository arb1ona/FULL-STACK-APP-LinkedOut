const functions = require('firebase-functions');
const admin = require('firebase-admin')
const app = require('express')();

const serviceAccount = require("../linkedout-react-firebase-adminsdk-7311b-b1d79b8f8f.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://linkedout-react.firebaseio.com"
});

const config = {
    apiKey: "AIzaSyCEOduKHd4pFx54BSZ8CS_4dneMPfRi2M8",
    authDomain: "linkedout-react.firebaseapp.com",
    databaseURL: "https://linkedout-react.firebaseio.com",
    projectId: "linkedout-react",
    storageBucket: "linkedout-react.appspot.com",
    messagingSenderId: "90001074432",
    appId: "1:90001074432:web:38954639fee41232266be5",
    measurementId: "G-94BHP4TH6Y"
};

const firebase = require('firebase');
firebase.initializeApp(config)

const db = admin.firestore()

app.get('/screams', (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'asc')
        .get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                    // ...doc.data()
                })
            })
            return res.json(screams)
        })
        .catch(err => console.error(err))
})

app.post('/scream', (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' })
            console.error(err)
        })
})
// Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: "req.body.password",
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }
    // TODO validate data

    let token, userId;

    admin.firestore()
        .doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken' })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err)
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already used' })
            } else {
                return res.status(500).json({ error: err.code })
            }
        })
})


// https://baseurl.com/api/whatever/
exports.api = functions.region('europe-west1').https.onRequest(app);