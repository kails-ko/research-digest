/**
 * The journals this feed follows.
 *
 * `id` is the OpenAlex Source ID. Every one of these was resolved against
 * https://api.openalex.org/sources and matched the intended journal exactly —
 * if you add a journal, look its ID up the same way rather than guessing:
 *
 *   curl "https://api.openalex.org/sources?search=Journal+Name&select=id,display_name,issn_l"
 *
 * `short` is what shows on a card when the full name is too long for one line.
 */

export type Journal = {
  id: string;
  name: string;
  short: string;
  issn: string;
};

export const JOURNALS: Journal[] = [
  { id: "S108595589", name: "Journal of Clinical Child & Adolescent Psychology", short: "JCCAP", issn: "1537-4416" },
  { id: "S60711021", name: "Journal of the American Academy of Child & Adolescent Psychiatry", short: "JAACAP", issn: "0890-8567" },
  { id: "S118719888", name: "Journal of Consulting and Clinical Psychology", short: "JCCP", issn: "0022-006X" },
  { id: "S87914957", name: "Journal of Child and Family Studies", short: "JCFS", issn: "1062-1024" },
  { id: "S56240272", name: "Behavior Therapy", short: "Behavior Therapy", issn: "0005-7894" },
  { id: "S10873304", name: "Children and Youth Services Review", short: "CYSR", issn: "0190-7409" },
  { id: "S183721526", name: "Prevention Science", short: "Prevention Science", issn: "1389-4986" },
  { id: "S983763965", name: "Journal of Marital and Family Therapy", short: "JMFT", issn: "0194-472X" },
  { id: "S58220144", name: "Research on Child and Adolescent Psychopathology", short: "RCAP", issn: "0091-0627" },
  { id: "S177929781", name: "Journal of Child Psychology and Psychiatry", short: "JCPP", issn: "0021-9630" },
  { id: "S109723506", name: "Child Development", short: "Child Development", issn: "0009-3920" },
  { id: "S80146597", name: "American Psychologist", short: "American Psychologist", issn: "0003-066X" },
  { id: "S4019948", name: "Journal of Attention Disorders", short: "J Attention Disorders", issn: "1087-0547" },
  { id: "S135831435", name: "Journal of Counseling Psychology", short: "JCP", issn: "0022-0167" },
  { id: "S75230894", name: "Cognitive and Behavioral Practice", short: "CBP", issn: "1077-7229" },
  { id: "S10577759", name: "Clinical Child and Family Psychology Review", short: "CCFPR", issn: "1096-4037" },
  { id: "S13068289", name: "Cultural Diversity & Ethnic Minority Psychology", short: "CDEMP", issn: "1077-341X" },
  { id: "S6115874", name: "Development and Psychopathology", short: "Dev & Psychopathology", issn: "0954-5794" },
  { id: "S159275680", name: "European Child & Adolescent Psychiatry", short: "ECAP", issn: "1018-8827" },
  { id: "S104827148", name: "The Counseling Psychologist", short: "The Counseling Psychologist", issn: "0011-0000" },
  { id: "S50147421", name: "Journal of Family Psychology", short: "JFP", issn: "0893-3200" },
  { id: "S137373642", name: "Child Psychiatry & Human Development", short: "CPHD", issn: "0009-398X" },
  { id: "S186589312", name: "Behaviour Research and Therapy", short: "BRAT", issn: "0005-7967" },
];

export const JOURNALS_BY_ID = new Map(JOURNALS.map((j) => [j.id, j]));
