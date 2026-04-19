import express from "express";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 Função segura para IA
async function perguntarIA(pergunta) {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Responda de forma curta, clara e natural para voz: ${pergunta}`
      })
    });

    const data = await response.json();

    console.log("IA RESPONSE:", JSON.stringify(data, null, 2));

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text ||
      "Não consegui responder agora.";

    return text;

  } catch (e) {
    console.error("ERRO IA:", e);
    return "Erro ao acessar inteligência.";
  }
}

// 🔥 ROTA DA ALEXA
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    let speechText = "Não entendi. Pode repetir?";

    // 🟢 Quando abre a skill
    if (request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Pode falar comigo naturalmente.";
    }

    // 🟡 Quando fala algo
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

        // 🔥 CHAMA IA
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
              text: "Até logo!"
            },
            shouldEndSession: true
          }
        });
      }
    }

    // 🔒 Garantia de resposta válida
    if (!speechText || speechText.length === 0) {
      speechText = "Não consegui entender. Pode repetir?";
    }

    // 🔒 Limite para Alexa
    speechText = speechText.substring(0, 300);

    // 🔵 RESPOSTA FINAL
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: speechText
        },
        shouldEndSession: false
      }
    });

  } catch (error) {
    console.error(error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Erro no sistema."
        }
      }
    });
  }
});

// 🚀 Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Jarvis rodando"));
