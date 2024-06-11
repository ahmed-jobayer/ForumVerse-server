const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oapnwos.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // all collections

    const userCollection = client.db("ForumVerseDB").collection("users");
    const announcementsCollection = client
      .db("ForumVerseDB")
      .collection("announcements");
    const postCollection = client.db("ForumVerseDB").collection("posts");

    // user related api

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user)
      const queary = { email: user.email };
      const existingUser = await userCollection.findOne(queary);
      if (existingUser) {
        return res.send({ message: "Welcome back", insertedId: null });
      }
      console.log(existingUser);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // post related api

    app.get("/posts", async (req, res) => {
      const sortType = req.query.sort;
      let result;
      try {
        if (sortType === "popularity") {
          result = await postCollection
            .aggregate([
              {
                $addFields: {
                  voteDifference: {
                    $subtract: ["$upVoteCount", "$downVoteCount"],
                  },
                },
              },
              {
                $sort: { voteDifference: -1 },
              },
            ])
            .toArray();
        } else {
          result = await postCollection.find().sort({ postTime: -1 }).toArray();
        }
        //   console.log("Posts result:", result);
        res.send(result);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.patch("/posts/:id/upvote", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = { $inc: { upVoteCount: 1 } };
      const result = await postCollection.updateOne(query, update);
      res.send(result);
    });

    app.patch("/posts/:id/downvote", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = { $inc: { downVoteCount: 1 } };
      const result = await postCollection.updateOne(query, update);
      res.send(result);
    });

    app.patch("/posts/:id/comments", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const newComment = req.body.comment;
      console.log(newComment)
      const query = { _id: new ObjectId(id) };
      const update = { $push: { comments: newComment } };
      const options = { returnOriginal: false };
      const result = postCollection.findOneAndUpdate(query, update, options);
      res.send(result);
    });

    // announchment related api

    app.get("/announcements", async (req, res) => {
      const result = await announcementsCollection.find().toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ForumVerse is running");
});

app.listen(port, () => {
  console.log(`Forum Verse is running on port ${port}`);
});
