import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔑 sua chave (coloque no Railway como variável OPENAI_API_KEY)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/", async (req, res) => {
  try {
    const body = req.body;

    let speechText = "Desculpe, não entendi.";

    // 👉 Quando abre a skill
    if (body.request.type === "LaunchRequest") {
      speechText = "Olá, sou o Jarvis. Como posso te ajudar?";
    }

    // 👉 Quando o usuário fala algo
    if (body.request.type === "IntentRequest") {
      const userInput =
        body.request.intent?.slots?.query?.value ||
        body.request.intent?.name ||
        "Olá";

      // 🔥 chamada ao ChatGPT
      const openaiResponse = await fetch(
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
              {
                role: "system",
                content:
                  "Você é Jarvis, um assistente inteligente, educado e direto. Responda em português de forma natural.",
              },
              {
                role: "user",
                content: userInput,
              },
            ],
            max_tokens: 150,
          }),
        }
      );

      const data = await openaiResponse.json();

      speechText =
        data.choices?.[0]?.message?.content ||
        "Desculpe, não consegui responder.";
    }

    // 👉 resposta padrão Alexa
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
        shouldEndSession: false,
      },
    });
  }
});

// 🚀 Railway usa PORT automático
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
