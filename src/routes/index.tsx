import { createFileRoute } from "@tanstack/react-router";
import { Backdrop } from "@/components/bourse/Backdrop";
import { Navbar, MobileNav } from "@/components/bourse/Navbar";
import { Hero } from "@/components/bourse/Hero";
import { Bento } from "@/components/bourse/Bento";
import { Positions } from "@/components/bourse/Positions";
import { NeonCursor } from "@/components/bourse/Cursor";
import { useState } from "react";
import { TimeframeContext, type Timeframe } from "@/components/bourse/useMarket";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BOURSE. — Terminal de trading dark luxury" },
      {
        name: "description",
        content:
          "BOURSE. : terminal de marchés ultra premium en dark mode. CAC 40, S&P 500, top movers, positions et graphiques néon en temps réel.",
      },
      { property: "og:title", content: "BOURSE. — Terminal de trading dark luxury" },
      {
        property: "og:description",
        content:
          "La Bourse, enfin belle. Un terminal de marchés inspiré du futur : indices, top movers et positions dans une interface néon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tf, setTf] = useState<Timeframe>("1M");
  return (
    <TimeframeContext.Provider value={{ tf, setTf }}>
    <div className="relative min-h-screen">
      <Backdrop />
      <NeonCursor />
      <Navbar />
      <Hero />
      <Bento />
      <Positions />
      <MobileNav />
    </div>
    </TimeframeContext.Provider>
  );
}
