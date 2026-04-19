import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const userInput =
      req.body.request?.intent?.slots?.query?.value ||
      req.body.request?.intent?.slots?.text?.value ||
      "Olá";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "Você é um assistente amigável, responde em português, de forma simples, clara e como um companheiro de conversa."
          },
          {
            role: "user",
            content: userInput
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: reply
        },
        shouldEndSession: false
      }
    });

  } catch (error) {
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Desculpa, tive um erro agora, mas já vou melhorar isso."
        },
        shouldEndSession: false
      }
    });
  }
});

app.listen(process.env.PORT || 3000);
