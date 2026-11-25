// Built-in projects shown to everyone, including signed-out visitors. Approved suggestions are added from the database.
export const BUILT_IN = [
  {
    id: "water-disclosure-checklist",
    domain: "Water",
    title: "A resident checklist for data center water questions",
    body: "A one-page list of questions residents can bring to a hearing: expected water draw, its source, what happens in drought, and what is reported publicly. Adapted from a playbook the Great Lakes Commission published for residents.",
    sources: [{ name: "Great Lakes Commission playbook", url: "https://greatlakes.org/?p=24470" }],
    channels: ["Material: writing and review", "Network: local groups"]
  },
  {
    id: "benefit-agreement-register",
    domain: "Community",
    title: "A public register of data center benefit agreements",
    body: "Researchers at the Foundation for American Security found eight executed agreements only by searching for them, because many developer and municipal talks run under NDAs. A public register would let residents compare terms across towns.",
    sources: [{ name: "Foundation for American Security", url: "https://fas.org/?p=47528" }],
    channels: ["Material: research", "Network: municipal contacts"]
  },
  {
    id: "water-estimate-reconciliation",
    domain: "Water",
    title: "Explain why national data center water estimates disagree",
    body: "Published estimates of 2023 data center water use differ widely, from about 17 billion gallons in one study to about 228 billion in a GMFUS analysis. A short method comparison would help readers tell which figure to trust. The source of the lower figure still needs locating.",
    sources: [{ name: "GMFUS: Water and the AI Infrastructure Boom", url: "https://www.gmfus.org/news/water-and-ai-infrastructure-boom" }],
    channels: ["Material: data analysis", "Monetary: research time"]
  },
  {
    id: "utility-flexibility-pilot",
    domain: "Energy and air",
    title: "A utility pilot for flexible computing during grid stress",
    body: "Google reports that it limits non-urgent work at its data centers when grid operator partners warn of supply shortfalls. A smaller regional utility and a local compute provider could test a version of this and publish the results.",
    sources: [{ name: "Google Cloud: demand response", url: "https://cloud.google.com/blog/products/infrastructure/using-demand-response-to-reduce-data-center-power-consumption" }],
    channels: ["Network: utility contacts", "Monetary: pilot funding"]
  },
  {
    id: "water-reporting-tracker",
    domain: "Water",
    title: "Track state laws requiring data center water reporting",
    body: "New Jersey now requires data centers to report water and energy use to state regulators every six months, and more than a dozen states were weighing similar laws in 2026. A regular summary for members would keep the community current.",
    sources: [{ name: "GoodGoodGood: New Jersey law", url: "https://www.goodgoodgood.co/articles/new-jersey-data-center-law-report-water-and-energy-use" }],
    channels: ["Material: monitoring", "Network: state policy contacts"]
  },
  {
    id: "forums-with-a-university",
    domain: "Community",
    title: "Public ethics forums run with a local university",
    body: "Quinnipiac University's ETHOS initiative holds public forums on AI's civic effects in which students learn from community concerns and residents contribute professional perspectives. The reciprocal format could be copied locally.",
    sources: [{ name: "Quinnipiac ETHOS", url: "https://www.qu.edu/info-for/ethical-technology-use-through-humanities-outreach-and-shared-learning/" }],
    channels: ["Material: facilitation", "Network: university contacts"]
  },
  {
    id: "community-data-labels",
    domain: "Community and Indigenous knowledge",
    title: "Community-set labels for AI use of local data",
    body: "A paper argues that Local Contexts Traditional Knowledge and Biocultural labels could guide how generative AI uses community knowledge. A warning from the Native Nations Institute applies: labels do not replace asking the community directly, so any pilot should start with knowledge partners.",
    sources: [
      { name: "Recal: Local Contexts labels and generative AI", url: "https://recal.rcaap.pt/recal/article/download/65/45/337" },
      { name: "Native Nations Institute: CARE principles", url: "https://www.nni.arizona.edu/news/acta-borealia-care-principles-ten-years-in" }
    ],
    channels: ["Material: knowledge partnership", "Network: Indigenous data networks"]
  },
  {
    id: "offloading-replication",
    domain: "Cognition",
    title: "Replicate the critical-thinking and AI use findings",
    body: "A 2025 study in Societies (Gerlich) surveyed 666 people and found an association between heavier AI use and weaker critical thinking, with cognitive offloading as the likely mechanism. It is correlational, and the search found no independent replication. A preregistered replication with an experiment would test whether the link holds.",
    sources: [{ name: "PsyPost summary of the study", url: "https://www.psypost.org/ai-tools-may-weaken-critical-thinking-skills-by-encouraging-cognitive-offloading-study-suggests" }],
    channels: ["Material: study design", "Monetary: study funding"]
  },
  {
    id: "city-peer-exchange",
    domain: "Community",
    title: "Peer exchange among cities on AI and data governance",
    body: "Cities for Digital Rights runs an AI and Data community of practice for member cities, with policy monitoring through the Global Observatory of Urban AI. A local group could join or adapt the format for towns in its region.",
    sources: [{ name: "Cities for Digital Rights", url: "https://citiesfordigitalrights.org/node/273" }],
    channels: ["Network: city officials", "Material: sharing notes"]
  },
  {
    id: "participatory-infrastructure-workshops",
    domain: "Community",
    title: "Workshops that surface local concerns about AI infrastructure",
    body: "A conference paper describes participatory workshops with local organizations to surface community concerns about AI infrastructure for local governance. The method could be reused in a host community before a hearing.",
    sources: [{ name: "AAAI/AIES extended abstract", url: "https://ojs.aaai.org/index.php/AIES/article/download/43361/50921/47467" }],
    channels: ["Material: facilitation", "Network: community organizations"]
  }
];
