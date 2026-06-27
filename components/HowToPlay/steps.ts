import { StepData } from "./StepCard";

const STEPS: StepData[] = [
  {
    number: 1,
    illustration: "/step1.png",
    caption: "Deal a few cards evenly among the players",
    heading: "Step 1",
    rows: [
      {
        icon: "/find-pack-icon.svg",
        title: "Find",
        body: "Find your pack of Pedigree Chums.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Friends",
        body: "Find out who is playing. There is no maximum or minimum player limit. You can play with just 1 player.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Shuffle",
        body: "Shuffle the deck a good few times.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Deal",
        body: "Dish out 3\u20136 cards to each player. Show each other your hands and either work as a team or independently.",
      },
    ],
  },
  {
    number: 2,
    illustration: "/step2.png",
    caption: "Head out and start spotting dogs",
    heading: "Step 2",
    rows: [
      {
        icon: "/find-pack-icon.svg",
        title: "Go outside",
        body: "Go for a walk, visit a park, or explore your town or city.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Keep your cards",
        body: "Hold on to your cards and keep them handy while you walk.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Stay alert",
        body: "Keep an eye out for dogs on leads, in cars, or in gardens.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Spot and match",
        body: "When you see a real dog, check if it matches any card in your hand.",
      },
    ],
  },
  {
    number: 3,
    illustration: "/step3.png",
    caption: "Match the dog you see to your cards",
    heading: "Step 3",
    rows: [
      {
        icon: "/find-pack-icon.svg",
        title: "Look carefully",
        body: "Study the dog you see and compare it to your cards.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Check the breed",
        body: "Match the breed name, look and markings on your card to the real dog.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Mixed breeds",
        body: "If the dog looks like a mix, see if it matches any card closely enough.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Claim the match",
        body: "If it matches, set that card aside as a scored Pedigree Chum.",
      },
    ],
  },
  {
    number: 4,
    illustration: "/step4.png",
    caption: "Try to collect all your chums",
    heading: "Step 4",
    rows: [
      {
        icon: "/find-pack-icon.svg",
        title: "Keep going",
        body: "Continue spotting dogs until your walk is done or all cards are matched.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Help each other",
        body: "Playing as a team? Help other players spot their breeds too.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "One match per dog",
        body: "Each real dog can only match one card \u2014 first to claim it wins it.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Collect them all",
        body: "Try to spot every breed in your hand before the walk ends.",
      },
    ],
  },
  {
    number: 5,
    illustration: "/step5.png",
    caption: "Count your chums and crown the winner",
    heading: "Step 5",
    rows: [
      {
        icon: "/find-pack-icon.svg",
        title: "Count up",
        body: "At the end of the walk, everyone counts their matched Pedigree Chums.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Most wins",
        body: "The player with the most matched cards wins the game.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Play again",
        body: "Shuffle and re-deal for another round on the same walk or a new one.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Collect the set",
        body: "There are 54 Pedigree Chums to collect \u2014 can you spot them all?",
      },
    ],
  },
];

export default STEPS;
