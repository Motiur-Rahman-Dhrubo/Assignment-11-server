const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  // verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;

    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrrul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const carCollection = client.db("carDB").collection("car");
    const bookingCarCollection = client.db("carDB").collection("bookingCar");

    // auth related APIs
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "6h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    app.get("/my_car", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = { user_email: email };

      if (req.user.email !== req.query.email) {
        return req.status(403).send({ message: "forbidden access" });
      }

      const cursor = carCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/my_booking", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = { bookingEmail: email };

      if (req.user.email !== req.query.email) {
        return req.status(403).send({ message: "forbidden access" });
      }

      const cursor = bookingCarCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/available_car", async (req, res) => {
      const query = { availability: "Available" };
      const cursor = carCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.findOne(query);
      res.send(result);
    });

    app.post("/car", async (req, res) => {
      const newCar = req.body;
      const result = await carCollection.insertOne(newCar);
      res.send(result);
    });

    app.post("/booking_car", async (req, res) => {
      const newBookingCar = req.body;
      const result = await bookingCarCollection.insertOne(newBookingCar);
      res.send(result);
    });

    app.put("/car/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateCar = req.body;
      const carData = {
        $set: {
          car_model: updateCar.car_model,
          car_brand: updateCar.car_brand,
          daily_rental_price: updateCar.daily_rental_price,
          availability: updateCar.availability,
          vehicle_registration_number: updateCar.vehicle_registration_number,
          features: updateCar.features,
          description: updateCar.description,
          location: updateCar.location,
          image_files: updateCar.image_files,
        },
      };
      const result = await carCollection.updateOne(filter, carData, options);
      res.send(result);
    });


    app.delete("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
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
  res.send("jo.car server is running");
});

app.listen(port, () => {
  console.log(`jo.car server is running on port: ${port}`);
});
