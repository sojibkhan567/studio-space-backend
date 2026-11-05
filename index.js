import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

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
const bookingCollection = db.collection("bookings");
const wishlistCollection = db.collection("wishlist");

/**-------- Check authentication middleware -------- */
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.BETTER_AUTH_URL}/api/auth/jwks`),
);

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.BETTER_AUTH_URL,
    });

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error("JWT error:", error.code, error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/**------------ Studios API list route --------------- */
/**
 * Create a studios data
 * POST: /studios
 * */
app.post("/studios", authenticate, async (req, res) => {
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
 * Get only authenticated user studion
 * GET: /studios/me
 */
app.get("/studios/me", authenticate, async (req, res) => {
  try {
    const bookings = await studioCollection
      .find({ "user.email": req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(bookings);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error || "Failed to fetch listing.",
    });
  }
});

/**
 * Dlete studio by id
 */
app.delete("/studios/:id", async (req, res) => {
  const { id } = req.params;
  const result = await studioCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
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

/**
 * update studio details
 * patch: /studio/:id
 */
app.patch("/studios/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const result = await studioCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: data },
  );
  res.json(result);
});

/**--------------- ALL BOOKING LIST ROUTE -------------- */
/**
 * Insert my booking data
 * POST: "/bookings"
 */
app.post("/bookings", authenticate, async (req, res) => {
  const data = req.body;

  const existingBookings = await bookingCollection.findOne({
    studioId: data.studioId,
    date: data.date,
    status: { $in: ["pending", "confirmed"] },
    startTime: { $lt: data.endTime },
    endTime: { $gt: data.startTime },
  });

  if (existingBookings) {
    return res.status(409).send({
      success: false,
      message: "This studio is already booked for the selected time.",
    });
  }

  const result = await bookingCollection.insertOne(data);

  res.status(201).send({
    success: true,
    insertedId: result.insertedId,
    message: "Booking created successfully",
  });
});

/** Get auth booking data */
app.get("/bookings/me", authenticate, async (req, res) => {
  try {
    const bookings = await bookingCollection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).send(bookings);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
});

/**
 * CANCEL BOOKING BY ID
 * PATCH: "/bookings/:id/cancel"
 */
app.patch("/bookings/:id/cancel", authenticate, async (req, res) => {
  const { id } = req.params;
  const result = await bookingCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    { $set: { status: "cancelled" } },
  );
  res.json(result);
});

/*------------------- WISHLIST ROUTE LIST --------------------*/
// Add wishlist
app.post("/wishlist", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { studioId } = req.body;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: "Studio ID is required",
      });
    }

    // Check duplicate
    const existing = await wishlistCollection.findOne({
      userId,
      studioId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Studio already exists in wishlist",
      });
    }

    const wishlist = {
      userId,
      studioId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await wishlistCollection.insertOne(wishlist);

    res.status(201).json({
      success: true,
      message: "Studio added to wishlist",
      wishlist: {
        _id: result.insertedId,
        ...wishlist,
      },
    });
  } catch (error) {
    console.error("Add wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add studio to wishlist",
    });
  }
});

// Get current user's wishlist
app.get("/wishlist/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await wishlistCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get wishlist",
    });
  }
});

// Get current user's wishlist
app.get("/wishlist", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await wishlistCollection
      .aggregate([
        {
          $match: { userId },
        },
        {
          $addFields: {
            studioObjectId: {
              $toObjectId: "$studioId",
            },
          },
        },
        {
          $lookup: {
            from: "studios",
            localField: "studioObjectId",
            foreignField: "_id",
            as: "studio",
          },
        },
        {
          $unwind: "$studio",
        },
        {
          $replaceRoot: {
            newRoot: "$studio",
          },
        },
        {
          $project: {
            studioObjectId: 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ])
      .toArray();

    res.json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get wishlist",
    });
  }
});

// Remove wishlist
app.delete("/wishlist/:studioId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { studioId } = req.params;

    const result = await wishlistCollection.deleteOne({
      userId,
      studioId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Studio not found in wishlist",
      });
    }

    res.json({
      success: true,
      message: "Studio removed from wishlist",
    });
  } catch (error) {
    console.error("Remove wishlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove studio from wishlist",
    });
  }
});

/*---------- Test server api -----------*/
app.get("/", (req, res) => {
  res.send("hello world!");
});

app.listen(PORT, () => {
  console.log(`The server is running on port:${PORT}`);
});

export default app;
