const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 FUNÇÃO IA (SUPER ESTÁVEL)
async function perguntarIA(pergunta) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: pergunta,
    });

    const text =
      response.output?.[0]?.content?.[0]?.text ||
      "Não consegui responder.";

    return text;
  } catch (error) {
    console.error("ERRO OPENAI:", error);
    return "Tive um problema ao responder.";
  }
}

// 🔥 ROTA ALEXA
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    let speechText = "Não entendi. Pode repetir?";

    // Quando abre
    if (request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Pode falar comigo naturalmente.";
    }

    // Quando fala algo
    if (request.type === "IntentRequest") {
      const intentName = request.intent.name;

      if (intentName === "ChatIntent") {
        let userInput = "não entendi";

        if (
          request.intent &&
          request.intent.slots &&
          request.intent.slots.query &&
          request.intent.slots.query.value
        ) {
          userInput = request.intent.slots.query.value;
        }

        speechText = await perguntarIA(userInput);
      }

      if (intentName === "AMAZON.HelpIntent") {
        speechText = "Você pode me perguntar qualquer coisa.";
      }

      if (
        intentName === "AMAZON.StopIntent" ||
        intentName === "AMAZON.CancelIntent"
      ) {
        return res.json({
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: "Até mais!",
            },
            shouldEndSession: true,
          },
        });
      }
    }

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: String(speechText), // 🔥 GARANTE QUE É STRING
        },
        shouldEndSession: false,
      },
    });
  } catch (error) {
    console.error("ERRO GERAL:", error);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Erro no sistema.",
        },
        shouldEndSession: false,
      },
    });
  }
});

// 🔥 PORTA CORRETA (RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
