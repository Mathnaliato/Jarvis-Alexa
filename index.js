import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    console.log("REQUEST:", JSON.stringify(req.body));

    // 🔹 Quando abre a skill
    if (req.body.request.type === "LaunchRequest") {
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Olá, eu sou o Jarvis. Pode falar comigo naturalmente."
          },
          shouldEndSession: false
        }
      });
    }

    // 🔹 Quando fala algo
    if (req.body.request.type === "IntentRequest") {
      const userQuery =
        req.body.request.intent?.slots?.query?.value || "não entendi";

      console.log("PERGUNTA:", userQuery);

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é o Jarvis, um assistente inteligente, simples, claro e amigável, que fala em português."
              },
              {
                role: "user",
                content: userQuery
              }
            ]
          })
        }
      );

      const data = await openaiResponse.json();

      console.log("IA RESPONSE:", JSON.stringify(data));

      const reply =
        data.choices?.[0]?.message?.content ||
        "Desculpe, não consegui responder.";

      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: reply
          },
          shouldEndSession: false
        }
      });
    }

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Não entendi."
        },
        shouldEndSession: false
      }
    });
  } catch (error) {
    console.error("ERRO:", error);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Erro no sistema."
        },
        shouldEndSession: false
      }
    });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando");
});
