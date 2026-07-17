/**
 * Datos estáticos del **árbol de habilidades (Skill Tree)**: categorías,
 * subcategorías y skills con sus iconos.
 */
import { 
  Briefcase, 
  Landmark, 
  Cpu, 
  Megaphone, 
  GraduationCap, 
  Brain, 
  Film, 
  BookOpen, 
  Wallet, 
  Dumbbell
} from "lucide-react";

export interface Skill {
  id: string;
  name: string;
}

export interface SubCategory {
  name: string;
  skills: Skill[];
}

export interface Category {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
  multiplier?: boolean;
  subCategories: SubCategory[];
}

export const SKILL_TREE_DATA: Category[] = [
  {
    id: "business",
    name: "💼 NEGOCIOS, EMPRENDIMIENTO & ESTRATEGIA",
    icon: Briefcase,
    description: "Tu categoría ejecutiva. Estrategia, emprendimiento y finanzas corporativas.",
    color: "from-blue-500 to-indigo-600",
    subCategories: [
      {
        name: "Estrategia empresarial",
        skills: [
          { id: "biz-strat-models", name: "Modelos de negocio" },
          { id: "biz-strat-diff", name: "Diferenciación" },
          { id: "biz-strat-comp", name: "Ventaja competitiva" },
          { id: "biz-strat-scale", name: "Escalamiento" },
          { id: "biz-strat-systems", name: "Sistemas empresariales" }
        ]
      },
      {
        name: "Emprendimiento",
        skills: [
          { id: "ent-startups", name: "Startups" },
          { id: "ent-mvp", name: "MVP" },
          { id: "ent-validation", name: "Validación" },
          { id: "ent-growth", name: "Growth" },
          { id: "ent-innovation", name: "Innovación" }
        ]
      },
      {
        name: "SaaS & negocios digitales",
        skills: [
          { id: "saas-multitenant", name: "Multi-tenant" },
          { id: "saas-pricing", name: "Pricing SaaS" },
          { id: "saas-retention", name: "Retención" },
          { id: "saas-ux", name: "UX de producto" },
          { id: "saas-pmf", name: "Product Market Fit" }
        ]
      },
      {
        name: "Finanzas empresariales",
        skills: [
          { id: "fin-burn", name: "Burn rate" },
          { id: "fin-profit", name: "Rentabilidad" },
          { id: "fin-kpis", name: "KPIs" },
          { id: "fin-flow", name: "Flujo" },
          { id: "fin-costs", name: "Costeo" }
        ]
      },
      {
        name: "Ventas & negociación",
        skills: [
          { id: "sales-psych", name: "Psicología de ventas" },
          { id: "sales-neg", name: "Negociación" },
          { id: "sales-close", name: "Cierre" },
          { id: "sales-obj", name: "Objeciones" },
          { id: "sales-b2b", name: "B2B" }
        ]
      },
      {
        name: "Operaciones",
        skills: [
          { id: "ops-sops", name: "SOPs" },
          { id: "ops-delegation", name: "Delegación" },
          { id: "ops-execution", name: "Cultura de ejecución" },
          { id: "ops-efficiency", name: "Eficiencia" }
        ]
      },
      {
        name: "Historia empresarial",
        skills: [
          { id: "hist-case-studies", name: "Casos de estudio empresariales" },
          { id: "hist-iconic-cos", name: "Empresas icónicas" },
          { id: "hist-ceos", name: "CEOs históricos" },
          { id: "hist-crisis", name: "Crisis corporativas" },
          { id: "hist-failures", name: "Fracasos empresariales" },
          { id: "hist-expansion", name: "Estrategias de expansión" }
        ]
      },
      {
        name: "Casos de Estudio Reales",
        skills: [
          { id: "biz-case-mcd", name: "McDonald’s" },
          { id: "biz-case-apple", name: "Apple" },
          { id: "biz-case-disney", name: "Disney" },
          { id: "biz-case-ford", name: "Ford Motor Company" }
        ]
      }
    ]
  },
  {
    id: "history",
    name: "🏛 HISTORIA, POLÍTICA & GEOPOLÍTICA",
    icon: Landmark,
    description: "Tu categoría legendaria. Un viaje a través del tiempo, el poder y las naciones.",
    color: "from-amber-600 to-orange-700",
    multiplier: true,
    subCategories: [
      {
        name: "Historia de México",
        skills: [
          { id: "mx-viceroyalty", name: "Virreinato" },
          { id: "mx-independence", name: "Independencia" },
          { id: "mx-reform", name: "Reforma" },
          { id: "mx-revolution", name: "Revolución" },
          { id: "mx-pri", name: "PRI" },
          { id: "mx-presidencies", name: "Presidencias" },
          { id: "mx-contemporary", name: "Política mexicana contemporánea" }
        ]
      },
      {
        name: "Historia universal",
        skills: [
          { id: "wh-antiquity", name: "Antigüedad" },
          { id: "wh-middle-ages", name: "Edad Media" },
          { id: "wh-renaissance", name: "Renacimiento" },
          { id: "wh-colonialism", name: "Colonialismo" },
          { id: "wh-modernity", name: "Modernidad" },
          { id: "wh-contemporary", name: "Historia contemporánea" }
        ]
      },
      {
        name: "Imperios & civilizaciones",
        skills: [
          { id: "emp-rome", name: "Roma" },
          { id: "emp-greece", name: "Grecia" },
          { id: "emp-egypt", name: "Egipto" },
          { id: "emp-british", name: "Imperio británico" },
          { id: "emp-mongols", name: "Mongoles" },
          { id: "emp-ottoman", name: "Otomano" },
          { id: "emp-aztecs", name: "Aztecas" },
          { id: "emp-mayas", name: "Mayas" }
        ]
      },
      {
        name: "Guerras & estrategia militar",
        skills: [
          { id: "war-wwi", name: "WWI" },
          { id: "war-wwii", name: "WWII" },
          { id: "war-cold", name: "Guerra Fría" },
          { id: "war-vietnam", name: "Vietnam" },
          { id: "war-middle-east", name: "Medio Oriente" },
          { id: "war-strategy", name: "Estrategia militar" },
          { id: "war-intel", name: "Inteligencia" }
        ]
      },
      {
        name: "Política internacional",
        skills: [
          { id: "pol-usa", name: "EUA" },
          { id: "pol-mx", name: "México" },
          { id: "pol-ru", name: "Rusia" },
          { id: "pol-cn", name: "China" },
          { id: "pol-eu", name: "Unión Europea" },
          { id: "pol-latam", name: "Latinoamérica" }
        ]
      },
      {
        name: "Geopolítica",
        skills: [
          { id: "geo-global-power", name: "Poder global" },
          { id: "geo-energy", name: "Energía" },
          { id: "geo-resources", name: "Recursos" },
          { id: "geo-conflicts", name: "Conflictos" },
          { id: "geo-diplomacy", name: "Diplomacia" },
          { id: "geo-intl-econ", name: "Economía internacional" }
        ]
      },
      {
        name: "Religión, poder & sociedad",
        skills: [
          { id: "rel-christianity", name: "Cristianismo" },
          { id: "rel-islam", name: "Islam" },
          { id: "rel-judaism", name: "Judaísmo" },
          { id: "rel-vatican", name: "Vaticano" },
          { id: "rel-pol-soc", name: "Religión y política" },
          { id: "rel-sects", name: "Sectas e ideologías" }
        ]
      },
      {
        name: "Historia del poder",
        skills: [
          { id: "pow-dictators", name: "Dictadores" },
          { id: "pow-presidents", name: "Presidentes" },
          { id: "pow-kings", name: "Reyes" },
          { id: "pow-revolutions", name: "Revoluciones" },
          { id: "pow-movements", name: "Movimientos ideológicos" }
        ]
      },
      {
        name: "Historia económica",
        skills: [
          { id: "econ-capitalism", name: "Capitalismo" },
          { id: "econ-socialism", name: "Socialismo" },
          { id: "econ-crises", name: "Crisis económicas" },
          { id: "econ-markets", name: "Mercados" },
          { id: "econ-fin-empires", name: "Imperios financieros" }
        ]
      }
    ]
  },
  {
    id: "tech",
    name: "🤖 IA, AUTOMATIZACIÓN & TECNOLOGÍA",
    icon: Cpu,
    description: "Tu categoría builder. El futuro se construye con código e inteligencia artificial.",
    color: "from-cyan-500 to-blue-600",
    subCategories: [
      {
        name: "IA generativa",
        skills: [
          { id: "ai-prompting", name: "Prompt engineering" },
          { id: "ai-agents", name: "Agentes IA" }
        ]
      },
      {
        name: "Automatización",
        skills: [
          { id: "auto-make", name: "Make" },
          { id: "auto-n8n", name: "n8n" }
        ]
      },
      {
        name: "Build & Architecture",
        skills: [
          { id: "tech-lovable", name: "Lovable & vibe coding" },
          { id: "tech-saas-arch", name: "SaaS architecture" },
          { id: "tech-it-infra", name: "Infraestructura TI" },
          { id: "tech-security", name: "Ciberseguridad" },
          { id: "tech-wordpress", name: "WordPress/Web" },
          { id: "tech-biz-systems", name: "Sistemas empresariales" }
        ]
      }
    ]
  },
  {
    id: "marketing",
    name: "📣 MARKETING, BRANDING & COMUNICACIÓN",
    icon: Megaphone,
    description: "Tu categoría creativa-comercial. Persuasión, narrativa y marca personal.",
    color: "from-pink-500 to-rose-600",
    subCategories: [
      {
        name: "Fundamentos",
        skills: [
          { id: "mkt-branding", name: "Branding" },
          { id: "mkt-copywriting", name: "Copywriting" },
          { id: "mkt-storytelling", name: "Storytelling" },
          { id: "mkt-consumer-psych", name: "Psicología del consumidor" }
        ]
      },
      {
        name: "Canales & herramientas",
        skills: [
          { id: "mkt-social", name: "Redes sociales" },
          { id: "mkt-meta-ads", name: "Meta Ads" },
          { id: "mkt-visual", name: "Diseño visual" },
          { id: "mkt-creative-dir", name: "Dirección creativa" },
          { id: "mkt-ai-video", name: "Video IA" },
          { id: "mkt-local", name: "Marketing local" },
          { id: "mkt-community", name: "Community building" }
        ]
      }
    ]
  },
  {
    id: "leadership",
    name: "🎓 LIDERAZGO, CULTURA & RH",
    icon: GraduationCap,
    description: "Tu categoría de mentor. Gestión de personas, cultura y liderazgo ejecutivo.",
    color: "from-emerald-500 to-teal-600",
    subCategories: [
      {
        name: "Liderazgo",
        skills: [
          { id: "lead-maxwell", name: "Maxwell" },
          { id: "lead-drucker", name: "Drucker" },
          { id: "lead-executive", name: "Liderazgo ejecutivo" },
          { id: "lead-situational", name: "Liderazgo situacional" }
        ]
      },
      {
        name: "Gestión & Cultura",
        skills: [
          { id: "lead-coaching", name: "Coaching" },
          { id: "lead-eq", name: "Inteligencia emocional" },
          { id: "lead-comm", name: "Comunicación" },
          { id: "lead-teams", name: "Equipos" },
          { id: "lead-culture", name: "Cultura organizacional" },
          { id: "lead-hr", name: "RH" },
          { id: "lead-nom035", name: "NOM035" },
          { id: "lead-training", name: "Capacitación" },
          { id: "lead-gamification", name: "Gamificación" },
          { id: "lead-team-building", name: "Team Building" }
        ]
      }
    ]
  },
  {
    id: "psychology",
    name: "🧠 PSICOLOGÍA HUMANA & COMPORTAMIENTO",
    icon: Brain,
    description: "Tu categoría de comprensión humana. Mente, motivación y sesgos.",
    color: "from-purple-500 to-fuchsia-600",
    subCategories: [
      {
        name: "Mente & Conducta",
        skills: [
          { id: "psy-human", name: "Psicología humana" },
          { id: "psy-motivation", name: "Motivación" },
          { id: "psy-habits", name: "Hábitos" },
          { id: "psy-anxiety", name: "Ansiedad" },
          { id: "psy-enneagram", name: "Eneagrama" },
          { id: "psy-persuasion", name: "Persuasión" },
          { id: "psy-conduct", name: "Conducta" },
          { id: "psy-neuroscience", name: "Neurociencia básica" },
          { id: "psy-decisions", name: "Toma de decisiones" },
          { id: "psy-biases", name: "Sesgos cognitivos" }
        ]
      }
    ]
  },
  {
    id: "culture",
    name: "🎬 CULTURA GENERAL, CINE & LITERATURA",
    icon: Film,
    description: "Tu conexión entre el arte, los libros y la historia.",
    color: "from-red-500 to-orange-600",
    subCategories: [
      {
        name: "Cine",
        skills: [
          { id: "cine-hist", name: "Historia del cine" },
          { id: "cine-classics", name: "Películas clásicas" },
          { id: "cine-historical", name: "Cine histórico" },
          { id: "cine-business", name: "Cine de negocios" },
          { id: "cine-war", name: "Cine bélico" },
          { id: "cine-analysis", name: "Análisis cinematográfico" }
        ]
      },
      {
        name: "Literatura",
        skills: [
          { id: "lit-classics", name: "Clásicos" },
          { id: "lit-hist-novel", name: "Novela histórica" },
          { id: "lit-pol", name: "Literatura política" },
          { id: "lit-biz", name: "Literatura de negocios" },
          { id: "lit-scifi", name: "Ciencia ficción" }
        ]
      },
      {
        name: "Narrativa & Filosofía",
        skills: [
          { id: "story-struct", name: "Estructuras narrativas" },
          { id: "story-archetypes", name: "Arquetipos" },
          { id: "story-hist-chars", name: "Personajes históricos" },
          { id: "phil-ideas", name: "Ideas que cambiaron al mundo" },
          { id: "phil-movements", name: "Movimientos culturales" }
        ]
      },
      {
        name: "Arte & Música",
        skills: [
          { id: "art-symbols", name: "Simbología" },
          { id: "art-hist", name: "Arte histórico" },
          { id: "art-propaganda", name: "Propaganda" },
          { id: "music-epochs", name: "Música por época" },
          { id: "music-movements", name: "Música y movimientos sociales" }
        ]
      }
    ]
  },
  {
    id: "education",
    name: "📖 EDUCACIÓN & CREACIÓN DE EXPERIENCIAS",
    icon: BookOpen,
    description: "Tu categoría de formador. Diseño instruccional y facilitación.",
    color: "from-emerald-400 to-cyan-500",
    subCategories: [
      {
        name: "Formación",
        skills: [
          { id: "edu-instr-design", name: "Diseño instruccional" },
          { id: "edu-presentations", name: "Presentaciones" },
          { id: "edu-webinar", name: "Webinar mastery" },
          { id: "edu-facilitation", name: "Facilitación" },
          { id: "edu-workshops", name: "Workshops" },
          { id: "edu-dynamics", name: "Dinámicas" },
          { id: "edu-gamification", name: "Gamificación" },
          { id: "edu-storytelling", name: "Storytelling educativo" },
          { id: "edu-exp-design", name: "Diseño de experiencias" }
        ]
      }
    ]
  },
  {
    id: "finance_personal",
    name: "💰 FINANZAS PERSONALES & PATRIMONIO",
    icon: Wallet,
    description: "Tu categoría de crecimiento patrimonial e inversiones.",
    color: "from-green-500 to-emerald-700",
    subCategories: [
      {
        name: "Patrimonio",
        skills: [
          { id: "fin-budget", name: "Presupuesto" },
          { id: "fin-flow-p", name: "Flujo" },
          { id: "fin-credit", name: "Crédito" },
          { id: "fin-debt", name: "Deuda" },
          { id: "fin-savings", name: "Ahorro" },
          { id: "fin-invest", name: "Inversión" },
          { id: "fin-insurance", name: "Seguros" },
          { id: "fin-taxes", name: "Impuestos personales" },
          { id: "fin-wealth", name: "Patrimonio" }
        ]
      }
    ]
  },
  {
    id: "health",
    name: "🏋️ SALUD, LONGEVIDAD & PERFORMANCE",
    icon: Dumbbell,
    description: "Tu categoría de reconstrucción 2026. Longevidad y vitalidad.",
    color: "from-orange-500 to-red-600",
    subCategories: [
      {
        name: "Vitalidad",
        skills: [
          { id: "health-nut", name: "Nutrición" },
          { id: "health-meta", name: "Obesidad/metabolismo" },
          { id: "health-mounjaro", name: "Mounjaro" },
          { id: "health-strength", name: "Fuerza" },
          { id: "health-lumbar", name: "Movilidad lumbar" },
          { id: "health-sleep", name: "Sueño" },
          { id: "health-bio", name: "Biomarcadores" },
          { id: "health-anxiety", name: "Ansiedad física" },
          { id: "health-pain", name: "Dolor crónico" },
          { id: "health-longevity", name: "Longevidad" }
        ]
      }
    ]
  }
];
