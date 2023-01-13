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
const participants = db.collection("participants");
const messages = db.collection("messages");

const participantSchema = Joi.object({
  name: Joi.string().required(),
});

const messageSchema = Joi.object({
  to: Joi.string().required(),
  text: Joi.string().required(),
  type: Joi.string().valid("private_message", "message").required(),
});

async function startServer() {
  try {
    await mongoClient.connect();
    console.log("MongoDB Connected!");
  } catch (err) {
    console.log(err.message);
  }

  app.post("/participants", async (req, res) => {
    const { name } = req.body;
    const particiopantValidation = participantSchema.validate({ name });
    const date = dayjs().format("HH:mm:ss");
    const lastStatus = Date.now();

    if (particiopantValidation.error) {
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

  app.post("/message", async (req, res) => {
    const { to, text, type } = req.body;
    const from = req.headers.user;
    const time = dayjs(Date.now()).format("hh:mm:ss");
    const messageValidation = messageSchema.validate({ to, text, type });

    if (messageValidation.error) {
      return res.status(422).send("Mensagem inválida");
    }

    const checkUser = await db
      .collection("participants")
      .countDocuments({ name: from });
    if (checkUser === 0) {
      return res.status(422).send("Tente novamente");
    }

    try {
      await db.collection("messages").insertOne({
        to,
        text,
        type,
        from,
        time,
      });
      res.status(201).send("Mensagem enviada");
    } catch (error) {
      console.log(error);
      res.status(422).send("Deu algo errado no servidor");
    }
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
