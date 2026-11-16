/**
 * The click-to-filter taxonomy — this feed's answer to "type a keyword."
 *
 * Three layers, all clickable, none of them requiring you to guess a search term:
 *
 *   1. TOPIC_GROUPS — OpenAlex Topics. OpenAlex classifies every work into a
 *      fixed taxonomy of ~4,500 topics, so these are exact, stable matches
 *      rather than string matching: an article about ADHD is tagged T10537
 *      whether or not it says "ADHD" anywhere in its title. The topics below
 *      were not invented — they are the topics that actually occur in these
 *      23 journals, pulled from a group_by over the last 12 months, so every
 *      chip is one a real article has carried.
 *
 *   2. DESIGN_TAGS — study design, which OpenAlex Topics deliberately do not
 *      encode (a topic is about subject matter, not method). These match
 *      against title + abstract text, but you still click rather than type.
 *
 *   3. Auto-suggested chips — not defined here. The app reads the OpenAlex
 *      `keywords` on whatever articles came back this month and offers the
 *      most frequent ones as chips, so the vocabulary refreshes itself.
 *
 * To add a topic chip, find its ID:
 *   curl "https://api.openalex.org/topics?search=your+topic&select=id,display_name"
 */

export type TopicChip = {
  /** OpenAlex Topic ID, e.g. "T10537" */
  id: string;
  /** Short label for the chip. The OpenAlex display name is often long. */
  label: string;
  /** The OpenAlex display name, shown on hover so the mapping stays honest. */
  openAlexName: string;
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
      { id: "T11123", label: "OCD spectrum", openAlexName: "Obsessive-Compulsive Spectrum Disorders" },
      { id: "T10263", label: "Eating disorders", openAlexName: "Eating Disorders and Behaviors" },
      { id: "T10043", label: "Substance use", openAlexName: "Substance Abuse Treatment and Outcomes" },
      { id: "T10485", label: "Bullying & aggression", openAlexName: "Bullying, Victimization, and Aggression" },
      { id: "T11071", label: "Depression treatment", openAlexName: "Treatment of Major Depression" },
      { id: "T10316", label: "Sleep", openAlexName: "Sleep and related disorders" },
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
      { id: "T13393", label: "Feeding & nutrition", openAlexName: "Child Nutrition and Feeding Issues" },
    ],
  },
  {
    name: "Identity, culture, & equity",
    accent: "pink",
    topics: [
      { id: "T10652", label: "Racial & ethnic identity", openAlexName: "Racial and Ethnic Identity Research" },
      { id: "T10156", label: "LGBTQ+", openAlexName: "LGBTQ Health, Identity, and Policy" },
      { id: "T10762", label: "Migration & trauma", openAlexName: "Migration, Health and Trauma" },
      { id: "T10314", label: "Intergroup psychology", openAlexName: "Social and Intergroup Psychology" },
      { id: "T13101", label: "Justice & legal systems", openAlexName: "Legal and Social Justice Studies" },
    ],
  },
  {
    name: "Treatment, services, & prevention",
    accent: "pistachio",
    topics: [
      { id: "T10214", label: "Psychotherapy", openAlexName: "Psychotherapy Techniques and Applications" },
      { id: "T13143", label: "Child & family therapy", openAlexName: "Child Therapy and Development" },
      { id: "T10272", label: "Access to care", openAlexName: "Mental Health Treatment and Access" },
      { id: "T11519", label: "Digital interventions", openAlexName: "Digital Mental Health Interventions" },
      { id: "T10629", label: "Implementation & policy", openAlexName: "Health Policy Implementation Science" },
      { id: "T10708", label: "Mindfulness", openAlexName: "Mindfulness and Compassion Interventions" },
      { id: "T13944", label: "Services & systems", openAlexName: "Psychiatric care and mental health services" },
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
      { id: "T14104", label: "Neuropsychology", openAlexName: "Developmental and Educational Neuropsychology" },
      { id: "T10467", label: "Psychometrics", openAlexName: "Psychometric Methodologies and Testing" },
    ],
  },
];

export const ALL_TOPICS = TOPIC_GROUPS.flatMap((g) =>
  g.topics.map((t) => ({ ...t, group: g.name, accent: g.accent })),
);

