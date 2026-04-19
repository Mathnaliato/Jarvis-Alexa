import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔑 sua chave (vem do Railway ENV)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🔥 rota principal (Alexa usa POST /)
app.post("/", async (req, res) => {
  try {
    const body = req.body;

    let speechText = "Desculpe, não entendi.";

    // 🧠 Quando abre a skill
    if (body.request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Como posso te ajudar?";
    }

    // 🧠 Quando o usuário fala algo
    if (body.request.type === "IntentRequest") {
      let userInput = "não entendi";

      if (
        body.request.intent.slots &&
        body.request.intent.slots.query &&
        body.request.intent.slots.query.value
      ) {
        userInput = body.request.intent.slots.query.value;
      }

      // 🔥 (VERSÃO SIMPLES - só repete)
      speechText = `Você disse: ${userInput}`;

      // 🚀 (VERSÃO COM IA - depois a gente ativa)
      /*
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Você é o Jarvis, assistente inteligente." },
            { role: "user", content: userInput }
          ]
        })
      });

      const data = await response.json();
      speechText = data.choices[0].message.content;
      */
    }

    // 📤 resposta para Alexa
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
    console.error(error);

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Erro no servidor.",
        },
      },
    });
  }
});

// 🚀 porta Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));
