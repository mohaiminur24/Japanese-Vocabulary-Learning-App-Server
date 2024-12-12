const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const JWT_SECRET =
  "a3b5c7d9e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f";

const verifyToken = (req, res, next) => {
  const authorize = req.headers.authorize;
  if (!authorize) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access!" });
  }
  const token = authorize.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "Invalid Token access" });
    }
    req.decoded = decoded;
    next();
  });
};

const GenerateToken = (name, email, role, secretKey, expiresIn = "1h") => {
  const payload = { name, email, role };
  const token = jwt.sign(payload, secretKey, {
    expiresIn,
  });
  return token;
};

const uri = `mongodb+srv://japanese-vocabulary:QDSomRYt0VwHmxyO@cluster0.85env82.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("jp-vocabulary-application");
    const lessons = database.collection("lessons");
    const tutorial = database.collection("tutorial");
    const vocabulary = database.collection("vocabulary");
    const users = database.collection("user");

    app.post("/user", async (req, res) => {
      try {
        const user = req.body;
        const exist = await users.findOne({ email: user.email });
        if (exist)
          return res.send({ success: false, message: "email already in use" });
        const entity = {
          name: user.name,
          email: user.email,
          photo: user.photo,
          role: 2,
          password: user.password,
        };
        const result = await users.insertOne(entity);
        res.send({ success: true, data: result });
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
          res.send({ success: true, token: token, ...user });
        } else {
          res.send({ success: false });
        }
      } catch (error) {
        console.log("login router", error);
      }
    });

    app.get("/profile", verifyToken, async (req, res) => {
      try {
        const email = req.decoded.email;
        const user = await users.findOne({ email: email });
        res.send(user);
      } catch (error) {
        console.log("profile route");
      }
    });

    app.post("/tutorial", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });

        const entity = {
          title: data.title,
          description: data.description,
          embedLink: data.youtubeLink,
        };

        await tutorial.insertOne(entity);
        res.send({ success: true, message: "Data insert successfully!" });
      } catch (error) {
        console.log("post tutorial route");
      }
    });

    app.get("/get-tutorial", verifyToken, async (_, res) => {
      try {
        const result = await tutorial.find().toArray();
        res.send(result);
      } catch (error) {
        console.log("get tutorial route", error);
      }
    });

    app.get("/get-users", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const result = await users.find().toArray();
        res.send(result);
      } catch (error) {
        console.log("get user route");
      }
    });

    app.post("/update-user", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const query = { _id: new ObjectId(data.id) };
        const update = {
          $set: {
            role: data.role,
          },
        };
        const result = await users.updateOne(query, update);
        res.send(result);
      } catch (error) {
        console.log("update user route", error);
      }
    });

    app.delete("/delete-user", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const id = req.query.id;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const result = await users.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (error) {
        console.log("delete-user route");
      }
    });

    app.post("/create-lesson", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const entity = {
          title: data.title,
          description: data.description,
          count: 0,
        };
        const result = await lessons.insertOne(entity);
        res.send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.log("create lessons route");
      }
    });

    app.get("/get-lessons", verifyToken, async (_, res) => {
      try {
        const result = await lessons.find().toArray();
        res.send(result);
      } catch (error) {
        console.log("get lessons route");
      }
    });

    app.post("/update-lesson", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });

        const query = { _id: new ObjectId(data.id) };
        const entity = {
          $set: {
            title: data.title,
            description: data.description,
          },
        };
        const result = await lessons.updateOne(query, entity);
        res.send({ success: true, data: result });
      } catch (error) {
        console.log("update lesson route");
      }
    });

    app.delete("/delete-lesson", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const id = req.query.id;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const result = await lessons.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true, data: result });
      } catch (error) {
        console.log("delete lesson route");
      }
    });

    app.post("/add-vocabulary", verifyToken, async () => {
      try {
        const user_role = req.decoded.role;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });

        const result = await vocabulary.insertOne(data);
        const findLesson = await lessons.findOne({
          _id: new ObjectId(data.lessonNo),
        });
        if (findLesson) {
          const q = { _id: new ObjectId(findLesson._id) };
          const u = {
            $set: {
              count: findLesson.count + 1,
            },
          };
          await lessons.updateOne(q, u);
        }
        res.send({ success: true, data: result });
      } catch (error) {
        console.log("create vocabulary route");
      }
    });

    app.post("/update-vocabulary", verifyToken, async (req, res) => {
      try {
        const user_role = req.decoded.role;
        const id = req.query.id;
        const data = req.body;
        if (user_role !== 1)
          return res.send({
            success: false,
            message: "only admin can add new tutorial",
          });
        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation,
            whenToSay: data.whenToSay,
            lessonNo: data.lessonNo,
          },
        };
        const result = await vocabulary.updateOne(query,update)
      } catch (error) {
        console.warn("update vocabulary route");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
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
