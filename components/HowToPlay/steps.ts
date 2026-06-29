import { StepData } from "./StepCard";

const STEPS: StepData[] = [
  {
    number: 1,
    illustration: "/step1-redue.jpg",
    caption: "Deal 3-6 chums each",
    heading: "Step 1",
    rows: [
      { icon: "/shuffle-icon.svg", title: "Find your pack", body: "Dig out your Pedigree Chums deck." },
      { icon: "/deal-icon.svg", title: "Gather your players", body: "No limit on players. You can even go solo." },
      { icon: "/friends-icon.svg", title: "Shuffle well", body: "Give the deck a good shuffle." },
      { icon: "/find-pack-icon.svg", title: "Deal the cards", body: "Hand out 3 to 6 cards each. Show your hand to the other players, then hide it." },
    ],
  },
  {
    number: 2,
    illustration: "/step2-redue.jpg",
    caption: "Go for a walk",
    heading: "Step 2",
    rows: [
      { icon: "/dog-walk-icon.svg", title: "Head outside", body: "Explore your town or city." },
      { icon: "/PC-chums.svg", title: "Keep your cards close", body: "Keep somewhere easy to pull out." },
      { icon: "/famil-icon.svg", title: "Eyes peeled", body: "Chums could be in places you wouldn't expect." },
    ],
  },
  {
    number: 3,
    illustration: "/step3-redue.jpg",
    caption: "Find real dogs",
    heading: "Step 3",
    rows: [
      { icon: "/dog-show-icon.svg", title: "Look carefully", body: "Study the dog's coat, size and markings." },
      { icon: "/checklist-icon.svg", title: "Check the card", body: "Does it match?" },
      { icon: "/friends-icon.svg", title: "Call it out loud", body: "Say the breed name. Other players can challenge if they disagree." },
    ],
  },
  {
    number: 4,
    illustration: "/step4-redue.jpg",
    caption: "Match to your chum",
    heading: "Step 4",
    rows: [
      { icon: "/PC-chums.svg", title: "Claim your chum", body: "Separate the found chum card." },
      { icon: "/famil-icon.svg", title: "Help each other", body: "Playing as a team? Call out dogs that match another player's hand too." },
    ],
  },
  {
    number: 5,
    illustration: "/step5-redue.jpg",
    caption: "Find more chums",
    heading: "Step 5",
    rows: [
      { icon: "/dog-walk-icon.svg", title: "Explore more", body: "The more ground you cover," },
      { icon: "/trend-icon.svg", title: "Find more", body: "the more chums you find." },
    ],
  },
  {
    number: 6,
    illustration: "/step6-redue.jpg",
    caption: "Most chums wins",
    heading: "Step 6",
    rows: [
      { icon: "/dog-walk-icon.svg", title: "Finished exploring", body: "When the walk ends or your day out is done." },
      { icon: "/PC-chums.svg", title: "Count up chums", body: "Tot up who has the most chums." },
      { icon: "/queen-icon.svg", title: "The most wins", body: "The player with the most matched chums wins." },
    ],
  },
];

export default STEPS;
