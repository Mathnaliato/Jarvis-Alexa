const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

// valida API key
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY não encontrada!");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// função de IA
async function perguntarIA(pergunta) {
  try {
    if (!pergunta || pergunta.trim() === "") {
      return "Pode repetir a pergunta?";
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma curta, natural e fácil de ouvir em voz: ${pergunta}`,
    });

    const text =
      response?.output?.[0]?.content?.[0]?.text ||
      "Não consegui responder agora.";

    return text;
  } catch (error) {
    console.error("ERRO OPENAI:", error);
    return "Tive um problema ao responder.";
  }
}

// função padrão de resposta Alexa
function respostaAlexa(texto) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: texto,
      },
      shouldEndSession: false,
    },
  };
}

// rota principal
app.post("/", async (req, res) => {
  try {
    const request = req.body?.request;

    if (!request) {
      return res.json(respostaAlexa("Erro na requisição."));
    }

    // abertura da skill
    if (request.type === "LaunchRequest") {
      return res.json(
        respostaAlexa(
          "Olá, eu sou o Jarvis. Pode falar comigo naturalmente."
        )
      );
    }

    // intents
    if (request.type === "IntentRequest") {
      const intentName = request.intent?.name;

      // pergunta com IA
      if (intentName === "ChatIntent") {
        const userInput =
          request.intent?.slots?.query?.value || "Olá";

        const resposta = await perguntarIA(userInput);

        return res.json(respostaAlexa(resposta));
      }

      // ajuda
      if (intentName === "AMAZON.HelpIntent") {
        return res.json(
          respostaAlexa("Você pode me fazer qualquer pergunta.")
        );
      }

      // cancelar/sair
      if (
        intentName === "AMAZON.StopIntent" ||
        intentName === "AMAZON.CancelIntent"
      ) {
        return res.json({
          version: "1.0",
          response: {
            outputSpeech: {
              type: "PlainText",
              text: "Até logo!",
            },
            shouldEndSession: true,
          },
        });
      }
    }

    // fallback
    return res.json(
      respostaAlexa("Não entendi. Pode repetir?")
    );
  } catch (error) {
    console.error("ERRO GERAL:", error);

    return res.json(
      respostaAlexa("Erro no sistema.")
    );
  }
});

// servidor
app.listen(3000, () => {
  console.log("🚀 Servidor rodando");
});
