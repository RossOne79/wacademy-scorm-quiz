import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';
import { QuizQuestion } from '../../types';

const quizGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        learningObjectives: {
            type: Type.ARRAY,
            description: "Un elenco di 5-8 obiettivi di apprendimento in punti derivati dal video.",
            items: { type: Type.STRING }
        },
        quizBank: {
            type: Type.ARRAY,
            description: "Un elenco di domande del quiz basate sul video e sugli obiettivi.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "Tipo di domanda. Deve essere SOLO uno tra: 'mcq' (scelta multipla) o 'true_false' (vero/falso). NON usare 'short_answer'." },
                    difficulty: { type: Type.STRING, description: "Difficoltà della domanda. Deve essere uno tra: 'easy', 'medium', 'hard'." },
                    cognitive_level: { type: Type.STRING, description: "Livello cognitivo della domanda. Deve essere uno tra: 'recall', 'understand', 'apply'." },
                    stem: { type: Type.STRING, description: "Il testo della domanda." },
                    choices: {
                        type: Type.ARRAY,
                        description: "OBBLIGATORIO per le domande 'mcq': deve essere un array con UN SOLO oggetto contenente ESATTAMENTE le chiavi 'A', 'B', 'C', 'D' con le quattro opzioni di risposta. NON omettere mai per domande mcq.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                A: { type: Type.STRING, description: "Prima opzione di risposta" },
                                B: { type: Type.STRING, description: "Seconda opzione di risposta" },
                                C: { type: Type.STRING, description: "Terza opzione di risposta" },
                                D: { type: Type.STRING, description: "Quarta opzione di risposta" }
                            },
                            required: ["A", "B", "C", "D"]
                        }
                    },
                    correct_answer: { type: Type.STRING, description: "La risposta corretta. Per MCQ, la lettera (es. 'B'). Per vero/falso, 'True' o 'False'. Per risposta breve, una risposta concisa." },
                    rationale_correct: { type: Type.STRING, description: "Spiegazione del perché la risposta corretta è giusta." },
                    rationale_incorrect: {
                        type: Type.OBJECT,
                        description: "Per mcq, spiegazioni del perché ogni distrattore è sbagliato (es. {'A': '...', 'C': '...', 'D': '...'}).",
                        properties: {
                          A: { type: Type.STRING },
                          B: { type: Type.STRING },
                          C: { type: Type.STRING },
                          D: { type: Type.STRING }
                        }
                    },
                    source_timestamps: {
                        type: Type.ARRAY,
                        description: "Array di coppie [inizio, fine] in secondi dal video che supportano la domanda.",
                        items: {
                            type: Type.ARRAY,
                            items: { type: Type.NUMBER }
                        }
                    },
                    tags: {
                        type: Type.ARRAY,
                        description: "Un array di parole chiave pertinenti.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["type", "difficulty", "cognitive_level", "stem", "correct_answer", "rationale_correct", "source_timestamps", "tags"]
            }
        }
    },
    required: ["learningObjectives", "quizBank"]
};

