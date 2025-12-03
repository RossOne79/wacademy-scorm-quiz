import { QuizQuestion, VideoData } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// Schema di validazione per l'output del modello (stesso della Netlify Function)
const quizGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    learningObjectives: {
      type: Type.ARRAY,
      description: "Un elenco di 5-8 obiettivi di apprendimento in punti derivati dal video.",
      items: { type: Type.STRING },
    },
    quizBank: {
      type: Type.ARRAY,
      description: "Un elenco di domande del quiz basate sul video e sugli obiettivi.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description:
              "Tipo di domanda. Deve essere SOLO uno tra: 'mcq' (scelta multipla) o 'true_false' (vero/falso). NON usare 'short_answer'.",
          },
          difficulty: {
            type: Type.STRING,
            description: "Difficoltà della domanda. Deve essere uno tra: 'easy', 'medium', 'hard'.",
          },
          cognitive_level: {
            type: Type.STRING,
            description: "Livello cognitivo della domanda. Deve essere uno tra: 'recall', 'understand', 'apply'.",
          },
          stem: { type: Type.STRING, description: "Il testo della domanda." },
          choices: {
            type: Type.ARRAY,
            description:
              "OBBLIGATORIO per le domande 'mcq': deve essere un array con UN SOLO oggetto contenente ESATTAMENTE le chiavi 'A', 'B', 'C', 'D' con le quattro opzioni di risposta. NON omettere mai per domande mcq.",
            items: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING, description: "Prima opzione di risposta" },
                B: { type: Type.STRING, description: "Seconda opzione di risposta" },
                C: { type: Type.STRING, description: "Terza opzione di risposta" },
                D: { type: Type.STRING, description: "Quarta opzione di risposta" },
              },
              required: ["A", "B", "C", "D"],
            },
          },
          correct_answer: {
            type: Type.STRING,
            description:
              "La risposta corretta. Per MCQ, la lettera (es. 'B'). Per vero/falso, 'True' o 'False'. Per risposta breve, una risposta concisa.",
          },
          rationale_correct: {
            type: Type.STRING,
            description: "Spiegazione del perché la risposta corretta è giusta.",
          },
          rationale_incorrect: {
            type: Type.OBJECT,
            description:
              "Per mcq, spiegazioni del perché ogni distrattore è sbagliato (es. {'A': '...', 'C': '...', 'D': '...'}).",
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              C: { type: Type.STRING },
              D: { type: Type.STRING },
            },
          },
          source_timestamps: {
            type: Type.ARRAY,
            description: "Array di coppie [inizio, fine] in secondi dal video che supportano la domanda.",
            items: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
            },
          },
          tags: {
            type: Type.ARRAY,
            description: "Un array di parole chiave pertinenti.",
            items: { type: Type.STRING },
          },
        },
        required: [
          "type",
          "difficulty",
          "cognitive_level",
          "stem",
          "correct_answer",
          "rationale_correct",
          "source_timestamps",
          "tags",
        ],
      },
    },
  },
  required: ["learningObjectives", "quizBank"],
};

/**
 * Genera obiettivi di apprendimento e banca domande chiamando direttamente Gemini dal client (BYOK).
 * Usa la chiave API fornita dall'utente e NON passa da Netlify Functions.
 */
