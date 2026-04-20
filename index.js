const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

// OpenAI (nova versão)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Função que chama o ChatGPT
async function perguntarIA(pergunta) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma clara, curta e amigável para voz: ${pergunta}`,
    });

    return response.output[0].content[0].text;

  } catch (error) {
    console.error("ERRO OPENAI:", error);
    return "Desculpa, tive um problema para responder.";
  }
}

// ROTA DA ALEXA
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    let speechText = "Não entendi. Pode repetir?";

    // Quando abre a skill
    if (request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Pode falar comigo naturalmente.";

      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: speechText,
          },
          shouldEndSession: false,
        },
      });
    }

    // Quando o usuário fala algo
    if (request.type === "IntentRequest") {
      let userInput = "não entendi";

      if (
        request.intent &&
        request.intent.slots &&
        request.intent.slots.query &&
        request.intent.slots.query.value
      ) {
        userInput = request.intent.slots.query.value;
      }

      const respostaIA = await perguntarIA(userInput);

      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: respostaIA,
          },
          shouldEndSession: false,
        },
      });
    }

    // fallback
    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Não entendi.",
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

// Servidor
app.listen(3000, () => {
  console.log("Servidor rodando");
});
