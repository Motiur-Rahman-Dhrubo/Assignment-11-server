const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());










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

    const carCollection = client.db('carDB').collection('car');


    // auth related APIs
    app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({ success: true })
    })

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: false
      })
      .send({ success: true })
    })

    app.get("/my_car", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { user_email: email };
      }

      const cursor = carCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/available_car', async(req, res)=> {
        const query = { availability: "Available" };
        const cursor = carCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await carCollection.findOne(query);
      res.send(result);
    });

    app.post('/car', async(req, res)=> {
        const newCar = req.body;
        console.log(newCar);
        const result = await carCollection.insertOne(newCar);
        res.send(result);
    })


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



app.get('/', (req, res) => {
    res.send('jo.car server is running')
});

app.listen(port, () => {
    console.log(`jo.car server is running on port: ${port}`)
})