import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// memória por sessão simples
let memory = [];

app.post("/", async (req, res) => {
  try {
    const userInput =
      req.body.request?.intent?.slots?.query?.value ||
      req.body.request?.intent?.slots?.text?.value ||
      "Olá";

    // adiciona à memória
    memory.push({ role: "user", content: userInput });

    // limita memória (últimas 8 mensagens)
    if (memory.length > 8) memory.shift();

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
Você é Jarvis, um assistente de voz extremamente humano, calmo e companheiro.

REGRAS IMPORTANTES:
- Fale sempre em português do Brasil
- Use frases curtas e claras
- Seja paciente e acolhedor
- Responda como se estivesse conversando com alguém que depende da voz
- Evite respostas longas demais
- Use tom amigável e natural
- Nunca seja robótico
- Sempre soe como um amigo presente
`
          },
          ...memory
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    // salva resposta
    memory.push({ role: "assistant", content: reply });

    // SSML (voz mais natural)
    const ssmlResponse = `
<speak>
  <prosody rate="90%" pitch="medium">
    ${reply}
  </prosody>
</speak>
`;

    res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "SSML",
          ssml: ssmlResponse
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
Desculpa, tive um pequeno problema agora.
Mas estou aqui com você, pode tentar de novo.
</speak>`
        },
        shouldEndSession: false
      }
    });
  }
});

app.listen(process.env.PORT || 3000);
