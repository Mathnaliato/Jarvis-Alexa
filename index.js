import express from "express";

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const body = req.body;

    let speechText = "Desculpe, não entendi.";

    if (body.request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Como posso te ajudar?";
    }

    if (body.request.type === "IntentRequest") {
      const userInput =
        body.request.intent.slots?.query?.value ||
        body.request.intent.name;

      speechText = `Você disse: ${userInput}`;
    }

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: speechText,
        },
        shouldEndSession: false,
      },
    });
  } catch (error) {
    console.error(error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Erro no servidor.",
        },
      },
    });
  }
});

// 🔥 ESSA PARTE É OBRIGATÓRIA
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
