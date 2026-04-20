const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// timeout de segurança (Alexa odeia demora)
const TIMEOUT_MS = 7000;

// função IA com timeout
async function perguntarIA(pergunta) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma simples e natural para voz: ${pergunta}`,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return (
      response?.output?.[0]?.content?.[0]?.text ||
      "Não consegui responder agora."
    );
  } catch (err) {
    console.error("Erro OpenAI:", err);
    return "Estou um pouco lento agora, tente novamente.";
  }
}

// resposta Alexa VALIDADA
function respostaAlexa(texto, encerrar = false) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: String(texto).substring(0, 8000), // evita quebra
      },
      shouldEndSession: encerrar,
    },
  };
}

app.post("/", async (req, res) => {
  try {
    const request = req.body?.request;

    if (!request) {
      return res
        .status(200)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(respostaAlexa("Erro na requisição.")));
    }

    // 🚀 resposta rápida para abertura (IMPORTANTE)
    if (request.type === "LaunchRequest") {
      return res
        .status(200)
        .set("Content-Type", "application/json")
        .send(
          JSON.stringify(
            respostaAlexa("Olá, eu sou o Jarvis. Pode falar comigo.")
          )
        );
    }

    if (request.type === "IntentRequest") {
      const intent = request.intent?.name;

      if (intent === "ChatIntent") {
        const userInput =
          request.intent?.slots?.query?.value || "Olá";

        const resposta = await perguntarIA(userInput);

        return res
          .status(200)
          .set("Content-Type", "application/json")
          .send(JSON.stringify(respostaAlexa(resposta)));
      }

      if (intent === "AMAZON.HelpIntent") {
        return res
          .status(200)
          .set("Content-Type", "application/json")
          .send(
            JSON.stringify(
              respostaAlexa("Você pode me fazer qualquer pergunta.")
            )
          );
      }

      if (
        intent === "AMAZON.StopIntent" ||
        intent === "AMAZON.CancelIntent"
      ) {
        return res
          .status(200)
          .set("Content-Type", "application/json")
          .send(
            JSON.stringify(respostaAlexa("Até logo!", true))
          );
      }
    }

    return res
      .status(200)
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify(
          respostaAlexa("Não entendi. Pode repetir?")
        )
      );
  } catch (err) {
    console.error("Erro geral:", err);

    return res
      .status(200)
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify(
          respostaAlexa("Erro interno no sistema.")
        )
      );
  }
});

// 👇 MUITO IMPORTANTE (Railway)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
