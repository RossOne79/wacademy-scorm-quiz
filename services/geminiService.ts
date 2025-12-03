import { QuizQuestion, VideoData } from '../types';

// La logica di generazione del quiz è ora gestita dalla Netlify Function
// Questo file ora fa solo da client per chiamare la function

export async function generateQuizAndObjectives(videoData: VideoData, transcript: string | null, userApiKey: string): Promise<{ learningObjectives: string[], quizBank: QuizQuestion[] } | null> {
    try {
        // Prepara i dati serializzabili per la Netlify Function
        // Il File object non può essere serializzato direttamente, quindi estraiamo solo le proprietà necessarie
        const serializableVideoData = {
            file: {
                name: videoData.file.name,
                size: videoData.file.size,
                type: videoData.file.type,
            },
            url: videoData.url,
            thumbnail: videoData.thumbnail,
            duration: videoData.duration,
        };

        // Determina l'URL della function
        // In produzione usa l'URL di Netlify, in sviluppo usa localhost
        const functionUrl = import.meta.env.PROD 
            ? '/.netlify/functions/generate-quiz'
            : 'http://localhost:8888/.netlify/functions/generate-quiz';

        console.log('Calling Netlify Function:', functionUrl);

        // Chiama la Netlify Function
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoData: serializableVideoData,
                transcript,
                userApiKey,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
            
            // Messaggi di errore più user-friendly
            if (response.status === 400 && errorMessage.includes('API key')) {
                throw new Error('Chiave API non valida. Controlla la chiave nell\'header.');
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('Chiave API non autorizzata. Verifica la tua chiave Gemini.');
            } else if (response.status === 429) {
                throw new Error('Quota API esaurita. Riprova più tardi.');
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();

        // DEBUG: Log raw response
        console.log("=== DEBUG: Netlify Function Response ===");
        console.log("Total questions received:", result.quizBank?.length || 0);
        if (result.quizBank) {
            result.quizBank.forEach((q: QuizQuestion, i: number) => {
                console.log(`Question ${i + 1}:`, {
                    type: q.type,
                    stem: q.stem?.substring(0, 50) + "...",
                    hasChoices: !!q.choices,
                    choicesLength: q.choices?.length,
                });
            });
        }

        // Basic validation
        if (!result.learningObjectives || !result.quizBank) {
            throw new Error("Function response is missing required fields.");
        }

        console.log("=== DEBUG: After filtering ===");
        console.log("Valid questions:", result.quizBank.length);

        return {
            learningObjectives: result.learningObjectives,
            quizBank: result.quizBank as QuizQuestion[],
        };

    } catch (error) {
        console.error("Error generating quiz via Netlify Function:", error);
        throw error;
    }
}