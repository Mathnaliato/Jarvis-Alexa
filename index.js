import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// memória por usuário (melhor que global)
const sessions = {};

app.post("/", async (req, res) => {
  try {
    const sessionId = req.body.session?.sessionId || "default";

    const userInput =
      req.body.request?.intent?.slots?.query?.value ||
      req.body.request?.intent?.slots?.text?.value ||
      "Olá";

    // cria memória se não existir
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    const memory = sessions[sessionId];

    memory.push({ role: "user", content: userInput });

    if (memory.length > 10) memory.shift();

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
            content: `
Você é Jarvis, um assistente extremamente humano.

COMPORTAMENTO:
- Fale em português do Brasil
- Seja calmo, paciente e amigável
- Use frases curtas
- Fale como um companheiro próximo
- Evite respostas longas
- Seja acolhedor e natural
- Nunca soe robótico
- Ajude e converse como um amigo presente
`
          },
          ...memory
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    });

    const data = await response.json();
    let reply = data.choices[0].message.content;

    // limpa resposta (evita coisas estranhas na fala)
    reply = reply.replace(/\n/g, " ");

    memory.push({ role: "assistant", content: reply });

    // SSML melhorado (mais natural)
    const ssml = `
<speak>
  <prosody rate="88%" pitch="medium">
    ${reply}
  </prosody>
  <break time="400ms"/>
</speak>
`;

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: ssml
        },
        shouldEndSession: false
      }
    });

  } catch (error) {
    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: `
<speak>
Desculpa, tive um pequeno erro agora.
Mas continuo aqui com você.
</speak>`
        },
        shouldEndSession: false
      }
    });
  }
});

app.listen(process.env.PORT || 3000);
