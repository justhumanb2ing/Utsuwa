export type LandingCopy = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
  feature: {
    primary: {
      tag: string;
      headingLines: string[];
      description: string;
      bullets: string[];
      cards: {
        title: string;
        accent?: string;
      }[];
    };
    secondary: {
      tag: string;
      headingLines: string[];
      description: string;
      cta: string;
      profileHandle: string;
    };
  };
  pricing: {
    heading: string;
    description: string;
    comingSoon: string;
  };
  footer: {
    headingLines: string[];
    cta: string;
    copyright: string;
    links: { label: string; href: string }[];
  };
};

export const landingCopy: LandingCopy = {
  hero: {
    eyebrow: "Link everything that defines you.",
    title: "DAYDREAM",
    description: "Gather all your links in one clean handle.",
    cta: "Create your handle",
  },
  feature: {
    primary: {
      tag: "Drag & Drop",
      headingLines: ["ORGANIZE", "YOUR CHAOS"],
      description:
        "Just like playing with blocks. Drag, resize, and arrange your content to tell your story the way you want.",
      bullets: [
        "Infinite layouts",
        "Resize any widget",
        "Group related content",
      ],
      cards: [
        { title: "Photos" },
        { title: "About Me", accent: "👋" },
        { title: "Link" },
      ],
    },
    secondary: {
      tag: "Beautifully Responsive",
      headingLines: ["LOOKS GOOD", "EVERYWHERE"],
      description:
        "Whether on a giant desktop or a tiny phone, your page adapts perfectly. No coding required.",
      cta: "Start Creating",
      profileHandle: "@just_humanb2ing",
    },
  },
  pricing: {
    heading: "SIMPLE PRICING",
    description: "Start for free, upgrade for superpowers.",
    comingSoon: "Coming Soon!",
  },
  footer: {
    headingLines: ["READY TO", "DREAM?"],
    cta: "Create your handle",
    copyright: "© 2025, Designed by justhumanb2ing",
    links: [
      { href: "/go/profile", label: "Sign in" },
      { href: "#", label: "Privacy" },
      { href: "#", label: "Terms" },
    ],
  },
};
