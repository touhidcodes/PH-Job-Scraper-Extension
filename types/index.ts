export interface Job {
  title: string;
  company: string;
  location: string;
  url: string;
  source: "LinkedIn" | "Bdjobs" | "Wellfound";
}
