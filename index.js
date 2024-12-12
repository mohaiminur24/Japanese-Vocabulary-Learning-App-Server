const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const verifyToken = (req, res, next) => {
  const authorize = req.headers.authorize;
  if (!authorize) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access!" });
  }
  const token = authorize.split(" ")[1];
  jwt.verify(token, process.env.DB_Access_token, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "Invalid Token access" });
    }
    req.decoded = decoded;
    next();
  });
};

const JWT_SECRET="a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f";


const GenerateToken = (name, email, role, secretKey, expiresIn = 3600) => {
  const payload = { name, email, role };
  const token = jwt.sign(payload, secretKey, {
    expiresIn,
  });
  return token;
};

const uri = `mongodb+srv://japanese-vocabulary:QDSomRYt0VwHmxyO@cluster0.85env82.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    await client.connect();

    const database = client.db("jp-vocabulary-application");
    const lessons = database.collection("lessons");
    const tutorial = database.collection("tutorial");
    const vocabulary = database.collection("vocabulary");
    const users = database.collection("user");

    app.post("/user", async (req, res) => {
      try {
        const user = req.body;
        const entity = {
          name: user.name,
          email: user.email,
          photo: user.photo,
          role: 2,
          password: user.password,
        };
        const result = await users.insertOne(entity);
        res.send(result);
      } catch (error) {
        console.warn("create user route issue", error);
      }
    });

    app.post("/login", async (req, res) => {
      try {
        const user_info = req.body;
        const user = await users.findOne({ email: user_info.email });
        if (user.password == user_info.password) {
          const token = GenerateToken(
            user.name,
            user.email,
            user.role,
            JWT_SECRET
          );
          res.send({success: true, token:token, ...user})
        }else{
          res.send({ success: false });
        }
      } catch (error) {
        console.log("login router", error);
      }
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
  res.send("server is running well");
});

app.listen(port, () => {
  console.log(`This server running with ${port}`);
});
