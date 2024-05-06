const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const guitars = require('./guitarData.js');
const users = require('./userData.js');

const port = process.env.PORT || 3000;

app.use(express.json());

const ensureAuth = function (req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: "Error! Token was not provided." });
        return;
    }
    try {
        jwt.verify(token, process.env.TOKEN_SECRET);
    }
    catch (err) {
        res.status(401).json({ success: false, message: err });
        return;
    }
    next();
}

app.get('/', (req, res) => {
    res.send('Welcome to the Guitar API!');
})

app.get('/guitars', ensureAuth, function (req, res, next) {
    res.json(guitars).status(200);
});

app.post('/guitars', ensureAuth, (req, res) => {
    const newGuitar = req.body;
    newGuitar.id = uuidv4();
    guitars.push(newGuitar);
    res.status(201).json(newGuitar);
});

app.put('/guitars/:id', ensureAuth, (req, res) => {
    const id = req.params.id;
    const updatedGuitar = req.body;
    const index = guitars.findIndex(guitar => guitar.id === id);
    if (index !== -1) {
        guitars[index] = { ...guitars[index], ...updatedGuitar };
        res.json(guitars[index]).status(204);
    } else {
        res.status(404).json({ error: 'Guitar not found' });
    }
});

app.delete('/guitars/:id', ensureAuth, (req, res) => {
    const id = req.params.id;
    const index = guitars.findIndex(guitar => guitar.id === id);
    if (index !== -1) {
        guitars.splice(index, 1);
        res.sendStatus(204);
    } else {
        res.status(404).json({ error: 'Guitar not found' });
    }
});

app.post("/signup", async (req, res, next) => {
    const { email, password } = req.body;
    const newUser = {
        email,
        password,
    };
    users.push(newUser);
    let token;
    try {
        token = jwt.sign(
            { email: newUser.email },
            process.env.TOKEN_SECRET,
            { expiresIn: "1h" }
        );
    } catch (err) {
        console.log(err);
        const error = new Error("Error! Something went wrong.");
        return next(error);
    }
    res.status(201).json({
        success: true,
        data: {
            email: newUser.email,
            token: token
        },
    });
});

app.post("/login", async (req, res, next) => {
    console.log(process.env.TOKEN_SECRET);
    const { email, password } = req.body;
    const existingUser = users.find(user => user.email === email);

    if (!existingUser || existingUser.password !== password) {
        const error = new Error("Wrong details please check at once");
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { email: existingUser.email },
            process.env.TOKEN_SECRET,
            { expiresIn: "1h" }
        );
    } catch (err) {
        console.log(err);
        const error = new Error("Error! Something went wrong.");
        return next(error);
    }

    res.status(200).json({
        success: true,
        data: {
            email: existingUser.email,
            token: token
        },
    });
});

app.listen(port, () => console.log(`Server started on port ${port}`));