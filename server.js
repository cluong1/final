const express = require('express')
const app = express();
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

async function main() {
    try{
        await client.connect();
        console.log("Connected to mongodb");

        app.use(express.urlencoded({extended: true}));

        app.get("/", function (req,res) {
            const message = req.query.message || '';
            res.render('index.pug', {message});
        });

        app.use(express.static("public"));

        app.set("views","./views");
        app.set("view engine", "pug");

        app.listen(3010, () => {
            console.log("server running on port 3010");
        });
    } catch(err) {
        console.error("error starting server:",err);
    }
}
main();