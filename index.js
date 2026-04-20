const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

// OpenAI (nova versão correta)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Função que chama o ChatGPT (CORRIGIDA)
async function perguntarIA(pergunta) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma simples, clara e natural para voz: ${pergunta}`,
    });

    if (
      response &&
      response.output &&
      response.output[0] &&
      response.output[0].content &&
      response.output[0].content[0] &&
      response.output[0].content[0].text
    ) {
      return response.output[0].content[0].text;
    }

    return "Desculpa, não consegui entender.";
  } catch (error) {
    console.error("ERRO OPENAI:", error);
    return "Tive um problema ao responder.";
  }
}

// ROTA DA ALEXA (CORRIGIDA 100%)
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    let speechText = "Não entendi. Pode repetir?";

    // Quando abre a skill
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
          text: speechText,
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

// PORTA (IMPORTANTE PRO RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
