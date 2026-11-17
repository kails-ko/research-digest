/**
 * The click-to-filter taxonomy — this feed's answer to "type a keyword."
 *
 * Two layers, both clickable, neither requiring you to guess a search term:
 *
 *   1. TOPIC_GROUPS — OpenAlex Topics. OpenAlex classifies every work into a
 *      fixed taxonomy of ~4,500 topics, so these are exact, stable matches
 *      rather than string matching: an article about ADHD is tagged T10537
 *      whether or not it says "ADHD" anywhere in its title. The topics below
 *      were not invented — they are the topics that actually occur in these
 *      23 journals, pulled from a group_by over the last 12 months, so every
 *      chip is one a real article has carried.
 *
 *   2. Auto-suggested chips — not defined here. The app reads the OpenAlex
 *      `keywords` on whatever articles came back this month and offers the
 *      most frequent ones as chips, so the vocabulary refreshes itself.
 *
 * To add a topic chip, find its ID:
 *   curl "https://api.openalex.org/topics?search=your+topic&select=id,display_name"
 */

/**
 * A chip is one of two things, and the `kind` says which:
 *
 *  - "topic"   — an OpenAlex Topic ID. Exact, and independent of wording: an
 *                article is tagged T10537 whether or not it says "ADHD".
 *  - "keyword" — one or more OpenAlex *keyword* strings. Some things this feed
 *                cares about have no Topic at all (OpenAlex has no topic for
 *                parent training, CBT, or parenting), but they do appear as
 *                keywords. These chips match those strings exactly, so they
 *                are only as good as the keywords publishers supply — a paper
 *                about CBT that OpenAlex never tagged "cognitive behavioral
 *                therapy" will not match.
 */
export type TopicChip = {
  /** Topic ID ("T10537") for a topic chip, or a "kw:" id for a keyword chip. */
  id: string;
  /** Short label for the chip. The OpenAlex display name is often long. */
  label: string;
  /** What this maps to in OpenAlex, shown on hover so the mapping stays honest. */
  openAlexName: string;
  kind?: "topic" | "keyword";
  /** For a keyword chip: the exact OpenAlex keyword strings it matches. */
  keywords?: string[];
  /**
   * Extra OpenAlex Topic IDs to match as well. Lets one chip combine the
   * precision of a Topic with the reach of a keyword — "Depression" is both
   * the Treatment-of-Depression topic and the depression keywords.
   */
  topics?: string[];
};

