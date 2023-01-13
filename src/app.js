import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import Joi from "joi";

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

  const participantSchema = Joi.object({
    name: Joi.string().required(),
  });

  app.post("/participants", async (req, res) => {
    const { name } = req.body;
    const ParticiopantValidation = participantSchema.validate({ name });
    const date = dayjs().format("HH:mm:ss");
    const lastStatus = Date.now();

    if (ParticiopantValidation.error) {
      return res.status(422).send("Nome do participante inválido");
    }

    try {
      await db.collection("participants").insertOne({ name, lastStatus });
      await db.collection("messages").insertOne({
        from: name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: date,
      });
      res.status(201).send("Participante Criado");
    } catch (error) {
      console.log(error);
      res.status(422).send("Deu algo errado no servidor");
    }
  });

  app.get("/participants", async (_, res) => {
    const participantsList = await db
      .collection("participants")
      .find()
      .toArray();
    res.send(participantsList);
  });





  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
