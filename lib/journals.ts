/**
 * The journals this feed follows.
 *
 * `id` is the OpenAlex Source ID. Every one of these was resolved against
 * https://api.openalex.org/sources and matched the intended journal exactly —
 * if you add a journal, look its ID up the same way rather than guessing:
 *
 *   curl "https://api.openalex.org/sources?search=Journal+Name&select=id,display_name,issn_l"
 *
 * Journal names are always written out in full — no acronyms anywhere in the UI.
 */

export type Journal = {
  id: string;
  name: string;
  issn: string;
};

export const JOURNALS: Journal[] = [
  { id: "S108595589", name: "Journal of Clinical Child & Adolescent Psychology", issn: "1537-4416" },
  { id: "S60711021", name: "Journal of the American Academy of Child & Adolescent Psychiatry", issn: "0890-8567" },
  { id: "S118719888", name: "Journal of Consulting and Clinical Psychology", issn: "0022-006X" },
  { id: "S87914957", name: "Journal of Child and Family Studies", issn: "1062-1024" },
  { id: "S56240272", name: "Behavior Therapy", issn: "0005-7894" },
  { id: "S10873304", name: "Children and Youth Services Review", issn: "0190-7409" },
  { id: "S183721526", name: "Prevention Science", issn: "1389-4986" },
  { id: "S983763965", name: "Journal of Marital and Family Therapy", issn: "0194-472X" },
  { id: "S58220144", name: "Research on Child and Adolescent Psychopathology", issn: "0091-0627" },
  { id: "S177929781", name: "Journal of Child Psychology and Psychiatry", issn: "0021-9630" },
  { id: "S109723506", name: "Child Development", issn: "0009-3920" },
  { id: "S80146597", name: "American Psychologist", issn: "0003-066X" },
  { id: "S4019948", name: "Journal of Attention Disorders", issn: "1087-0547" },
  { id: "S135831435", name: "Journal of Counseling Psychology", issn: "0022-0167" },
  { id: "S75230894", name: "Cognitive and Behavioral Practice", issn: "1077-7229" },
  { id: "S10577759", name: "Clinical Child and Family Psychology Review", issn: "1096-4037" },
  { id: "S13068289", name: "Cultural Diversity & Ethnic Minority Psychology", issn: "1077-341X" },
  { id: "S6115874", name: "Development and Psychopathology", issn: "0954-5794" },
  { id: "S159275680", name: "European Child & Adolescent Psychiatry", issn: "1018-8827" },
  { id: "S104827148", name: "The Counseling Psychologist", issn: "0011-0000" },
  { id: "S50147421", name: "Journal of Family Psychology", issn: "0893-3200" },
  { id: "S137373642", name: "Child Psychiatry & Human Development", issn: "0009-398X" },
  { id: "S186589312", name: "Behaviour Research and Therapy", issn: "0005-7967" },
];

export const JOURNALS_BY_ID = new Map(JOURNALS.map((j) => [j.id, j]));
