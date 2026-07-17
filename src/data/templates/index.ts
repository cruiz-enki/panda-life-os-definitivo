// Plantillas predefinidas de contenido. Cada pack contiene listas opcionales
// de habits, tasks, ingredients, dishes, rewards, quests.

export type TemplateHabit = {
  name: string;
  emoji?: string;
  points?: number;
  frequency?: "daily" | "weekly" | "monthly";
  target_count?: number;
};

export type TemplateTask = {
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  tags?: string[];
};

export type TemplateIngredient = {
  name: string;
  emoji?: string;
  category?: string;
  default_unit?: string;
  default_qty?: string;
};

export type TemplateDish = {
  name: string;
  emoji?: string;
  dish_type?: "quick" | "prep";
  classification?: "saludable" | "chatarra";
  preparation?: string;
  prep_minutes?: number;
  servings?: number;
  ingredient_names?: string[]; // referencias por nombre a ingredientes ya creados
};

export type TemplateReward = {
  name: string;
  description?: string;
  emoji?: string;
  cost?: number;
  category?: string;
};

export type TemplateQuest = {
  title: string;
  description?: string;
  emoji?: string;
  xp?: number;
  target?: number;
  scope?: "daily" | "weekly" | "monthly";
};

export type ContentTemplate = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  habits?: TemplateHabit[];
  tasks?: TemplateTask[];
  ingredients?: TemplateIngredient[];
  dishes?: TemplateDish[];
  rewards?: TemplateReward[];
  quests?: TemplateQuest[];
  fixed_missions?: any[];
  skills?: any[];
};

