const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// função IA
async function perguntarIA(pergunta) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma simples e natural para voz: ${pergunta}`,
    });

    return (
      response?.output?.[0]?.content?.[0]?.text ||
      "Não consegui responder agora."
    );
  } catch (err) {
    console.error("Erro OpenAI:", err);
    return "Tive um problema ao responder.";
  }
}

// resposta padrão Alexa (SEMPRE válida)
function respostaAlexa(texto, encerrar = false) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: String(texto), // força string
      },
      shouldEndSession: encerrar,
    },
  };
}

app.post("/", async (req, res) => {
  try {
    const request = req.body?.request;

    if (!request) {
      return res.json(respostaAlexa("Erro na requisição."));
    }

    // abertura
    if (request.type === "LaunchRequest") {
      return res.json(
        respostaAlexa("Olá, eu sou o Jarvis. Pode falar comigo.")
      );
    }

    // intents
    if (request.type === "IntentRequest") {
      const intent = request.intent?.name;

      if (intent === "ChatIntent") {
        const userInput =
          request.intent?.slots?.query?.value || "Olá";

        const resposta = await perguntarIA(userInput);

        return res.json(respostaAlexa(resposta));
      }

      if (intent === "AMAZON.HelpIntent") {
        return res.json(
          respostaAlexa("Você pode me fazer qualquer pergunta.")
        );
      }

      if (
        intent === "AMAZON.StopIntent" ||
        intent === "AMAZON.CancelIntent"
      ) {
        return res.json(
          respostaAlexa("Até logo!", true)
        );
      }
    }

    // fallback
    return res.json(
      respostaAlexa("Não entendi. Pode repetir?")
    );
  } catch (err) {
    console.error("Erro geral:", err);

    return res.json(
      respostaAlexa("Erro interno.")
    );
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando");
});
