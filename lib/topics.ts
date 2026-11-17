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
    name: "Conditions & presenting problems",
    accent: "light-blue",
    topics: [
      { id: "T10537", label: "ADHD", openAlexName: "Attention Deficit Hyperactivity Disorder" },
      { id: "T10853", label: "Anxiety & depression", openAlexName: "Anxiety, Depression, Psychometrics, Treatment, Cognitive Processes" },
      { id: "T10106", label: "Autism", openAlexName: "Autism Spectrum Disorder Research" },
      { id: "T10426", label: "Abuse & maltreatment", openAlexName: "Child Abuse and Trauma" },
      { id: "T10242", label: "PTSD", openAlexName: "Posttraumatic Stress Disorder Research" },
      { id: "T10376", label: "Suicide & self-harm", openAlexName: "Suicide and Self-Harm Studies" },
      { id: "T11123", label: "OCD", openAlexName: "Obsessive-Compulsive Spectrum Disorders" },
      { id: "T10263", label: "Eating disorders", openAlexName: "Eating Disorders and Behaviors" },
      { id: "T10043", label: "Substance use", openAlexName: "Substance Abuse Treatment and Outcomes" },
      { id: "T10485", label: "Bullying & aggression", openAlexName: "Bullying, Victimization, and Aggression" },
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
    name: "Family & caregiving",
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
        // T10762 carries almost all of it in these journals (196 works over two
        // years); T10216 adds the refugee and integration work (21).
        topics: ["T10762", "T10216"],
        keywords: [],
      },
      {
        // 4. Acculturation. No OpenAlex Topic covers it — searching topics for
        // "acculturation" returns racial identity and expatriate research — but
        // it is a real keyword in these journals, just below the frequency
        // cutoff that the "Hot this month" list uses.
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
    name: "Treatment, services, & prevention",
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
        // Both spellings; OpenAlex normalizes most to the American one.
        keywords: ["cognitive behavioral therapy", "cognitive behavioural therapy"],
      },
      { id: "T10272", label: "Access to care", openAlexName: "Mental Health Treatment and Access" },
      { id: "T11519", label: "Digital interventions", openAlexName: "Digital Mental Health Interventions" },
      { id: "T10629", label: "Implementation & policy", openAlexName: "Health Policy Implementation Science" },
      { id: "T10708", label: "Mindfulness", openAlexName: "Mindfulness and Compassion Interventions" },
      { id: "T11295", label: "Counseling & supervision", openAlexName: "Counseling Practices and Supervision" },
      { id: "T11028", label: "Social work practice", openAlexName: "Social Work Education and Practice" },
    ],
  },
  {
    name: "Development, school, & context",
    accent: "amber",
    topics: [
      { id: "T10182", label: "Child & adolescent development", openAlexName: "Child and Adolescent Psychosocial and Emotional Development" },
      { id: "T13521", label: "Psychosocial factors in youth", openAlexName: "Psychosocial Factors Impacting Youth" },
      { id: "T10589", label: "Early childhood education", openAlexName: "Early Childhood Education and Development" },
      { id: "T10355", label: "Teens & technology", openAlexName: "Impact of Technology on Adolescents" },
      { id: "T12060", label: "Kids & digital media", openAlexName: "Child Development and Digital Technology" },
      { id: "T10730", label: "Language development", openAlexName: "Language Development and Disorders" },
      { id: "T12831", label: "School health", openAlexName: "School Health and Nursing Education" },
      { id: "T11761", label: "Resilience", openAlexName: "Resilience and Mental Health" },
      {
        id: "kw:emotion-regulation",
        label: "Emotion regulation",
        openAlexName: 'OpenAlex keywords: "emotion regulation", "emotional dysregulation"',
        kind: "keyword",
        keywords: [
          "emotion regulation",
          "emotional dysregulation",
          // Variants below the top-200 cutoff when this was checked, so they
          // are included defensively — harmless if OpenAlex never uses them.
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
      {
        id: "kw:trajectories",
        label: "Developmental trajectories",
        openAlexName: 'OpenAlex keyword: "developmental trajectories"',
        kind: "keyword",
        keywords: ["developmental trajectories", "developmental trajectory"],
      },
      { id: "T14104", label: "Neuropsychology", openAlexName: "Developmental and Educational Neuropsychology" },
      { id: "T10467", label: "Psychometrics", openAlexName: "Psychometric Methodologies and Testing" },
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
    label: "Parent training for ADHD",
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