export type TopicGroup = {
  name: string;
  /** One of the brand's chart/card extension colors — see brand kit README. */
  accent: "light-blue" | "pistachio" | "blush" | "pink" | "amber";
  topics: TopicChip[];
};

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    name: "Diagnoses & clinical concerns",
    accent: "light-blue",
    topics: [
      { id: "T10537", label: "ADHD", openAlexName: "Attention Deficit Hyperactivity Disorder" },
      {
        // Split from the old "Anxiety & depression" chip. T10853 leads with
        // anxiety ("Anxiety, Depression, Psychometrics…"), so it anchors this
        // one while Depression keeps the treatment topic plus its keywords.
        id: "kw:anxiety",
        label: "Anxiety",
        openAlexName: 'OpenAlex topic "Anxiety, Depression, Psychometrics, Treatment, Cognitive Processes" plus the anxiety keywords',
        kind: "keyword",
        topics: ["T10853"],
        keywords: [
          "anxiety",
          "anxiety disorders",
          "anxiety symptoms",
          "childhood anxiety",
          "social anxiety",
          "separation anxiety",
          "generalized anxiety disorder",
        ],
      },
      {
        id: "kw:depression",
        label: "Depression",
        openAlexName:
          'OpenAlex topic "Treatment of Major Depression" plus the depression keywords',
        kind: "keyword",
        // The topic alone is specifically about *treatment*, so the keywords
        // widen it to depression generally, which is what the label promises.
        topics: ["T11071"],
        keywords: [
          "depression",
          "depressive symptoms",
          "adolescent depression",
          "major depressive disorder",
          "maternal depression",
        ],
      },
      {
        // ODD, CD, and the traits that travel with them. OpenAlex has no topic
        // for disruptive behaviour — searching returns only the general child
        // development topic — so this is keyword-only.
        id: "kw:disruptive",
        label: "Disruptive behaviours",
        openAlexName:
          'OpenAlex keywords: "oppositional defiant disorder", "conduct disorder", "conduct problems", "disruptive behavior", "callous-unemotional traits", "antisocial behavior"',
        kind: "keyword",
        // Deliberately excludes "externalizing problems" (406 uses, but a broad
        // dimension rather than these disorders) and "aggression" (already its
        // own chip below). Add them here if you want the wider read.
        keywords: [
          "oppositional defiant disorder",
          "conduct disorder",
          "conduct problems",
          "disruptive behavior",
          "disruptive behavior disorders",
          "callous-unemotional traits",
          "antisocial behavior",
        ],
      },
      { id: "T10106", label: "Autism", openAlexName: "Autism Spectrum Disorder Research" },
      { id: "T10426", label: "Abuse & maltreatment", openAlexName: "Child Abuse and Trauma" },
      { id: "T10242", label: "PTSD", openAlexName: "Posttraumatic Stress Disorder Research" },
      { id: "T10376", label: "Suicide & self-harm", openAlexName: "Suicide and Self-Harm Studies" },
      { id: "T11123", label: "OCD", openAlexName: "Obsessive-Compulsive Spectrum Disorders" },
      { id: "T10263", label: "Eating disorders", openAlexName: "Eating Disorders and Behaviors" },
      { id: "T10043", label: "Substance use", openAlexName: "Substance Abuse Treatment and Outcomes" },
      { id: "T10485", label: "Bullying & aggression", openAlexName: "Bullying, Victimization, and Aggression" },
      { id: "T10316", label: "Sleep", openAlexName: "Sleep and related disorders" },
      {
        id: "kw:aces",
        label: "Adverse childhood experiences",
        openAlexName: 'OpenAlex keyword: "adverse childhood experiences"',
        kind: "keyword",
        keywords: ["adverse childhood experiences", "aces"],
      },
      {
        id: "kw:comorbidity",
        label: "Comorbidity",
        openAlexName: 'OpenAlex keywords: "comorbidities", "psychiatric comorbidity"',
        kind: "keyword",
        keywords: ["comorbidities", "psychiatric comorbidity", "comorbidity"],
      },
    ],
  },
  {
    name: "Family & parenting",
    accent: "blush",
    topics: [
      { id: "T10585", label: "Family dynamics", openAlexName: "Family Dynamics and Relationships" },
      { id: "T10677", label: "Attachment", openAlexName: "Attachment and Relationship Dynamics" },
      { id: "T11380", label: "Child welfare & adoption", openAlexName: "Child Welfare and Adoption" },
      { id: "T10786", label: "Perinatal & maternal MH", openAlexName: "Maternal Mental Health During Pregnancy and Postpartum" },
      { id: "T11632", label: "Disability & family support", openAlexName: "Family and Disability Support Research" },
      { id: "T10380", label: "Family & partner violence", openAlexName: "Intimate Partner and Family Violence" },
      { id: "T12245", label: "Family therapy", openAlexName: "Counseling, Therapy, and Family Dynamics" },
      {
        id: "kw:parenting",
        label: "Parenting",
        openAlexName: 'OpenAlex keywords: "parenting", "parenting support", "parenting practices", "parenting styles"',
        kind: "keyword",
        // Deliberately the parenting-behaviour cluster. It leaves out
        // "parental stress" and "parental mental health" (those are about the
        // parent's own wellbeing) and "parent-child relationship" /
        // "parent-child interaction" (relationship quality). Add them here if
        // you want the wider read.
        keywords: ["parenting", "parenting support", "parenting practices", "parenting styles"],
      },
      { id: "T13393", label: "Feeding & nutrition", openAlexName: "Child Nutrition and Feeding Issues" },
    ],
  },
  {
    name: "Identity, culture, & equity",
    accent: "pink",
    topics: [
      { id: "T10652", label: "Racial & ethnic identity", openAlexName: "Racial and Ethnic Identity Research" },
      { id: "T10156", label: "LGBTQ+", openAlexName: "LGBTQ Health, Identity, and Policy" },
      {
        id: "kw:immigration",
        label: "Immigration",
        openAlexName:
          'OpenAlex topics "Migration, Health and Trauma" and "Migration, Refugees, and Integration"',
        kind: "keyword",
        topics: ["T10762", "T10216"],
        keywords: [],
      },
      {
        id: "kw:acculturation",
        label: "Acculturation",
        openAlexName: 'OpenAlex keywords: "acculturation", "acculturation gap", "cultural adaptation"',
        kind: "keyword",
        keywords: ["acculturation", "acculturation gap", "cultural adaptation"],
      },
      { id: "T10314", label: "Intergroup psychology", openAlexName: "Social and Intergroup Psychology" },
      { id: "T13101", label: "Justice & legal systems", openAlexName: "Legal and Social Justice Studies" },
      {
        id: "kw:sex-gender",
        label: "Sex & gender differences",
        openAlexName: 'OpenAlex keywords: "sex differences", "gender differences"',
        kind: "keyword",
        keywords: ["sex differences", "gender differences", "sex and gender differences"],
      },
    ],
  },
  {
    // What you do with a client, kept apart from how care is organised — they
    // are different literatures you would search on different days.
    name: "Interventions",
    accent: "pistachio",
    topics: [
      { id: "T10214", label: "Psychotherapy", openAlexName: "Psychotherapy Techniques and Applications" },
      { id: "T13143", label: "Child & family therapy", openAlexName: "Child Therapy and Development" },
      {
        id: "kw:parent-training",
        label: "Parent training",
        openAlexName: 'OpenAlex keyword: "parent training"',
        kind: "keyword",
        keywords: ["parent training"],
      },
      {
        id: "kw:cbt",
        label: "CBT",
        openAlexName: 'OpenAlex keyword: "cognitive behavioral therapy"',
        kind: "keyword",
        keywords: ["cognitive behavioral therapy", "cognitive behavioural therapy"],
      },
      { id: "T11519", label: "Digital interventions", openAlexName: "Digital Mental Health Interventions" },
      { id: "T10708", label: "Mindfulness", openAlexName: "Mindfulness and Compassion Interventions" },
      {
        // Counts in brackets are uses across these 34 journals over two years.
        id: "kw:early-intervention",
        label: "Early intervention",
        openAlexName: 'OpenAlex keyword: "early intervention" (158)',
        kind: "keyword",
        keywords: ["early intervention", "early childhood intervention"],
      },
      {
        id: "kw:school-based",
        label: "School-based intervention",
        openAlexName: 'OpenAlex keyword: "school-based intervention" (88)',
        kind: "keyword",
        keywords: ["school-based intervention", "school-based program", "school-based prevention"],
      },
      {
        id: "kw:psychoeducation",
        label: "Psychoeducation",
        openAlexName: 'OpenAlex keyword: "psychoeducation" (67)',
        kind: "keyword",
        keywords: ["psychoeducation"],
      },
      {
        id: "kw:exposure",
        label: "Exposure therapy",
        openAlexName: 'OpenAlex keyword: "exposure therapy" (64)',
        kind: "keyword",
        keywords: ["exposure therapy", "exposure and response prevention"],
      },
      {
        id: "kw:medication",
        label: "Medication",
        openAlexName: 'OpenAlex keyword: "pharmacotherapy" (58)',
        kind: "keyword",
        keywords: ["pharmacotherapy", "psychopharmacology", "stimulant medication", "methylphenidate"],
      },
      {
        id: "kw:dbt",
        label: "DBT",
        openAlexName: 'OpenAlex keyword: "dialectical behavior therapy" (42)',
        kind: "keyword",
        keywords: ["dialectical behavior therapy", "dialectical behaviour therapy"],
      },
    ],
  },
  {
    name: "Services, systems, & prevention",
    accent: "amber",
    topics: [
      { id: "T10272", label: "Access to care", openAlexName: "Mental Health Treatment and Access" },
      { id: "T10629", label: "Implementation & policy", openAlexName: "Health Policy Implementation Science" },
      { id: "T11295", label: "Counseling & supervision", openAlexName: "Counseling Practices and Supervision" },
      { id: "T11028", label: "Social work practice", openAlexName: "Social Work Education and Practice" },
    ],
  },
  {
    name: "Child Development",
    accent: "light-blue",
    topics: [
      { id: "T10182", label: "Child & adolescent development", openAlexName: "Child and Adolescent Psychosocial and Emotional Development" },
      { id: "T13521", label: "Psychosocial factors in youth", openAlexName: "Psychosocial Factors Impacting Youth" },
      { id: "T10589", label: "Early childhood education", openAlexName: "Early Childhood Education and Development" },
      { id: "T10730", label: "Language development", openAlexName: "Language Development and Disorders" },
      { id: "T10355", label: "Teens & technology", openAlexName: "Impact of Technology on Adolescents" },
      { id: "T12060", label: "Kids & digital media", openAlexName: "Child Development and Digital Technology" },
      { id: "T12831", label: "School health", openAlexName: "School Health and Nursing Education" },
      {
        id: "kw:trajectories",
        label: "Developmental trajectories",
        openAlexName: 'OpenAlex keyword: "developmental trajectories"',
        kind: "keyword",
        keywords: ["developmental trajectories", "developmental trajectory"],
      },
    ],
  },
  {
    name: "Emotion, cognition, & coping",
    accent: "blush",
    topics: [
      {
        id: "kw:emotion-regulation",
        label: "Emotion regulation",
        openAlexName: 'OpenAlex keywords: "emotion regulation", "emotional dysregulation"',
        kind: "keyword",
        keywords: [
          "emotion regulation",
          "emotional dysregulation",
          "emotional regulation",
          "emotion dysregulation",
          "emotion regulation difficulties",
        ],
      },
      {
        id: "kw:executive-function",
        label: "Executive function",
        openAlexName: 'OpenAlex keyword: "executive function"',
        kind: "keyword",
        keywords: ["executive function", "executive functioning", "executive functions"],
      },
      { id: "T14104", label: "Neuropsychology", openAlexName: "Developmental and Educational Neuropsychology" },
      { id: "T11761", label: "Resilience", openAlexName: "Resilience and Mental Health" },
      {
        id: "kw:wellbeing",
        label: "Well-being",
        openAlexName: 'OpenAlex keywords: "well-being" (120), "psychological well-being" (66)',
        kind: "keyword",
        keywords: ["well-being", "psychological well-being", "wellbeing", "life satisfaction"],
      },
      {
        id: "kw:self-esteem",
        label: "Self-esteem & self-efficacy",
        openAlexName: 'OpenAlex keywords: "self-esteem" (111), "self-efficacy" (61)',
        kind: "keyword",
        keywords: ["self-esteem", "self-efficacy", "self-concept"],
      },
      {
        id: "kw:coping",
        label: "Coping",
        openAlexName: 'OpenAlex keywords: "coping strategies" (92), "coping" (58)',
        kind: "keyword",
        keywords: ["coping", "coping strategies", "coping skills"],
      },
      {
        id: "kw:social-cognition",
        label: "Social cognition",
        openAlexName: 'OpenAlex keywords: "social cognition" (69), "theory of mind" (47)',
        kind: "keyword",
        keywords: ["social cognition", "theory of mind", "mentalizing"],
      },
    ],
  },
  {
    // Study design and psychometrics. Every chip here was picked from the
    // keywords that actually recur in these 34 journals, with its two-year
    // count noted, rather than from a list of methods that sounded plausible.
    name: "Measurement & methods",
    accent: "pistachio",
    topics: [
      { id: "T10467", label: "Psychometrics", openAlexName: "Psychometric Methodologies and Testing" },
      {
        id: "kw:invariance",
        label: "Measurement invariance",
        openAlexName: 'OpenAlex keyword: "measurement invariance" (146 uses over two years)',
        kind: "keyword",
        keywords: ["measurement invariance", "factorial invariance"],
      },
      {
        id: "kw:validation",
        label: "Scale development & validation",
        openAlexName:
          'OpenAlex keywords: "psychometric properties" (109), "psychometric validation" (100), "scale development" (88)',
        kind: "keyword",
        keywords: [
          "psychometric properties",
          "psychometric validation",
          "scale development",
          "validation",
          "factor structure",
        ],
      },
      {
        id: "kw:latent",
        label: "Latent class & profiles",
        openAlexName: 'OpenAlex keywords: "latent profile analysis" (32), "latent class analysis" (24)',
        kind: "keyword",
        keywords: ["latent profile analysis", "latent class analysis", "mixture modeling"],
      },
      {
        id: "kw:ema",
        label: "Daily diary & EMA",
        openAlexName: 'OpenAlex keyword: "ecological momentary assessment" (120 uses over two years)',
        kind: "keyword",
        keywords: [
          "ecological momentary assessment",
          "experience sampling",
          "daily diary",
          "intensive longitudinal data",
        ],
      },
      {
        id: "kw:network",
        label: "Network analysis",
        openAlexName: 'OpenAlex keyword: "network analysis" (26 uses over two years)',
        kind: "keyword",
        keywords: ["network analysis", "psychological networks"],
      },
      {
        id: "kw:irt",
        label: "Item response theory",
        openAlexName: 'OpenAlex keyword: "item response theory" (15 uses over two years)',
        kind: "keyword",
        keywords: ["item response theory", "rasch model"],
      },
    ],
  },
];

