const express = require('express')
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/";

const client = new MongoClient(uri);

app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "pug");

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

async function main() {
    try{
        await client.connect();
        console.log("Connected to mongodb");

        const db = client.db("final");
        const userCollection = db.collection("users");
        app.use(express.urlencoded({extended: true}));



        app.get("/", function (req,res) {
            const message = req.query.message || '';
            const user = req.session.user || null;
            res.render('index.pug', {message,user});
        });

        app.post('/deny-friend-request', (req, res) => {
            const { fromUsername } = req.body;
            const currentUser = req.session.user;
        
            if (!fromUsername || !currentUser) return res.status(400).send('Bad request');
        
            
            db.collection('friendRequests').deleteOne({
                to: currentUser,
                from: fromUsername
            }, (err, result) => {
                if (err) return res.status(500).send('Error denying request');
                res.status(200).send('Request denied');
            });
        });

        app.get('/chat-history', async (req,res) => {
            if (!req.session.user) {
                return res.status(401).send('Not logged in');
            }

            const from = req.session.user;
            const to = req.query.friend;

            const chatCollection = db.collection("chats");

            const messages = await chatCollection.find({
                $or: [
                    { from: from, to: to},
                    { from: to, to: from}
                ]
            }).sort({ timestamp: 1}).toArray();
            res.json(messages);
        })

        app.get('/friends',async (req,res) =>{
            if(!req.session.user) {
                return res.status(401).send('Not logged in');
            }

            const currentUser = await userCollection.findOne({username:req.session.user});

            if(!currentUser){
                return res.status(404).send('User not found');
            }
            
            console.log(currentUser.friends);
            res.json(currentUser.friends || []);
        });

        app.post("/register", async (req,res) => {
            try{
                const {username, password} = req.body;

                const existingUser = await userCollection.findOne({username});
                if(existingUser){
                    return res.status(400).send({success: false, message:"Username already exists"});
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                await userCollection.insertOne({username,
                                                password: hashedPassword,
                                                friends: [],
                                                friendRequests: []});

                res.redirect("/?message=Registration successful");
            }catch (err) {
                console.error("Registration error:", err);
                res.status(500).send("Server error during registration");
            }
            
        })

        app.post('/send-friend-request',async (req,res)=>{
            const fromUsername = req.session.user;
            const toUsername = req.body.friend;

            if(!fromUsername || !toUsername) {
                return res.status(400).send('Missing usernames');
            }
            
            const targetUser = await userCollection.findOne({username: toUsername });

            if(!targetUser) {
                return res.status(404).send('Target user not found');
            }

            await userCollection.updateOne(
                { username: toUsername},
                { $addToSet: { friendRequests: fromUsername}}
            );

            res.send('Friend request sent!');
        });

        app.post('/accept-friend-request', async (req,res) => {
            const { fromUsername } = req.body;
            const username = req.session.user;

            await userCollection.updateOne(
                { username },
                {
                    $pull: { friendRequests: fromUsername },
                    $push: { friends: fromUsername }
                }
            );
            await userCollection.updateOne(
                {username:fromUsername},
                { $push: {friends: username }}
            );

            res.send({success: true, message: "Friend added"});
        });

        app.get('/pending-requests', async(req,res) => {
            if(!req.session.user){
                return res.status(401).send('Not logged in');
            }
            
            const currentUser = await userCollection.findOne({ username: req.session.user});
            
            if(!currentUser){
                return res.status(404).send('User not found');
            }

            res.json(currentUser.friendRequests || []);
        });

        app.post('/send-message', async (req, res) => {
            const { to, message} = req.body;
            const from = req.session.user;

            const chatCollection = db.collection("chats");

            await chatCollection.insertOne({from, to, message, timestamp: new Date()});

            res.send({success: true});
        });

        app.post("/login",async (req,res) => {
            const {username,password} = req.body;

            const user = await userCollection.findOne({username});

            if(!user) {
                return res.redirect("/?message=Invalid username or password");            
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if(passwordMatch){
                req.session.user = username;
                res.redirect("/?message=Login successful");
            }else{
                res.redirect("/?message=Invalid username or password");
            }
        });

        app.post("/logout", (req,res) => {
            req.session.destroy(err=> {
                if (err) {
                    console.error("Logout error:", err);
                    return res.redirect("/?message=Logout error");
                }
                res.redirect("/?message=Logged out successfully");
            });
        });



        app.listen(3010, () => {
            console.log("server running on port 3010");
        });
    } catch(err) {
        console.error("error starting server:",err);
    }
}
main();