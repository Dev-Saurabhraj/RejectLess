// FICTIONAL people. Names are common Indian names; every identifier is invented,
// IFSCs belong to fictional banks, and all documents carry a SPECIMEN watermark.

export interface Persona {
  id: string;
  name: string;
  nameLocal: string;
  gender: "Male" | "Female";
  genderLocal: string;
  dob: string; // DD/MM/YYYY
  father: string;
  fatherLocal: string;
  aadhaarLast4: string;
  pan?: string;
  bank: { holder: string; account: string; ifsc: string; bank: string; branch: string; city: string };
  epf?: { uan: string; memberId: string; establishment: string; dojMonthsAgo: number; doeMonthsAgo?: number; balance: number };
  student?: {
    board: string;
    roll: string;
    year: string;
    percentage: string;
    stream: string;
    income: number;
    incomeIssuedMonthsAgo: number;
    tehsil: string;
    institution: string;
    course: string;
    courseYear: string;
    mode: string;
    academicYear: string;
  };
  city: string;
  stateCode: string;
}

export const PERSONAS: Record<string, Persona> = {
  anjali: {
    id: "anjali",
    name: "Anjali Verma",
    nameLocal: "अंजलि वर्मा",
    gender: "Female",
    genderLocal: "महिला",
    dob: "14/03/1994",
    father: "Rajesh Verma",
    fatherLocal: "राजेश वर्मा",
    aadhaarLast4: "4821",
    pan: "AFKPV4821M",
    bank: { holder: "Anjali Verma", account: "50210048213377", ifsc: "BDBK0004521", bank: "Bharat Demo Bank", branch: "Hazratganj", city: "Lucknow" },
    epf: { uan: "100987654321", memberId: "UPLKO00451230000012345", establishment: "Avadh Demo Textiles Pvt Ltd", dojMonthsAgo: 88, doeMonthsAgo: 14, balance: 384250 },
    city: "Lucknow",
    stateCode: "UP",
  },
  saurabh: {
    id: "saurabh",
    name: "Saurabh Kumar",
    nameLocal: "सौरभ कुमार",
    gender: "Male",
    genderLocal: "पुरुष",
    dob: "05/08/1998",
    father: "Ramesh Kumar",
    fatherLocal: "रमेश कुमार",
    aadhaarLast4: "7316",
    pan: "BQRPK7314D",
    bank: { holder: "Saurabh Kumar", account: "30451287690", ifsc: "BDBK0001234", bank: "Bharat Demo Bank", branch: "Kankarbagh", city: "Patna" },
    epf: { uan: "101234567890", memberId: "BRPAT00782340000067890", establishment: "Ganga Demo Logistics LLP", dojMonthsAgo: 43, doeMonthsAgo: 15, balance: 142600 },
    city: "Patna",
    stateCode: "BR",
  },
  imran: {
    id: "imran",
    name: "Imran Ali",
    nameLocal: "इमरान अली",
    gender: "Male",
    genderLocal: "पुरुष",
    dob: "02/01/1986",
    father: "Shakeel Ali",
    fatherLocal: "शकील अली",
    aadhaarLast4: "5502",
    pan: "CJMPA5502K",
    bank: { holder: "Imran Ali", account: "71100235546", ifsc: "JSBX0000915", bank: "Janata Sample Bank", branch: "MP Nagar", city: "Bhopal" },
    epf: { uan: "100555123987", memberId: "MPBPL00311200000055021", establishment: "Narmada Demo Engineering Works", dojMonthsAgo: 143, doeMonthsAgo: 8, balance: 612480 },
    city: "Bhopal",
    stateCode: "MP",
  },
  kavita: {
    id: "kavita",
    name: "Kavita Yadav",
    nameLocal: "कविता यादव",
    gender: "Female",
    genderLocal: "महिला",
    dob: "19/09/1999",
    father: "Dinesh Yadav",
    fatherLocal: "दिनेश यादव",
    aadhaarLast4: "9043",
    pan: "DLYPY9043B",
    bank: { holder: "Kavita Yadav", account: "88020019043112", ifsc: "JSBX0002210", bank: "Janata Sample Bank", branch: "Sector 17", city: "Chandigarh" },
    epf: { uan: "101876543219", memberId: "PBCHD00912340000090431", establishment: "Shivalik Demo Healthcare Pvt Ltd", dojMonthsAgo: 8, balance: 64300 },
    city: "Chandigarh",
    stateCode: "CH",
  },
  priya: {
    id: "priya",
    name: "Priya Sharma",
    nameLocal: "प्रिया शर्मा",
    gender: "Female",
    genderLocal: "महिला",
    dob: "23/11/2006",
    father: "Mahesh Sharma",
    fatherLocal: "महेश शर्मा",
    aadhaarLast4: "2287",
    bank: { holder: "Priya Sharma", account: "61008745210", ifsc: "BDBK0000777", bank: "Bharat Demo Bank", branch: "Civil Lines", city: "Jaipur" },
    student: {
      board: "State Board of Senior Secondary Education (Demo)",
      roll: "SR2604417",
      year: "2026",
      percentage: "91.40",
      stream: "Science",
      income: 320000,
      incomeIssuedMonthsAgo: 4,
      tehsil: "जयपुर",
      institution: "Government Demo College, Jaipur",
      course: "B.Sc. (Physics, Chemistry, Mathematics)",
      courseYear: "First Year",
      mode: "Regular",
      academicYear: "2026-27",
    },
    city: "Jaipur",
    stateCode: "RJ",
  },
  rahul: {
    id: "rahul",
    name: "Rahul Meena",
    nameLocal: "राहुल मीणा",
    gender: "Male",
    genderLocal: "पुरुष",
    dob: "11/06/2007",
    father: "Suresh Meena",
    fatherLocal: "सुरेश मीणा",
    aadhaarLast4: "6634",
    bank: { holder: "Suresh Meena", account: "61008112934", ifsc: "BDBK0000777", bank: "Bharat Demo Bank", branch: "Civil Lines", city: "Jaipur" },
    student: {
      board: "State Board of Senior Secondary Education (Demo)",
      roll: "SR2609932",
      year: "2026",
      percentage: "88.20",
      stream: "Commerce",
      income: 480000,
      incomeIssuedMonthsAgo: 18,
      tehsil: "दौसा",
      institution: "Government Demo College, Jaipur",
      course: "B.Com.",
      courseYear: "First Year",
      mode: "Regular",
      academicYear: "2026-27",
    },
    city: "Jaipur",
    stateCode: "RJ",
  },
};

export function monthsAgo(n: number, day = 10): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(Math.min(day, 28));
  return d;
}

export function ddmmyyyy(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export function inr(n: number): string {
  return n.toLocaleString("en-IN");
}

/** Swaps two neighbouring digits — a realistic typing mistake. */
export function swapDigits(s: string, at = 4): string {
  const a = s.split("");
  [a[at], a[at + 1]] = [a[at + 1], a[at]];
  return a.join("");
}

/** Produces a plausible transliteration variant of a name. */
export function spellingVariant(name: string): string {
  const rules: [RegExp, string][] = [
    [/au/, "ou"],
    [/Au/, "Ou"],
    [/ee/, "i"],
    [/i(?=[a-z]{2,})/, "ee"],
    [/v/, "w"],
    [/sh/, "s"],
  ];
  for (const [re, rep] of rules) if (re.test(name)) return name.replace(re, rep);
  return name + "a";
}
