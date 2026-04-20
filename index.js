const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 FUNÇÃO IA (CORRIGIDA E COM DEBUG)
async function perguntarIA(pergunta) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Responda de forma curta e natural para voz: ${pergunta}`,
    });

    console.log("RESPOSTA OPENAI:", JSON.stringify(response, null, 2));

    if (!response.output || !response.output.length) {
      return "Não consegui pensar em uma resposta agora.";
    }

    const texto =
      response.output[0]?.content?.[0]?.text ||
      response.output_text ||
      "Não consegui responder.";

    return texto;

  } catch (error) {
    console.error("ERRO OPENAI DETALHADO:", error);
    return "Tive um problema ao pensar na resposta.";
  }
}

// 🔥 RESPOSTA PADRÃO ALEXA
function respostaAlexa(texto, encerrar = false) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: String(texto).substring(0, 8000),
      },
      shouldEndSession: encerrar,
    },
  };
}

// 🔥 ROTA PRINCIPAL
app.post("/", async (req, res) => {
  try {
    const request = req.body?.request;

    if (!request) {
      return res
        .status(200)
        .json(respostaAlexa("Erro na requisição."));
    }

    // 🟢 ABRIR SKILL
    if (request.type === "LaunchRequest") {
      return res
        .status(200)
        .json(respostaAlexa("Olá, eu sou o Jarvis. Pode falar comigo."));
    }

    // 🟢 INTENTS
    if (request.type === "IntentRequest") {
      const intent = request.intent?.name;

      if (intent === "ChatIntent") {
        const userInput =
          request.intent?.slots?.query?.value || "Olá";

        const resposta = await perguntarIA(userInput);

        return res
          .status(200)
          .json(respostaAlexa(resposta));
      }

      if (intent === "AMAZON.HelpIntent") {
        return res
          .status(200)
          .json(respostaAlexa("Você pode me fazer qualquer pergunta."));
      }

      if (
        intent === "AMAZON.StopIntent" ||
        intent === "AMAZON.CancelIntent"
      ) {
        return res
          .status(200)
          .json(respostaAlexa("Até logo!", true));
      }
    }

    // 🟡 FALLBACK
    return res
      .status(200)
      .json(respostaAlexa("Não entendi. Pode repetir?"));

  } catch (err) {
    console.error("ERRO GERAL:", err);

    return res
      .status(200)
      .json(respostaAlexa("Erro interno no sistema."));
  }
});

// 🚀 PORTA DO RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