export async function generateQuizAndObjectives(
  videoData: VideoData,
  transcript: string | null,
  userApiKey: string,
): Promise<{ learningObjectives: string[]; quizBank: QuizQuestion[] } | null> {
  if (!userApiKey || !userApiKey.trim()) {
    throw new Error("Chiave API Gemini mancante. Configurala dall'header prima di generare il quiz.");
  }

  try {
    const apiKey = userApiKey.trim();
    const ai = new GoogleGenAI({ apiKey });

    const durationSeconds = Math.round(videoData.duration);
    let prompt: string;

    if (transcript) {
      prompt = `
Sei un esperto progettista didattico. Un utente ha fornito una trascrizione di un video.
Nome del file video originale: "${videoData.file.name}"
Durata del video: ${durationSeconds} secondi
Trascrizione:
---
${transcript}
---

Il tuo compito è analizzare la trascrizione fornita e:
1.  Creare 5-8 obiettivi di apprendimento chiari, concisi e misurabili, basati sul contenuto della trascrizione.
2.  Generare una banca di 20 domande del quiz basate ESCLUSIVAMENTE sulla trascrizione.
3.  Il quiz deve rispettare la seguente distribuzione di difficoltà: 50% facile (10), 35% medio (7), 15% difficile (3).
4.  Le domande devono coprire un mix di livelli cognitivi: rievocazione, comprensione e applicazione.
5.  Per ogni domanda, identifica i timestamp di origine plausibili all'interno della durata del video (da 0 a ${durationSeconds} secondi).

6.  TIPI DI DOMANDE: Usa SOLO questi due tipi:
    - "mcq" (scelta multipla con 4 opzioni A, B, C, D)
    - "true_false" (vero o falso)
    - NON usare MAI "short_answer" - questo tipo NON è supportato
    
7.  Per OGNI domanda MCQ il campo "choices" è OBBLIGATORIO:
    - Deve contenere un array con UN oggetto
    - L'oggetto DEVE avere ESATTAMENTE 4 chiavi: "A", "B", "C", "D"
    - Esempio: "choices": [{"A": "Prima opzione", "B": "Seconda opzione", "C": "Terza opzione", "D": "Quarta opzione"}]

Restituisci un singolo oggetto JSON che segua lo schema fornito. Non includere alcuna formattazione markdown.
TUTTO L'OUTPUT TESTUALE (obiettivi, domande, scelte, motivazioni) DEVE ESSERE IN ITALIANO.
`;
    } else {
      prompt = `
Sei un esperto progettista didattico. Un utente ha caricato un file video.
Nome del file video: "${videoData.file.name}"
Durata del video: ${durationSeconds} secondi

Dato che non puoi guardare il video, devi dedurre il suo probabile contenuto basandoti sul titolo e sulla durata. Immagina una trascrizione plausibile per questo video.

Basandoti sul contenuto dedotto del video, il tuo compito è:
1.  Creare 5-8 obiettivi di apprendimento chiari, concisi e misurabili, appropriati per questo video.
2.  Generare una banca di 20 domande del quiz basate ESCLUSIVAMENTE sul contenuto dedotto.
3.  Il quiz deve rispettare la seguente distribuzione di difficoltà: 50% facile (10), 35% medio (7), 15% difficile (3).
4.  Le domande devono coprire un mix di livelli cognitivi: rievocazione, comprensione e applicazione.
5.  Per ogni domanda, inventa dei timestamp di origine plausibili all'interno della durata del video (da 0 a ${durationSeconds} secondi).

6.  TIPI DI DOMANDE: Usa SOLO questi due tipi:
    - "mcq" (scelta multipla con 4 opzioni A, B, C, D)
    - "true_false" (vero o falso)
    - NON usare MAI "short_answer" - questo tipo NON è supportato
    
7.  Per OGNI domanda MCQ il campo "choices" è OBBLIGATORIO:
    - Deve contenere un array con UN oggetto
    - L'oggetto DEVE avere ESATTAMENTE 4 chiavi: "A", "B", "C", "D"
    - Esempio: "choices": [{"A": "Prima opzione", "B": "Seconda opzione", "C": "Terza opzione", "D": "Quarta opzione"}]

Restituisci un singolo oggetto JSON che segua lo schema fornito. Non includere alcuna formattazione markdown.
TUTTO L'OUTPUT TESTUALE (obiettivi, domande, scelte, motivazioni) DEVE ESSERE IN ITALIANO.
`;
    }

    // Chiamata diretta a Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizGenerationSchema,
      },
    });

    // Compatibilità con diverse versioni della libreria: text come proprietà o metodo
    let jsonString = "";
    const anyResponse: any = response;
    if (typeof anyResponse.text === "string") {
      jsonString = anyResponse.text.trim();
    } else if (typeof anyResponse.text === "function") {
      jsonString = anyResponse.text().trim();
    } else if (anyResponse.response?.text) {
      jsonString = anyResponse.response.text().trim();
    }

    if (!jsonString) {
      throw new Error("Risposta vuota dal modello AI.");
    }

    const parsedJson = JSON.parse(jsonString);

    // Basic validation
    if (!parsedJson.learningObjectives || !parsedJson.quizBank) {
      throw new Error("La risposta dell'AI non contiene i campi richiesti.");
    }

    // Valida e filtra domande non supportate o malformate (stessa logica della function)
    const originalCount = parsedJson.quizBank.length;
    parsedJson.quizBank = parsedJson.quizBank.filter((q: QuizQuestion) => {
      const qType = (q.type || "").toLowerCase();

      // Scarta short_answer (non supportato)
      if (qType === "short_answer") {
        console.warn("❌ Domanda short_answer scartata (non supportata):", q.stem);
        return false;
      }

      // Verifica che MCQ abbia choices valide
      if (qType === "mcq") {
        if (!q.choices || !Array.isArray(q.choices) || q.choices.length === 0) {
          console.warn("❌ Domanda MCQ scartata: mancano le opzioni di risposta", q.stem);
          return false;
        }
        const firstChoice = q.choices[0] as any;
        if (!firstChoice || !firstChoice.A || !firstChoice.B || !firstChoice.C || !firstChoice.D) {
          console.warn("❌ Domanda MCQ scartata: opzioni incomplete", {
            stem: q.stem,
            firstChoice,
          });
          return false;
        }
      }

      // Accetta solo mcq e true_false
      if (qType !== "mcq" && qType !== "true_false") {
        console.warn("❌ Domanda scartata (tipo non supportato):", qType, q.stem);
        return false;
      }

      return true;
    });

    if (parsedJson.quizBank.length < originalCount) {
      console.warn(`⚠️ Filtrate ${originalCount - parsedJson.quizBank.length} domande MCQ non valide`);
    }

    console.log("=== DEBUG: Gemini client response ===");
    console.log("Learning objectives:", parsedJson.learningObjectives.length);
    console.log("Valid questions:", parsedJson.quizBank.length);

    return {
      learningObjectives: parsedJson.learningObjectives as string[],
      quizBank: parsedJson.quizBank as QuizQuestion[],
    };
  } catch (error) {
    console.error("Error generating quiz via Gemini (client):", error);
    const message = error instanceof Error ? error.message : "Errore sconosciuto durante la generazione del quiz.";

    if (
      message.toLowerCase().includes("api key") ||
      message.toLowerCase().includes("unauthenticated") ||
      message.includes("401") ||
      message.includes("403")
    ) {
      throw new Error("Chiave API non valida o non autorizzata. Verifica la tua chiave Gemini.");
    }
    if (message.toLowerCase().includes("quota") || message.includes("429")) {
      throw new Error("Quota API esaurita o limite di richieste raggiunto. Riprova più tardi.");
    }

    throw new Error(message);
  }
}