import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🔥 rota principal (Alexa SEMPRE chama POST /)
app.post("/", async (req, res) => {
  try {
    const body = req.body;

    let speechText = "Desculpe, não entendi.";

    // Quando abre a skill
    if (body.request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Como posso te ajudar?";
    }

    // Quando o usuário fala algo
    if (body.request.type === "IntentRequest") {
      const userInput =
        body.request.intent?.slots?.query?.value ||
        body.request.intent?.name ||
        "Olá";

      // 🔥 chamada ao ChatGPT
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "Você é o Jarvis, assistente inteligente." },
              { role: "user", content: userInput },
            ],
          }),
        }
      );

      const data = await response.json();

      speechText =
        data.choices?.[0]?.message?.content ||
        "Desculpe, não consegui responder.";
    }

    // 🔥 RESPOSTA NO FORMATO EXATO DA ALEXA
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
    console.error("Erro:", error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Ocorreu um erro no sistema.",
        },
      },
    });
  }
});

app.listen(8080, () => {
  console.log("Servidor rodando na porta 8080");
});