export const handler: Handler = async (event) => {
    // Solo POST è permesso
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse del body della richiesta
        const body = JSON.parse(event.body || '{}');
        const { videoData, transcript, userApiKey } = body;

        if (!videoData) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'videoData is required' })
            };
        }

        // Verifica che la chiave API dell'utente sia presente
        if (!userApiKey || typeof userApiKey !== 'string' || userApiKey.trim().length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'API key is required. Please provide your Gemini API key.' })
            };
        }

        // Inizializza GoogleGenAI con la chiave dell'utente
        // IMPORTANTE: Non loggare mai la chiave API
        const ai = new GoogleGenAI({ apiKey: userApiKey.trim() });

        // Costruisci il prompt
        let prompt: string;

        if (transcript) {
            prompt = `
        Sei un esperto progettista didattico. Un utente ha fornito una trascrizione di un video.
        Nome del file video originale: "${videoData.file.name}"
        Durata del video: ${Math.round(videoData.duration)} secondi
        Trascrizione:
        ---
        ${transcript}
        ---

        Il tuo compito è analizzare la trascrizione fornita e:
        1.  Creare 5-8 obiettivi di apprendimento chiari, concisi e misurabili, basati sul contenuto della trascrizione.
        2.  Generare una banca di 10 domande del quiz basate ESCLUSIVAMENTE sulla trascrizione.
        3.  Il quiz deve rispettare la seguente distribuzione di difficoltà: circa 50% facile (5), 30% medio (3), 20% difficile (2).
        4.  Le domande devono coprire un mix di livelli cognitivi: rievocazione, comprensione e applicazione.
        5.  Per ogni domanda, identifica i timestamp di origine plausibili all'interno della durata del video (da 0 a ${Math.round(videoData.duration)} secondi).
        
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
        Durata del video: ${Math.round(videoData.duration)} secondi

        Dato che non puoi guardare il video, devi dedurre il suo probabile contenuto basandoti sul titolo e sulla durata. Immagina una trascrizione plausibile per questo video.

        Basandoti sul contenuto dedotto del video, il tuo compito è:
        1.  Creare 5-8 obiettivi di apprendimento chiari, concisi e misurabili, appropriati per questo video.
        2.  Generare una banca di 10 domande del quiz basate ESCLUSIVAMENTE sul contenuto dedotto.
        3.  Il quiz deve rispettare la seguente distribuzione di difficoltà: circa 50% facile (5), 30% medio (3), 20% difficile (2).
        4.  Le domande devono coprire un mix di livelli cognitivi: rievocazione, comprensione e applicazione.
        5.  Per ogni domanda, inventa dei timestamp di origine plausibili all'interno della durata del video (da 0 a ${Math.round(videoData.duration)} secondi).
        
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

        // Chiama Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: quizGenerationSchema,
            }
        });

        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);

        // Basic validation
        if (!parsedJson.learningObjectives || !parsedJson.quizBank) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'AI response is missing required fields' })
            };
        }

        // Valida e filtra domande non supportate o malformate
        const originalCount = parsedJson.quizBank.length;
        parsedJson.quizBank = parsedJson.quizBank.filter((q: QuizQuestion) => {
            const qType = (q.type || "").toLowerCase();
            
            // Scarta short_answer (non supportato)
            if (qType === 'short_answer') {
                console.warn("❌ Domanda short_answer scartata (non supportata):", q.stem);
                return false;
            }
            
            // Verifica che MCQ abbia choices valide
            if (qType === 'mcq') {
                if (!q.choices || !Array.isArray(q.choices) || q.choices.length === 0) {
                    console.warn("❌ Domanda MCQ scartata: mancano le opzioni di risposta", q.stem);
                    return false;
                }
                const firstChoice = q.choices[0];
                if (!firstChoice || !firstChoice.A || !firstChoice.B || !firstChoice.C || !firstChoice.D) {
                    console.warn("❌ Domanda MCQ scartata: opzioni incomplete", {
                        stem: q.stem,
                        firstChoice
                    });
                    return false;
                }
            }
            
            // Accetta solo mcq e true_false
            if (qType !== 'mcq' && qType !== 'true_false') {
                console.warn("❌ Domanda scartata (tipo non supportato):", qType, q.stem);
                return false;
            }
            
            return true;
        });
        
        if (parsedJson.quizBank.length < originalCount) {
            console.warn(`⚠️ Filtrate ${originalCount - parsedJson.quizBank.length} domande MCQ non valide`);
        }

        // Ritorna il risultato
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                learningObjectives: parsedJson.learningObjectives,
                quizBank: parsedJson.quizBank as QuizQuestion[],
            })
        };

    } catch (error) {
        // IMPORTANTE: Non loggare mai la chiave API nei messaggi di errore
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Log dell'errore senza includere la chiave
        console.error('Error generating quiz:', errorMessage);
        
        // Messaggi di errore user-friendly
        let userMessage = 'Failed to generate quiz';
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
            userMessage = 'Chiave API non valida o non autorizzata. Verifica la tua chiave Gemini.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            userMessage = 'Quota API esaurita. Riprova più tardi.';
        } else if (errorMessage.includes('rate limit')) {
            userMessage = 'Troppe richieste. Riprova tra qualche minuto.';
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: userMessage,
                message: errorMessage
            })
        };
    }
};