export const TEMPLATES: ContentTemplate[] = [
  {
    id: "fitness",
    name: "Fitness & Gym",
    emoji: "💪",
    description: "Hábitos, premios y misiones para construir un cuerpo fuerte.",
    habits: [
      { name: "Entrenar fuerza", emoji: "🏋️", points: 20, frequency: "daily" },
      { name: "Cardio 20 min", emoji: "🏃", points: 15, frequency: "daily" },
      { name: "2L de agua", emoji: "💧", points: 10, frequency: "daily", target_count: 8 },
      { name: "Comer proteína en cada comida", emoji: "🥩", points: 15, frequency: "daily", target_count: 3 },
      { name: "Dormir 8 horas", emoji: "😴", points: 15, frequency: "daily" },
      { name: "Estiramiento / movilidad", emoji: "🧘", points: 10, frequency: "daily" },
      { name: "Pesarse", emoji: "⚖️", points: 5, frequency: "weekly" },
      { name: "Foto de progreso", emoji: "📸", points: 10, frequency: "weekly" },
    ],
    rewards: [
      { name: "Ropa nueva de gym", emoji: "👕", cost: 500, category: "gear" },
      { name: "Masaje deportivo", emoji: "💆", cost: 800, category: "selfcare" },
      { name: "Cheat meal", emoji: "🍔", cost: 200, category: "food" },
      { name: "Suplemento nuevo", emoji: "🥤", cost: 400, category: "gear" },
      { name: "Día de descanso sin culpa", emoji: "🛋️", cost: 150, category: "rest" },
    ],
    quests: [
      { title: "Entrenar 5 veces esta semana", emoji: "🔥", xp: 200, target: 5, scope: "weekly" },
      { title: "10,000 pasos diarios x 7", emoji: "👟", xp: 250, target: 7, scope: "weekly" },
    ],
  },
  {
    id: "productividad",
    name: "Productividad",
    emoji: "🚀",
    description: "Rutinas y misiones para enfocarte en lo importante.",
    habits: [
      { name: "Deep Work 90 min", emoji: "🎯", points: 25, frequency: "daily" },
      { name: "Planificar el día", emoji: "📋", points: 10, frequency: "daily" },
      { name: "Journaling nocturno", emoji: "📔", points: 10, frequency: "daily" },
      { name: "Inbox cero", emoji: "📥", points: 10, frequency: "daily" },
      { name: "Revisión semanal", emoji: "🗓️", points: 30, frequency: "weekly" },
      { name: "Lectura 30 min", emoji: "📚", points: 15, frequency: "daily" },
    ],
    tasks: [
      { title: "Definir 3 prioridades de la semana", priority: "high", tags: ["semanal"] },
      { title: "Limpiar escritorio digital", priority: "low" },
      { title: "Revisar metas del trimestre", priority: "high" },
      { title: "Procesar notas pendientes", priority: "medium" },
    ],
    rewards: [
      { name: "Libro nuevo", emoji: "📕", cost: 300, category: "gear" },
      { name: "Café especial", emoji: "☕", cost: 100, category: "food" },
      { name: "Tarde libre sin pantallas", emoji: "🌳", cost: 250, category: "rest" },
      { name: "Suscripción a herramienta nueva", emoji: "💻", cost: 500, category: "gear" },
    ],
  },
  {
    id: "nutricion",
    name: "Nutrición",
    emoji: "🥗",
    description: "Ingredientes base, platillos y misiones alimenticias inicial.",
    ingredients: [
      { name: "Pechuga de pollo", emoji: "🍗", category: "proteina", default_unit: "g", default_qty: "150" },
      { name: "Huevo", emoji: "🥚", category: "proteina", default_unit: "pz", default_qty: "2" },
      { name: "Atún en agua", emoji: "🐟", category: "proteina", default_unit: "lata", default_qty: "1" },
      { name: "Salmón", emoji: "🐟", category: "proteina", default_unit: "g", default_qty: "150" },
      { name: "Carne molida magra", emoji: "🥩", category: "proteina", default_unit: "g", default_qty: "150" },
      { name: "Arroz integral", emoji: "🍚", category: "carbohidrato", default_unit: "g", default_qty: "80" },
      { name: "Avena", emoji: "🥣", category: "carbohidrato", default_unit: "g", default_qty: "60" },
      { name: "Pasta integral", emoji: "🍝", category: "carbohidrato", default_unit: "g", default_qty: "80" },
      { name: "Tortilla de maíz", emoji: "🫓", category: "carbohidrato", default_unit: "pz", default_qty: "2" },
      { name: "Camote", emoji: "🍠", category: "carbohidrato", default_unit: "g", default_qty: "150" },
      { name: "Brócoli", emoji: "🥦", category: "verdura", default_unit: "g", default_qty: "150" },
      { name: "Espinaca", emoji: "🥬", category: "verdura", default_unit: "g", default_qty: "100" },
      { name: "Jitomate", emoji: "🍅", category: "verdura", default_unit: "pz", default_qty: "1" },
      { name: "Pepino", emoji: "🥒", category: "verdura", default_unit: "pz", default_qty: "1" },
      { name: "Zanahoria", emoji: "🥕", category: "verdura", default_unit: "pz", default_qty: "1" },
      { name: "Aguacate", emoji: "🥑", category: "grasa", default_unit: "pz", default_qty: "0.5" },
      { name: "Aceite de oliva", emoji: "🫒", category: "grasa", default_unit: "ml", default_qty: "10" },
      { name: "Almendras", emoji: "🌰", category: "grasa", default_unit: "g", default_qty: "20" },
      { name: "Plátano", emoji: "🍌", category: "fruta", default_unit: "pz", default_qty: "1" },
      { name: "Manzana", emoji: "🍎", category: "fruta", default_unit: "pz", default_qty: "1" },
      { name: "Fresas", emoji: "🍓", category: "fruta", default_unit: "g", default_qty: "100" },
      { name: "Yogurt griego", emoji: "🥛", category: "lacteo", default_unit: "g", default_qty: "150" },
      { name: "Queso panela", emoji: "🧀", category: "lacteo", default_unit: "g", default_qty: "60" },
      { name: "Leche", emoji: "🥛", category: "lacteo", default_unit: "ml", default_qty: "200" },
      { name: "Sal y especias", emoji: "🧂", category: "otros", default_unit: "g", default_qty: "2" },
    ],
    dishes: [
      {
        name: "Bowl de pollo con arroz",
        emoji: "🍲",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Cocinar pollo a la plancha, servir sobre arroz integral con brócoli.",
        prep_minutes: 20,
        servings: 1,
        ingredient_names: ["Pechuga de pollo", "Arroz integral", "Brócoli", "Aceite de oliva"],
      },
      {
        name: "Avena con plátano",
        emoji: "🥣",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Cocinar avena con leche, agregar plátano y almendras.",
        prep_minutes: 8,
        servings: 1,
        ingredient_names: ["Avena", "Leche", "Plátano", "Almendras"],
      },
      {
        name: "Huevos con tortilla",
        emoji: "🍳",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Revolver huevos, servir en tortillas con aguacate.",
        prep_minutes: 10,
        servings: 1,
        ingredient_names: ["Huevo", "Tortilla de maíz", "Aguacate"],
      },
      {
        name: "Ensalada de atún",
        emoji: "🥗",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Mezclar atún con espinaca, jitomate, pepino y aceite de oliva.",
        prep_minutes: 7,
        servings: 1,
        ingredient_names: ["Atún en agua", "Espinaca", "Jitomate", "Pepino", "Aceite de oliva"],
      },
      {
        name: "Yogurt con fresas",
        emoji: "🍓",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Servir yogurt con fresas y almendras encima.",
        prep_minutes: 3,
        servings: 1,
        ingredient_names: ["Yogurt griego", "Fresas", "Almendras"],
      },
      {
        name: "Salmón al horno con camote",
        emoji: "🐟",
        dish_type: "prep",
        classification: "saludable",
        preparation: "Hornear salmón 15 min con camote y espinaca salteada.",
        prep_minutes: 30,
        servings: 2,
        ingredient_names: ["Salmón", "Camote", "Espinaca", "Aceite de oliva"],
      },
      {
        name: "Pasta con carne molida",
        emoji: "🍝",
        dish_type: "prep",
        classification: "saludable",
        preparation: "Cocer pasta, dorar carne con jitomate y servir.",
        prep_minutes: 25,
        servings: 2,
        ingredient_names: ["Pasta integral", "Carne molida magra", "Jitomate"],
      },
      {
        name: "Tacos de pollo",
        emoji: "🌮",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Pollo a la plancha en tortillas con aguacate y pico.",
        prep_minutes: 15,
        servings: 1,
        ingredient_names: ["Pechuga de pollo", "Tortilla de maíz", "Aguacate", "Jitomate"],
      },
      {
        name: "Snack de manzana",
        emoji: "🍎",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Manzana en rebanadas con almendras.",
        prep_minutes: 2,
        servings: 1,
        ingredient_names: ["Manzana", "Almendras"],
      },
      {
        name: "Bowl de queso y verduras",
        emoji: "🥗",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Servir queso panela en cubos con verduras frescas.",
        prep_minutes: 5,
        servings: 1,
        ingredient_names: ["Queso panela", "Jitomate", "Pepino", "Aceite de oliva"],
      },
    ],
    rewards: [
      { name: "Cena en restaurante favorito", emoji: "🍽️", cost: 600, category: "food" },
      { name: "Postre del fin de semana", emoji: "🍰", cost: 200, category: "food" },
      { name: "Comprar utensilio nuevo de cocina", emoji: "🍳", cost: 400, category: "gear" },
    ],
  },
  {
    id: "identidad",
    name: "Identidad y Crecimiento",
    emoji: "🎯",
    description: "Hábitos para conectarte contigo y misiones de disciplina interna.",
    habits: [
      { name: "Meditar 10 min", emoji: "🧘", points: 15, frequency: "daily" },
      { name: "Gratitud (3 cosas)", emoji: "🙏", points: 10, frequency: "daily" },
      { name: "Visualización de futuro", emoji: "🔮", points: 10, frequency: "daily" },
      { name: "Revisar valores y visión", emoji: "🌟", points: 20, frequency: "weekly" },
    ],
    tasks: [
      { title: "Escribir mi misión personal", priority: "high" },
      { title: "Definir 5 valores principales", priority: "high" },
      { title: "Carta a mi yo del próximo año", priority: "medium" },
    ],
    rewards: [
      { name: "Retiro de fin de semana", emoji: "🏞️", cost: 1500, category: "experience" },
      { name: "Sesión con coach", emoji: "🧠", cost: 700, category: "growth" },
    ],
  },
  {
    id: "finanzas",
    name: "Finanzas",
    emoji: "💰",
    description: "Hábitos y misiones para mejorar tu salud financiera.",
    habits: [
      { name: "Registrar gastos del día", emoji: "📊", points: 10, frequency: "daily" },
      { name: "Revisar presupuesto", emoji: "💳", points: 15, frequency: "weekly" },
      { name: "Aportar a ahorro", emoji: "🐷", points: 30, frequency: "weekly" },
      { name: "Revisión financiera mensual", emoji: "📈", points: 50, frequency: "monthly" },
    ],
    rewards: [
      { name: "Capricho mensual", emoji: "🎁", cost: 300, category: "treat" },
      { name: "Inversión en mí", emoji: "📚", cost: 500, category: "growth" },
      { name: "Experiencia (cine, museo)", emoji: "🎬", cost: 250, category: "experience" },
    ],
    quests: [
      { title: "0 gastos hormiga esta semana", emoji: "🐜", xp: 150, target: 7, scope: "weekly" },
      { title: "Ahorrar 10% de ingresos del mes", emoji: "💵", xp: 400, target: 1, scope: "monthly" },
    ],
  },
  {
    id: "hogar",
    name: "Hogar",
    emoji: "🏠",
    description: "Tareas recurrentes para mantener la casa al día.",
    tasks: [
      { title: "Lavar trastes", priority: "medium", tags: ["hogar", "diario"] },
      { title: "Sacar la basura", priority: "medium", tags: ["hogar"] },
      { title: "Tender la cama", priority: "low", tags: ["hogar", "diario"] },
      { title: "Lavar ropa", priority: "medium", tags: ["hogar", "semanal"] },
      { title: "Aspirar / barrer", priority: "medium", tags: ["hogar", "semanal"] },
      { title: "Trapear", priority: "medium", tags: ["hogar", "semanal"] },
      { title: "Limpiar baño", priority: "high", tags: ["hogar", "semanal"] },
      { title: "Sacudir muebles", priority: "low", tags: ["hogar", "semanal"] },
      { title: "Lavar sábanas", priority: "medium", tags: ["hogar", "quincenal"] },
      { title: "Limpieza profunda cocina", priority: "high", tags: ["hogar", "mensual"] },
      { title: "Revisar despensa", priority: "low", tags: ["hogar", "mensual"] },
      { title: "Pagar servicios del mes", priority: "high", tags: ["hogar", "mensual"] },
    ],
  },
  {
    id: "bienestar",
    name: "Bienestar Mental",
    emoji: "🧠",
    description: "Hábitos y misiones para tu salud mental.",
    habits: [
      { name: "Meditación", emoji: "🧘", points: 15, frequency: "daily" },
      { name: "Diario emocional", emoji: "📝", points: 10, frequency: "daily" },
      { name: "Caminar al aire libre", emoji: "🌳", points: 15, frequency: "daily" },
      { name: "Llamar a alguien querido", emoji: "📞", points: 15, frequency: "weekly" },
      { name: "Tiempo sin pantallas (1h)", emoji: "📵", points: 20, frequency: "daily" },
    ],
    rewards: [
      { name: "Día de spa", emoji: "💆", cost: 800, category: "selfcare" },
      { name: "Tarde de hobby", emoji: "🎨", cost: 200, category: "rest" },
      { name: "Naturaleza day", emoji: "🌲", cost: 300, category: "experience" },
    ],
  },
  {
    id: "mounjaro",
    name: "Mounjaro / GLP-1 High Protein",
    emoji: "💉",
    description: "Recetas e ingredientes densos en proteína y fáciles de digerir para quienes usan Mounjaro.",
    ingredients: [
      { name: "Proteína de suero (Whey)", emoji: "🥤", category: "proteina", default_unit: "scoop", default_qty: "1" },
      { name: "Pavo molido magro", emoji: "🦃", category: "proteina", default_unit: "g", default_qty: "150" },
      { name: "Claras de huevo", emoji: "🍳", category: "proteina", default_unit: "ml", default_qty: "100" },
      { name: "Tofu extra firme", emoji: "🧊", category: "proteina", default_unit: "g", default_qty: "150" },
      { name: "Semillas de chía", emoji: "🌱", category: "grasa", default_unit: "g", default_qty: "15" },
    ],
    dishes: [
      {
        name: "Batido Pro-Mounjaro",
        emoji: "🥤",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Mezclar proteína de suero, agua o leche ligera y semillas de chía. Ideal para cuando tienes poca hambre.",
        prep_minutes: 2,
        servings: 1,
        ingredient_names: ["Proteína de suero (Whey)", "Semillas de chía"],
      },
      {
        name: "Omelette de claras y pavo",
        emoji: "🍳",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Cocinar claras con pavo molido. Alto volumen, baja grasa y mucha proteína.",
        prep_minutes: 10,
        servings: 1,
        ingredient_names: ["Claras de huevo", "Pavo molido magro", "Espinaca"],
      },
      {
        name: "Tofu salteado ligero",
        emoji: "🥘",
        dish_type: "quick",
        classification: "saludable",
        preparation: "Saltear cubos de tofu con brócoli y una gota de aceite de oliva.",
        prep_minutes: 12,
        servings: 1,
        ingredient_names: ["Tofu extra firme", "Brócoli", "Aceite de oliva"],
      },
    ],
    habits: [
      { name: "Priorizar proteína (30g+)", emoji: "🥩", points: 20, frequency: "daily" },
      { name: "Beber electrolitos", emoji: "⚡", points: 10, frequency: "daily" },
      { name: "Caminata post-comida", emoji: "🚶", points: 15, frequency: "daily" },
    ],
  },
  {
    id: "entretenimiento",
    name: "Cultura y Ocio (Series/Libros)",
    emoji: "🎬",
    description: "Misiones de consumo cultural: series, películas y libros esenciales.",
    tasks: [
      { title: "Ver: Succession (HBO)", description: "Drama empresarial de alto nivel.", priority: "medium", tags: ["serie", "imperdible"] },
      { title: "Ver: The Bear (Disney+)", description: "Intensidad culinaria y ansiedad.", priority: "medium", tags: ["serie"] },
      { title: "Ver: Dune Part Two", description: "Cine épico de ciencia ficción.", priority: "low", tags: ["película"] },
      { title: "Leer: Hábitos Atómicos", description: "El clásico de James Clear para este sistema.", priority: "high", tags: ["libro", "productividad"] },
    ],
  },
  {
    id: "historia_cultura",
    name: "Explorador de la Historia",
    emoji: "📜",
    description: "Paquete para entusiastas de la historia, lectura y cultura general.",
    habits: [
      { name: "Leer 20 páginas de historia", emoji: "📖", points: 20, frequency: "daily" },
      { name: "Ver documental histórico", emoji: "🎥", points: 30, frequency: "weekly" },
    ],
    quests: [
      { title: "Terminar una biografía", emoji: "👤", xp: 500, target: 1, scope: "monthly" },
      { title: "Visitar un museo o sitio histórico", emoji: "🏛️", xp: 1000, target: 1, scope: "monthly" },
    ],
    fixed_missions: [
      { title: "Historiador Novel", description: "Lee 5 libros de historia", emoji: "📜", xp_reward: 500 },
      { title: "Cronista del Tiempo", description: "Completa 10 documentales", emoji: "⏳", xp_reward: 800 },
    ],
    skills: [
      {
        id: "skill-historia",
        name: "Historia y Cultura",
        icon: "📜",
        description: "Exploración de eventos históricos y biografías.",
        color: "from-amber-600 to-orange-700",
        subCategories: [
          {
            name: "Investigación",
            skills: [
              { id: "skill-inv-bio", name: "Investigación Biográfica" },
              { id: "skill-novela-hist", name: "Análisis de Novela Histórica" },
              { id: "skill-archivos", name: "Búsqueda en Archivos" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "maestro_profesional",
    name: "Maestro Profesional",
    emoji: "💼",
    description: "Habilidades y retos para freelancers y emprendedores.",
    habits: [
      { name: "Follow-up con 3 clientes", emoji: "📧", points: 25, frequency: "daily" },
      { name: "Actualizar portafolio", emoji: "🎨", points: 40, frequency: "weekly" },
      { name: "Networking (1 café/llamada)", emoji: "☕", points: 50, frequency: "weekly" },
    ],
    tasks: [
      { title: "Revisar contratos pendientes", priority: "high", tags: ["legal"] },
      { title: "Optimizar perfil de LinkedIn", priority: "medium", tags: ["branding"] },
      { title: "Planear contenido del mes", priority: "medium", tags: ["marketing"] },
    ],
    quests: [
      { title: "Cerrar un nuevo proyecto", emoji: "🤝", xp: 2000, target: 1, scope: "monthly" },
      { title: "Enviar 5 propuestas", emoji: "📄", xp: 800, target: 5, scope: "weekly" },
    ],
    fixed_missions: [
      { title: "Freelancer Elite", description: "Completa 5 proyectos con éxito", emoji: "💎", xp_reward: 1500 },
      { title: "Networking King", description: "Realiza 20 conexiones nuevas", emoji: "👑", xp_reward: 1000 },
    ],
    skills: [
      {
        id: "skill-profesional",
        name: "Desarrollo Profesional",
        icon: "💼",
        description: "Habilidades para el éxito en proyectos y freelance.",
        color: "from-blue-500 to-indigo-600",
        subCategories: [
          {
            name: "Gestión",
            skills: [
              { id: "skill-clientes", name: "Gestión de Clientes" },
              { id: "skill-propuestas", name: "Elaboración de Propuestas" },
              { id: "skill-branding", name: "Diseño de Identidad" },
              { id: "skill-negotiation", name: "Negociación" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "guardian_bienestar",
    name: "Guardián del Bienestar",
    emoji: "🧘",
    description: "Pack integral para salud física, mental y espiritual.",
    habits: [
      { name: "Tomar mis medicamentos", emoji: "💊", points: 15, frequency: "daily" },
      { name: "Diario de síntomas", emoji: "📝", points: 10, frequency: "daily" },
      { name: "15 min de estiramiento", emoji: "🧘", points: 15, frequency: "daily" },
    ],
    quests: [
      { title: "Semana sin azúcar refinada", emoji: "🚫", xp: 1200, target: 7, scope: "weekly" },
      { title: "Ir a revisión médica", emoji: "🏥", xp: 1500, target: 1, scope: "monthly" },
    ],
    fixed_missions: [
      { title: "Vigor Vital", description: "Mantén todos tus hábitos de salud por 30 días", emoji: "🔋", xp_reward: 2000 },
      { title: "Mente en Calma", description: "Completa 10 sesiones de meditación", emoji: "✨", xp_reward: 1000 },
    ],
    skills: [
      {
        id: "skill-bienestar",
        name: "Bienestar y Salud",
        icon: "💊",
        description: "Seguimiento médico y autocuidado personal.",
        color: "from-emerald-500 to-teal-600",
        subCategories: [
          {
            name: "Salud",
            skills: [
              { id: "skill-meds", name: "Gestión de Medicación" },
              { id: "skill-care", name: "Autocuidado" },
              { id: "skill-nutrition", name: "Nutrición Consciente" },
              { id: "skill-sleep", name: "Optimización del Sueño" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "explorador_digital",
    name: "Explorador Digital",
    emoji: "🌐",
    description: "Domina el mundo digital: desde ciberseguridad hasta creación de contenido.",
    habits: [
      { name: "Limpieza de inbox", emoji: "📥", points: 15, frequency: "daily" },
      { name: "Backup de archivos", emoji: "💾", points: 50, frequency: "weekly" },
      { name: "Aprender algo técnico (30m)", emoji: "💻", points: 30, frequency: "daily" },
    ],
    tasks: [
      { title: "Cambiar contraseñas críticas", priority: "high", tags: ["seguridad"] },
      { title: "Configurar 2FA en cuentas", priority: "high", tags: ["seguridad"] },
      { title: "Organizar Google Drive / Dropbox", priority: "medium", tags: ["organización"] },
    ],
    quests: [
      { title: "Publicar un artículo técnico", emoji: "✍️", xp: 1500, target: 1, scope: "monthly" },
      { title: "Completar un curso online", emoji: "🎓", xp: 3000, target: 1, scope: "monthly" },
    ],
    fixed_missions: [
      { title: "Ciber-Guardián", description: "Asegura todas tus cuentas principales", emoji: "🛡️", xp_reward: 1000 },
      { title: "Arquitecto de Datos", description: "Organiza todo tu ecosistema digital", emoji: "📁", xp_reward: 1200 },
    ],
    skills: [
      {
        id: "skill-digital",
        name: "Tecnología y Digital",
        icon: "💻",
        description: "Habilidades para navegar y crear en la era digital.",
        color: "from-purple-500 to-pink-600",
        subCategories: [
          {
            name: "Seguridad",
            skills: [
              { id: "skill-ciberseg", name: "Ciberseguridad Básica" },
              { id: "skill-2fa", name: "Gestión de Identidad" },
            ],
          },
          {
            name: "Creación",
            skills: [
              { id: "skill-code", name: "Programación / No-code" },
              { id: "skill-content", name: "Creación de Contenido" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "familia_amigos",
    name: "Conexión Social",
    emoji: "🤝",
    description: "Hábitos para fortalecer tus lazos con familia y amigos.",
    habits: [
      { name: "Llamar a un familiar", emoji: "📞", points: 20, frequency: "weekly" },
      { name: "Mensaje de aprecio a un amigo", emoji: "✉️", points: 10, frequency: "daily" },
      { name: "Tiempo de calidad sin pantallas", emoji: "📵", points: 25, frequency: "daily" },
      { name: "Planear salida social", emoji: "🗓️", points: 15, frequency: "weekly" },
    ],
    tasks: [
      { title: "Agendar cena familiar", priority: "high", tags: ["familia"] },
      { title: "Visitar a los abuelos/padres", priority: "medium", tags: ["familia"] },
      { title: "Organizar café con un amigo", priority: "medium", tags: ["social"] },
    ],
    rewards: [
      { name: "Cena especial con pareja/amigos", emoji: "🍷", cost: 600, category: "experience" },
      { name: "Entradas para cine/teatro", emoji: "🎟️", cost: 300, category: "experience" },
    ],
  },
  {
    id: "espiritualidad",
    name: "Espiritualidad y Paz",
    emoji: "✨",
    description: "Hábitos para conectar con tu interior y encontrar calma.",
    habits: [
      { name: "Meditación profunda", emoji: "🧘", points: 20, frequency: "daily" },
      { name: "Oración o reflexión", emoji: "🙏", points: 15, frequency: "daily" },
      { name: "Lectura espiritual/filosófica", emoji: "📖", points: 15, frequency: "daily" },
      { name: "Caminata contemplativa", emoji: "🚶", points: 15, frequency: "daily" },
    ],
    tasks: [
      { title: "Asistir a servicio o grupo", priority: "medium", tags: ["espiritual"] },
      { title: "Escribir en diario de reflexión", priority: "medium" },
    ],
  },
  {
    id: "social_deep",
    name: "Social & Networking",
    emoji: "🤝",
    description: "Para los que buscan conexiones de alto valor y presencia.",
    habits: [
      { name: "Seguimiento a 3 contactos clave", emoji: "📞", points: 30, frequency: "weekly" },
      { name: "Publicar insight en LinkedIn/Twitter", emoji: "💡", points: 40, frequency: "daily" },
      { name: "Asistir a 1 evento o café de networking", emoji: "☕", points: 100, frequency: "weekly" },
    ],
    tasks: [
      { title: "Actualizar bio y perfiles", priority: "medium", tags: ["marca personal"] },
      { title: "Investigar 5 personas que admiro", priority: "low" },
    ],
  },
  {
    id: "digital_minimalism",
    name: "Minimalismo Digital",
    emoji: "📵",
    description: "Recupera tu atención y tiempo.",
    habits: [
      { name: "Mañana sin notificaciones (hasta 10am)", emoji: "🤫", points: 25, frequency: "daily" },
      { name: "Limpiar fotos/archivos basura", emoji: "🧹", points: 15, frequency: "daily" },
      { name: "Domingo analógico (0 pantallas)", emoji: "🌳", points: 150, frequency: "weekly" },
    ],
    tasks: [
      { title: "Desinstalar apps que no uso", priority: "medium" },
      { title: "Organizar carpetas en Cloud", priority: "low" },
    ],
  },
];