export const ALL_TOPICS = TOPIC_GROUPS.flatMap((g) =>
  g.topics.map((t) => ({ ...t, group: g.name, accent: g.accent })),
);

export const TOPIC_BY_ID = new Map(ALL_TOPICS.map((t) => [t.id, t]));

/** The keyword chips only, for the matcher in lib/filter.ts. */
export const KEYWORD_CHIPS = ALL_TOPICS.filter((t) => t.kind === "keyword");

/* ------------------------------------------------------------------------ */
/* Lenses: saved one-click combinations                                       */
/* ------------------------------------------------------------------------ */

/**
 * A lens is a named standing search — one click applies several chips at once.
 * These are the real replacement for retyping the same query every week.
 * Edit this list freely; it is just data.
 */
export type Lens = {
  id: string;
  label: string;
  blurb: string;
  topics: string[];
};

export const LENSES: Lens[] = [
  {
    id: "adhd-families",
    label: "ADHD & families",
    blurb: "ADHD alongside family process, parenting, attachment, and caregiver support",
    topics: ["T10537", "T10585", "kw:parenting", "T11632", "T10677"],
  },
  {
    id: "parent-training",
    label: "Treatments for ADHD",
    blurb: "ADHD treatment: parent training, psychotherapy, CBT, and digital delivery",
    topics: ["T10537", "kw:parent-training", "T10214", "kw:cbt", "T13143", "T11519"],
  },
  {
    id: "prevention",
    label: "Prevention & implementation",
    blurb: "Prevention, implementation, psychotherapy, and access to care",
    topics: ["T10629", "T10272", "T10589", "T10214"],
  },
  {
    id: "trauma",
    label: "Trauma & child welfare",
    blurb: "Maltreatment, PTSD, family violence, foster care, and adoption",
    topics: ["T10426", "T10242", "T10380", "T11380"],
  },
];

