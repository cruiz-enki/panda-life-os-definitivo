// Generador de "Aprende Hoy" con shared AI client + fallback ante 429/errores
import { callAI, getCorsHeaders, verifyUser } from "../_shared/ai-client.ts";

const FALLBACK = {
  quote: { text: "La educación no es la preparación para la vida; la educación es la vida misma.", author: "John Dewey" },
  historicalFact: { year: "1844", event: "Samuel Morse envía el primer mensaje por telégrafo eléctrico desde Washington D.C. a Baltimore." },
  mexicoHistory: { year: "1824", event: "Promulgación de la primera Constitución Federal de los Estados Unidos Mexicanos.", context: "Estableció a México como una república federal." },
  worldHistory: { title: "La Caída del Muro de Berlín", event: "El 9 de noviembre de 1989 cayó el muro que dividió Alemania por 28 años.", significance: "Marcó el fin de la Guerra Fría." },
  recommendations: {
    book: { title: "Hábitos Atómicos", author: "James Clear", reason: "Pequeños cambios, grandes resultados." },
    series: { title: "The Bear", platform: "Disney+", reason: "Liderazgo y excelencia bajo presión." },
    movie: { title: "Cosmos", director: "Documental", reason: "Nuestro lugar en el universo." },
    podcast: { title: "The Diary of a CEO", host: "Steven Bartlett", reason: "Psicología y negocios." }
  },
  businessAnecdote: { title: "El origen de Netflix", story: "Reed Hastings fundó Netflix tras una multa de $40 en Blockbuster por devolver tarde 'Apollo 13'.", takeaway: "Los problemas personales son grandes ideas de negocio." },
  miniBiography: { person: "Leonardo da Vinci", era: "Renacimiento (1452-1519)", description: "Polímata florentino, ejemplo del Renacimiento.", achievement: "Pintura, anatomía e ingeniería; autor de la Mona Lisa." },
  classicBookSummary: { title: "Meditaciones", author: "Marco Aurelio", summary: "Reflexiones personales del emperador romano en campaña.", lesson: "Autodisciplina y humildad." },
  randomKnowledge: "¿Sabías que la miel no caduca? Se ha encontrado miel comestible en tumbas egipcias de 3,000 años.",
  randomKnowledge2: "¿Sabías que el chocolate fue moneda en civilizaciones mayas y aztecas?",
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyUser(req);
  if ("error" in auth) return auth.error;

  const systemPrompt = `Eres un generador de contenido educativo para "Panda's LIFE OS".
Generas un objeto JSON con esta estructura exacta:
{
  "quote": { "text": "", "author": "" },
  "historicalFact": { "year": "", "event": "" },
  "mexicoHistory": { "year": "", "event": "", "context": "" },
  "worldHistory": { "title": "", "event": "", "significance": "" },
  "recommendations": {
    "book": { "title": "", "author": "", "reason": "" },
    "series": { "title": "", "platform": "", "reason": "" },
    "movie": { "title": "", "director": "", "reason": "" },
    "podcast": { "title": "", "host": "", "reason": "" }
  },
  "businessAnecdote": { "title": "", "story": "", "takeaway": "" },
  "miniBiography": { "person": "", "era": "", "description": "", "achievement": "" },
  "classicBookSummary": { "title": "", "author": "", "summary": "", "lesson": "" },
  "randomKnowledge": "¿Sabías que...?",
  "randomKnowledge2": "¿Sabías que...? (tema distinto)"
}
Todo verídico, en español.`;

  // Reintentos con backoff exponencial para 429
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await callAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Genera el contenido de aprendizaje para hoy." },
        ],
        response_format: { type: "json_object" }
      });

      if (response.status === 429) {
        if (attempt < maxRetries - 1) {
          const delay = 800 * Math.pow(2, attempt) + Math.random() * 400;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.warn("ai-daily-learning: 429 tras reintentos, usando fallback");
        return new Response(JSON.stringify(FALLBACK), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!response.ok) {
        console.error("ai-daily-learning: status", response.status);
        return new Response(JSON.stringify(FALLBACK), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      return new Response(JSON.stringify(content), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("ai-daily-learning error", e);
      if (attempt === maxRetries - 1) {
        return new Response(JSON.stringify(FALLBACK), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  }

  return new Response(JSON.stringify(FALLBACK), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
