export interface Ticket {
  id: string;
  subject: string;
  text: string;
}

// Twenty realistic support tickets spread across billing, shipping, returns,
// technical, account and spam — enough variety to exercise every lane.
export const SEED_TICKETS: Ticket[] = [
  {
    id: "TCK-1001",
    subject: "Charged twice for order #88213",
    text: "My card was charged twice for order #88213, once on Monday and again this morning. I need the duplicate charge reversed today — this is the second time it has happened and it is unacceptable. Please refund one of the charges immediately.",
  },
  {
    id: "TCK-1002",
    subject: "Package 5 days late",
    text: "My package was supposed to arrive five days ago and the tracking page has not updated since Tuesday. Can you check with the courier where it is? I would like it delivered this week please.",
  },
  {
    id: "TCK-1003",
    subject: "Password reset loop",
    text: "I keep getting an error when I try to reset my password. The reset email link says the token expired, and requesting a new one gives the same error. I am locked out of my account.",
  },
  {
    id: "TCK-1004",
    subject: "How do I cancel my subscription?",
    text: "Hi, quick question: where in the account settings do I cancel my monthly subscription? No rush, I just want to know the steps before the next billing cycle.",
  },
  {
    id: "TCK-1005",
    subject: "CONGRATULATIONS! You are our winner!",
    text: "Congratulations! You have been selected as today's winner in our giveaway. Click here now to claim your free prize. Act fast — this limited time offer expires tonight. No obligation, 100% free!",
  },
  {
    id: "TCK-1006",
    subject: "Unauthorized transaction on my account",
    text: "There is an unauthorized transaction of $340 on my account that I did not make. If this is not resolved and refunded I will have no choice but to contact my lawyer and report this as fraud.",
  },
  {
    id: "TCK-1007",
    subject: "Item arrived damaged — need exchange",
    text: "The blender I ordered arrived with a cracked base and it won't turn on. I would like to exchange it for a working unit. How do I send back the damaged item?",
  },
  {
    id: "TCK-1008",
    subject: "App crashes when uploading photos",
    text: "Every time I try to upload more than three photos the app crashes and I lose my selection. This started after the last update. It is a real problem because I upload daily for work.",
  },
  {
    id: "TCK-1009",
    subject: "Free crypto opportunity — guaranteed returns",
    text: "Our crypto fund is giving away bitcoin to the first 100 members. Guaranteed returns, no obligation. Click here to claim your free share before the limited time window closes. Act now!",
  },
  {
    id: "TCK-1010",
    subject: "Update invoice address",
    text: "Could you update the billing address on my invoices going forward? We moved offices last month. Here is the new address. Please apply it from the next invoice.",
  },
  {
    id: "TCK-1011",
    subject: "Third attempt — still locked out before my demo",
    text: "This is my third time contacting you. I still can't access my account and I have a client demo today that depends on it. I urgently need a human to look at this immediately.",
  },
  {
    id: "TCK-1012",
    subject: "How do I export my data?",
    text: "Is there a way to export my project history as CSV? I looked in settings but could not find it. Just a question, thanks in advance.",
  },
  {
    id: "TCK-1013",
    subject: "Tracking says delivered but nothing arrived",
    text: "The tracking status shows my package was delivered yesterday but nothing arrived at my address. I checked with my neighbours and the building office. I need this resolved — either resend the item or refund it.",
  },
  {
    id: "TCK-1014",
    subject: "Refund status",
    text: "I returned my order two weeks ago and was told a refund is on the way. Can you confirm when it will reach my card? No rush, just checking in.",
  },
  {
    id: "TCK-1015",
    subject: "Boost your brand with our services",
    text: "Hello! We help brands boost their reach with guaranteed viral campaigns. Limited time pricing for new partners — no obligation trial. Reply to schedule a call and grow your audience free.",
  },
  {
    id: "TCK-1016",
    subject: "Feature request: dark mode",
    text: "Would love to see a dark mode option in the dashboard. Not urgent at all, just a suggestion that many of us working at night would appreciate.",
  },
  {
    id: "TCK-1017",
    subject: "Charged after cancelling — this is fraud",
    text: "I cancelled my subscription on the 2nd and you still charged my card on the 5th. Taking money after cancellation is fraud. Refund the charge today or I will escalate this to my bank and file a complaint with the regulator.",
  },
  {
    id: "TCK-1018",
    subject: "Wrong size delivered",
    text: "I ordered size 42 but received size 39. The shoes are in perfect condition, I just need to exchange them for the right size. What is the process?",
  },
  {
    id: "TCK-1019",
    subject: "Enterprise dashboard down for our whole team",
    text: "Our entire team of 40 is seeing a 500 error on the enterprise dashboard since 7am. This outage is blocking client work. We need someone to look at this immediately — our contract has uptime terms.",
  },
  {
    id: "TCK-1020",
    subject: "Unsubscribe link not working",
    text: "The unsubscribe link in your newsletter emails gives a page not found error. Could you remove me from the mailing list manually? Thanks.",
  },
];
