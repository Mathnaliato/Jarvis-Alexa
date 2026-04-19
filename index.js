import express from "express";

const app = express();
app.use(express.json());

// 🔑 sua chave (coloque no Railway ENV)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 função para chamar IA
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
        input: `Responda de forma simples, clara e amigável para voz: ${pergunta}`
      })
    });

    const data = await response.json();
    return data.output[0].content[0].text;

  } catch (e) {
    console.error(e);
    return "Tive um problema ao pensar. Pode tentar novamente?";
  }
}

// 🔥 rota da Alexa
app.post("/", async (req, res) => {
  try {
    const request = req.body.request;

    let speechText = "Não entendi. Pode repetir?";

    // 🟢 Quando abre
    if (request.type === "LaunchRequest") {
      speechText = "Olá, eu sou o Jarvis. Pode falar comigo naturalmente.";
    }

    // 🟡 Quando fala algo
    if (request.type === "IntentRequest") {
      const intentName = request.intent.name;

      if (intentName === "ChatIntent") {
        const userInput =
          request.intent.slots?.query?.value ||
          "não entendi";

        // 🔥 chama IA
        speechText = await perguntarIA(userInput);
      }

      if (intentName === "AMAZON.HelpIntent") {
        speechText = "Você pode me perguntar qualquer coisa, como notícias, curiosidades ou ajuda.";
      }

      if (intentName === "AMAZON.StopIntent" || intentName === "AMAZON.CancelIntent") {
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

    // 🔵 resposta final Alexa
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
