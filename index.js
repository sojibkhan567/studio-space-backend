import express from 'express'
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from 'mongodb';

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

// connect to DB
const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

//database cllection list
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("studio_space_db");
const studioCollection = db.collection("studios");
//const bookingCollection = db.collection("bookings");

/** POST: /studios */
app.post("/studios", async (req, res) => {
    const data = req.body;
    const result = await studioCollection.insertOne(data);
    res.send(result);
});

/**
 * To get all studio data
 * GET: "/studios"
 */
app.get("/studios", async (req, res) => {
    const result = await studioCollection.find().toArray();
    res.send(result);
});

/**
 * Get the studio data by id
 * GET: "/studio/:id"
 */
app.get("/studios/:id", async (req, res) => {
    const { id } = req.params;
    const result = await studioCollection.findOne({
        _id: new ObjectId(id),
    });
    res.send(result);
});

app.get("/", (req, res) => {
    res.send("hello world!")
});

app.listen(PORT, () => {
    console.log(`The server is running on port:${PORT}`)
});