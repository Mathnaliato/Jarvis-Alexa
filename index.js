const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(bodyParser.json());

// 🔑 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 Memória simples (por usuário)
const conversas = {};

// 🎯 Função principal IA (ULTRA MELHORADA)
async function perguntarIA(userId, pergunta) {
  try {
    if (!conversas[userId]) {
      conversas[userId] = [];
    }

    // adiciona pergunta do usuário
    conversas[userId].push({
      role: "user",
      content: pergunta,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Você é o Jarvis, um assistente inspirado no Homem de Ferro. Seja inteligente, elegante, direto e natural para voz. Responda de forma clara, sem ser longo demais.",
        },
        ...conversas[userId],
      ],
    });

    // 🔥 captura segura da resposta
    let texto =
      response.output?.[0]?.content?.[0]?.text ||
      response.output_text ||
      "Não consegui formular uma resposta.";

    // salva resposta
    conversas[userId].push({
      role: "assistant",
      content: texto,
    });

    // 🧹 limita memória (evita travar e ficar caro)
    if (conversas[userId].length > 12) {
      conversas[userId] = conversas[userId].slice(-12);
    }

    return texto;
  } catch (error) {
    console.error("ERRO OPENAI:", error);
    return "Estou com dificuldade para pensar agora. Tente novamente.";
  }
}

// 🧠 Extrai o que o usuário falou (Alexa)
function extrairTextoAlexa(request) {
  try {
    if (request.type === "LaunchRequest") {
      return "iniciar conversa";
    }

    if (
      request.type === "IntentRequest" &&
      request.intent &&
      request.intent.slots
    ) {
      const slots = request.intent.slots;

      for (let key in slots) {
        if (slots[key].value) {
          return slots[key].value;
        }
      }
    }

    return "não entendi";
  } catch {
    return "erro ao entender";
  }
}

// 🟢 ROTA PRINCIPAL (ALEXA)
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;
    const userId = req.body.session.user.userId;

    const userInput = extrairTextoAlexa(request);

    let resposta;

    // 👋 abertura
    if (request.type === "LaunchRequest") {
      resposta =
        "Olá, eu sou o Jarvis. Pode falar comigo naturalmente.";
    } else {
      resposta = await perguntarIA(userId, userInput);
    }

    // 🧠 resposta final (PROFISSIONAL)
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: resposta,
        },
        reprompt: {
          outputSpeech: {
            type: "PlainText",
            text: "Pode continuar, estou ouvindo.",
          },
        },
        shouldEndSession: false,
      },
    });
  } catch (error) {
    console.error("ERRO GERAL:", error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocorreu um erro no sistema.",
        },
        shouldEndSession: true,
      },
    });
  }
});

// 🚀 servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Jarvis rodando na porta", PORT);
});
