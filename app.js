require('./models/user');
const express = require('express');
const ejsMate = require('ejs-mate');
const path = require('path');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { isLoggedIn } = require('./middleware/index');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
const fs = require('fs');
const pdfParser = require('pdf-parser');


const mongoUrl = 'mongodb://localhost:27017/tresume';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connection Open')
}).catch((err) => {
    console.log('Got an issue')
    console.log(err);
})

const sessionConfig = {
    name: 'session',
    secret: 'notagoodsecret',
    resave: false,
    saveUninitialized: true,

}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the folder path where you want to store the uploaded files
        const folderPath = path.join(__dirname, 'uploads');

        // Use the 'fs' module to create the folder if it doesn't exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }

        // Set the folder path as the destination
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        // Set the file name to be the original name of the uploaded file
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set(path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('homePage', { req });
});

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: { type: 'error', message: 'Invalid email or password.' } }), (req, res) => {
    res.redirect('/upload')
})

app.get('/upload', isLoggedIn, (req, res) => {
    res.render('upload');
})


app.post('/signup', async (req, res) => {
    const { username, password, firstName, lastName } = req.body;
    const foundUser = await User.find({ username });
    if (foundUser.length) {
        req.flash('error', 'User is already registered');
        return res.redirect('/');
    }
    const user = new User({ username });
    const registerdUser = await User.register(user, password, function (err, newUser) {
        if (err) {
            console.log(err)
        }
        req.logIn(newUser, () => {
            res.redirect('/upload');
        })
    })
})

app.post('/upload', isLoggedIn, upload.single('resume'), (req, res) => {
    const filePath = req.file.path;
    console.log(req.file.path)

    // Use pdf-parser to extract text from PDF file
    pdfParser.pdf2json(filePath, function (error, pdf) {
        if (error) {
            console.error(error);
            res.status(500).send('Error parsing PDF file');
            return;
        }
        const response = JSON.stringify(pdf)
        res.send(response)
    });
})

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/')
    })
})

app.listen(3000, () => {
    console.log('Server is listening');
})