export const TOPIC_BY_ID = new Map(ALL_TOPICS.map((t) => [t.id, t]));

/* ------------------------------------------------------------------------ */
/* Layer 2: study design                                                      */
/* ------------------------------------------------------------------------ */

/**
 * OpenAlex Topics describe *what a paper is about*, never *how it was done* —
 * so design has to come from the text. Each tag is a set of patterns tested
 * against `title + abstract`, lowercased. You still click, never type; the
 * patterns are the app's business, not yours.
 */
export type DesignTag = {
  id: string;
  label: string;
  patterns: RegExp[];
};

export const DESIGN_TAGS: DesignTag[] = [
  {
    id: "rct",
    label: "Randomized trial",
    patterns: [/\brandomi[sz]ed\b/, /\brct\b/, /\brandomly assigned\b/, /\bcontrolled trial\b/],
  },
  {
    id: "synthesis",
    label: "Meta-analysis / review",
    patterns: [/\bmeta-?analy/, /\bsystematic review\b/, /\bscoping review\b/, /\bnarrative review\b/, /\bumbrella review\b/],
  },
  {
    id: "longitudinal",
    label: "Longitudinal",
    patterns: [/\blongitudinal\b/, /\bprospective\b/, /\bfollow-?up\b/, /\bwaves?\b/, /\bcohort\b/, /\bacross time\b/],
  },
  {
    id: "measurement",
    label: "Measurement & validation",
    patterns: [/\bpsychometric/, /\bvalidat/, /\bmeasurement invariance\b/, /\bfactor structure\b/, /\breliability\b/, /\bconfirmatory factor\b/],
  },
  {
    id: "qualitative",
    label: "Qualitative",
    patterns: [/\bqualitative\b/, /\bthematic analysis\b/, /\bfocus groups?\b/, /\bsemi-?structured interview/, /\bgrounded theory\b/, /\bmixed method/],
  },
  {
    id: "pilot",
    label: "Pilot / feasibility",
    patterns: [/\bpilot\b/, /\bfeasibilit/, /\bopen trial\b/, /\bproof of concept\b/, /\bacceptabilit/],
  },
  {
    id: "mechanism",
    label: "Mediation / moderation",
    patterns: [/\bmediat/, /\bmoderat/, /\bindirect effect/, /\bmechanism/],
  },
  {
    id: "person-centered",
    label: "Latent class / profiles",
    patterns: [/\blatent class\b/, /\blatent profile\b/, /\bperson-?centered\b/, /\bmixture model/, /\bnetwork analysis\b/],
  },
];

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
  designs?: string[];
};

export const LENSES: Lens[] = [
  {
    id: "adhd-families",
    label: "ADHD & families",
    blurb: "ADHD work that touches parenting, family process, or caregiver outcomes",
    topics: ["T10537", "T10585", "T11632"],
  },
  {
    id: "parent-training",
    label: "Parent training",
    blurb: "Parent-mediated and behavioral parent training work, and the problems it targets",
    // T13143 is the closest OpenAlex has to a parent-training topic — it is what
    // PCIT, video-feedback, and parent-mediated intervention papers land under.
    // The other three widen it to the family-process and disruptive-behavior
    // work that parent training is usually tested against.
    topics: ["T13143", "T11632", "T10585", "T10485"],
  },
  {
    id: "prevention",
    label: "Prevention & implementation",
    blurb: "School- and community-based prevention, implementation, and access",
    topics: ["T10629", "T10272", "T12831", "T10589"],
  },
  {
    id: "treatment-trials",
    label: "Treatment trials",
    blurb: "Psychotherapy and intervention research tested in a randomized design",
    topics: ["T10214", "T11519", "T10708"],
    designs: ["rct"],
  },
  {
    id: "trauma",
    label: "Trauma & child welfare",
    blurb: "Maltreatment, PTSD, family violence, foster care, and adoption",
    topics: ["T10426", "T10242", "T10380", "T11380"],
  },
  {
    id: "measurement",
    label: "Measurement & methods",
    blurb: "Scale development, invariance testing, and person-centered modeling",
    topics: ["T10467"],
    designs: ["measurement", "person-centered"],
  },
];
