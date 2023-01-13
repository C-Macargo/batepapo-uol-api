import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";
import dayjs from "dayjs";

dotenv.config();
const PORT = 5000;
const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
const db = mongoClient.db();

async function startServer() {
  try {
    await mongoClient.connect();
    console.log("MongoDB Connected!");
  } catch (err) {
    console.log(err.message);
  }

  app.post("/participants", async (req, res) => {
    const { name } = req.body;
    const date = dayjs().format("HH:mm:ss");
    const lastStatus = Date.now();

    try {
      await db.collection("participants").insertOne({ name, lastStatus });
      await db.collection("messages").insertOne({
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: date,
      });
      res.status(201);
    } catch (err) {
      console.log(err);
      res.status(500).send("Deu algo errado no servidor");
    }
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
