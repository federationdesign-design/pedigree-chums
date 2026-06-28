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
        title: "Find your pack",
        body: "Dig out your Pedigree Chums deck and find a flat surface to play on.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Gather your players",
        body: "Anyone can play -- no limit on players. You can even go solo.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Shuffle well",
        body: "Give the deck a good shuffle. The more random the better.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Deal the cards",
        body: "Hand out 3 to 6 cards each. Show your hand to the table, then hide it.",
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
        title: "Head outside",
        body: "Go for a walk somewhere dogs are likely -- parks, streets, beaches.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Keep your cards close",
        body: "Hold your hand or keep it somewhere easy to reach while you walk.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Eyes open",
        body: "Watch for dogs on leads, in cars, in gardens -- anywhere they might appear.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Spot and check",
        body: "When you see a real dog, quietly check your hand. Does it match a card?",
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
        body: "Study the dog's shape, coat, size and markings before you call it.",
      },
      {
        icon: "/deal-icon.svg",
        title: "Check the breed",
        body: "Match what you see to the breed name and illustration on your card.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Mixed breeds count",
        body: "If the dog is a mix, see if it closely resembles any card in your hand.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Call it",
        body: "Say the breed name out loud. Other players can challenge if they disagree.",
      },
    ],
  },
  {
    number: 4,
    illustration: "/step4.png",
    caption: "Collect your chums and keep going",
    heading: "Step 4",
    rows: [
      {
        icon: "/deal-icon.svg",
        title: "Claim your chum",
        body: "A matched card is yours. Set it aside face up -- that is your chum.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Help each other",
        body: "Playing as a team? Call out dogs that match another player's hand too.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "One dog, one card",
        body: "Each real dog can only match one card. First to call it correctly wins it.",
      },
      {
        icon: "/find-pack-icon.svg",
        title: "Keep going",
        body: "Keep spotting until your walk ends or all cards in play have been matched.",
      },
    ],
  },
  {
    number: 5,
    illustration: "/step5.png",
    caption: "Count your chums and find the winner",
    heading: "Step 5",
    rows: [
      {
        icon: "/deal-icon.svg",
        title: "Count up",
        body: "When the walk ends, everyone counts their matched Pedigree Chums.",
      },
      {
        icon: "/friends-icon.svg",
        title: "Most chums wins",
        body: "The player with the most matched cards is the winner.",
      },
      {
        icon: "/shuffle-icon.svg",
        title: "Play again",
        body: "Shuffle, re-deal and go again -- same walk or somewhere new.",
      },
      {
        icon: "/find-pack-icon.svg",
        title: "Collect them all",
        body: "There are 54 Pedigree Chums to find. How many can your pack spot?",
      },
    ],
  },
];

export default STEPS;
