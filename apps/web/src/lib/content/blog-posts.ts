export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  image?: string;
  publishedAt: string;
  updatedAt: string;
  sections: { heading?: string; paragraphs: string[] }[];
  relatedCategory?: string;
}

/** Flower/gift guides only — legacy Rakhi posts removed from the storefront. */
export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-keep-flowers-fresh-longer",
    title: "How to Keep Flowers Fresh Longer",
    description:
      "A room is immediately cheered up and made more welcoming with fresh flowers. Learn easy steps to extend the life of cut flowers and keep a bouquet looking beautiful for a few extra days.",
    excerpt:
      "A few easy steps can extend the life of cut flowers and keep them looking beautiful for a few extra days.",
    publishedAt: "2026-08-01",
    updatedAt: "2026-08-22",
    relatedCategory: "flowers",
    sections: [
      {
        paragraphs: [
          "A room is immediately cheered up and made more welcoming with fresh flowers. Whether you receive a bouquet on a special occasion, purchase flowers for your home or pick a few stems from your garden, it is natural to want them to last as long as possible. Fortunately, a few easy steps can extend the life of cut flowers and keep them looking beautiful for a few extra days.",
        ],
      },
      {
        heading: "1. Start With a Clean Vase",
        paragraphs: [
          "One of the best ways of extending the life of flowers is by keeping them in a clean vase. Dirty vases can easily get bacteria in them that will affect the stems and the water. Before putting your flowers in the vase, wash it well in soap and water and rinse well.",
          "A clean environment will let the flower absorb water properly and make it healthy.",
        ],
      },
      {
        heading: "2. Trim the Stems Before Placing Flowers in Water",
        paragraphs: [
          "When you bring flowers home, cut about a centimeter or two off the bottom of each stem. Cut the stems at a slight angle with a clean, sharp pair of scissors or garden shears.",
          "The angled cut allows for more surface area for the water to be absorbed and also prevents the bottom of the stem from lying flat on the vase base. Trim the stems under clean water, if you can, to reduce the possibility of air entering the stem.",
        ],
      },
      {
        heading: "3. Remove Leaves Below the Water Level",
        paragraphs: [
          "Look at each flower carefully and cut away any leaves that would be down in the water. Leaves that are submerged can rot quickly and provide a breeding ground for bacteria.",
          "By keeping the water free of excess plant material, you can keep the conditions cleaner and help your flowers last longer.",
        ],
      },
      {
        heading: "4. Use Fresh, Clean Water",
        paragraphs: [
          "Flowers require water, just as living plants do. Fill your vase with fresh clean water and check often. Changing the water every day or two, depending upon the flowers and how warm the room is, can help keep it cleaner.",
          "Change the water often and when you do, wash out the vase and cut a bit more off the ends of the stems if they look blocked or soft.",
        ],
      },
      {
        heading: "5. Keep Flowers Away From Direct Sunlight",
        paragraphs: [
          "If you are growing them, they need light. If they are cut flowers keep them out of bright direct sunlight and they will last longer. Avoid placing a bouquet directly in front of a sunny window, heater or other warm area.",
          "A cool place with indirect light is generally a better option. Too much heat can cause the flowers to lose water more quickly, and may cause the petals to brown sooner.",
        ],
      },
      {
        heading: "6. Never Place Flowers Near Fruit",
        paragraphs: [
          "It's a small detail that's hard to miss. When fruits like apples, bananas and pears ripen, they give off a gas called ethylene. This gas can accelerate the ageing of some flowers.",
          "Therefore, whenever you can, keep your flower vase away from fruit bowls and other sources of ethylene.",
        ],
      },
      {
        heading: "7. Use Flower Food When Possible",
        paragraphs: [
          "A lot of bouquets are sold with a little packet of flower food. If you have one, read the instructions on the packet and add the recommended amount to the water.",
          "Flower food is generally formulated to supply nutrients and to help maintain conditions suitable for cut flowers. If you do not have flower food then make sure that it is clean water, a clean vase, the correct trimming of stems and the correct placement.",
        ],
      },
      {
        heading: "8. Remove Wilted Flowers or Petals",
        paragraphs: [
          "Check on your bouquet every day or two. If one flower has wilted a lot, and the other flowers are still looking fresh, remove it from the arrangement.",
          "Remove any damaged flowers and fallen petals so the rest of the bouquet stays cleaner. It also lets you examine the water and stems for any signs of decay.",
        ],
      },
      {
        heading: "9. Choose the Right Location",
        paragraphs: [
          "Where you put your flowers can really make a difference. In general, a cool room, out of direct sunlight, strong drafts, heating appliances and air-conditioning vents is a good option.",
          "Avoid moving the bouquet from a cool place to a hot place repeatedly. Stable room conditions can help reduce stress on flowers unnecessarily.",
        ],
      },
      {
        heading: "10. Take Care of Different Flowers Differently",
        paragraphs: [
          "Not all flowers require the same care. Roses, lilies, carnations, chrysanthemums, tulips and other popular varieties may react differently to water levels, temperature and trimming.",
          "If you know the variety of flower, check the specific care requirements. Some flowers prefer to be in deeper water, while others prefer to be in shallower water. Understanding your specific flowers' needs will make your care routine more effective.",
        ],
      },
      {
        heading: "How Long Can Fresh Flowers Last?",
        paragraphs: [
          "The life of cut flowers can be influenced by the variety, how fresh the flowers were at the time of purchase, room temperature, water quality, and the care given to them. Some flowers will be attractive for several days, others for a week or more if conditions are right.",
          "Most importantly, start with fresh flowers, and give them clean water, a clean environment and the right conditions to start with.",
        ],
      },
      {
        heading: "Final Thoughts",
        paragraphs: [
          "You don't need a complicated routine to keep flowers looking fresh longer. A clean vase, stems cut fresh, clean water, and a cool spot can make a world of difference. And keeping an eye on the bouquet, trimming away any damaged leaves or flowers will also help keep it looking good.",
          "A little daily attention will enable you to enjoy the beauty of fresh flowers longer and get more value from every bouquet you bring into your home.",
        ],
      },
    ],
  },
  {
    slug: "rose-color-meanings-for-gifting",
    title: "Rose Color Meanings for Gifting: What Each Rose Color Says",
    description:
      "Roses are one of the most popular flowers given as gifts but their meaning may differ depending on the colour. Learn what red, pink, white, yellow, orange, purple, peach, green and blue roses say when you send a gift.",
    excerpt:
      "Selecting a rose colour that is reflective of the occasion and relationship makes a simple flower gift feel more thoughtful.",
    publishedAt: "2026-08-05",
    updatedAt: "2026-08-22",
    relatedCategory: "flowers",
    sections: [
      {
        paragraphs: [
          "Roses are one of the most popular flowers given as gifts but their meaning may differ depending on the colour. Red roses are most commonly associated with love, but different colours can mean friendship, appreciation, gratitude, hope or new beginnings. Selecting a rose colour that is reflective of the occasion and relationship makes a simple flower gift feel more thoughtful.",
          "Learning the meanings of rose colours can help you choose flowers that communicate the emotion you want to share. Whether you are gifting roses to a partner, friend, family member, colleague or someone celebrating a special moment, each colour can convey a different message.",
        ],
      },
      {
        heading: "Red Roses: Love and Romance",
        paragraphs: [
          "Red roses are arguably the most iconic symbol of love and romance. These are often given to partners on anniversaries, Valentine's Day, proposals or romantic milestones.",
          "Red roses in a bouquet can speak of deep affection, passion, and commitment. Because of the very romantic connotation they carry, they are usually best when used for someone with whom you have a close romantic relationship.",
        ],
      },
      {
        heading: "Pink Roses: Appreciation and Affection",
        paragraphs: [
          "Pink roses have a softer, more versatile meaning. They are often associated with sweetness, affection, admiration and appreciation.",
          "If you want to show gratitude or gentle affection, light pink roses might be suitable, and deeper pink colours can express admiration. They are great for birthdays, thank you gifts, celebrations or just as a thoughtful gesture to someone you care about.",
          "If you want to express warmth but not the stronger romantic message that red roses usually communicate, pink roses are another good choice.",
        ],
      },
      {
        heading: "White Roses: Purity and New Beginnings",
        paragraphs: [
          "White roses are commonly known to symbolize purity, peace, sincerity and new beginnings. They have a clean look that makes them perfect for all kinds of special occasions.",
          "They make great gifts for weddings, engagements, graduations or any other milestone in a person's life. White roses may also be suitable for a gift that you want to express respect and sincerity.",
          "They are suitable for both formal and personal events as they have a clean and elegant appearance.",
        ],
      },
      {
        heading: "Yellow Roses: Friendship and Happiness",
        paragraphs: [
          "Yellow roses are associated with friendship, happiness, warmth and positive emotions. They generally convey a non-romantic message, unlike red roses.",
          "Because of this, yellow roses are the obvious flower to give to friends, siblings, colleagues or family members. They can be given for birthdays, achievements, celebrations or simply to make someone's day.",
          "If you want to give roses to a friend without making a romantic impression, yellow roses are a thoughtful option.",
        ],
      },
      {
        heading: "Orange Roses: Enthusiasm and Energy",
        paragraphs: [
          "Orange roses are bright and energetic looking and are often associated with enthusiasm, excitement, desire and appreciation.",
          "They make a good choice for celebrating achievements, new beginnings or moments that require an energetic expression. Orange roses can also be used to convey admiration, but they have a more vibrant and playful feel than traditional red roses.",
          "Orange roses are a cheerful addition to celebrations for anyone starting a new job, finishing a significant project, or reaching a personal milestone.",
        ],
      },
      {
        heading: "Purple Roses: Admiration and Elegance",
        paragraphs: [
          "Purple roses are often associated with enchantment, admiration, elegance and fascination. They can stand out from more traditional types of rose by virtue of their unusual colour.",
          "If you want to give someone you admire or appreciate flowers, they may be appropriate. Purple roses also make a good choice for birthdays, celebrations and occasions when you want something a little out of the ordinary instead of a red or pink bouquet.",
        ],
      },
      {
        heading: "Peach Roses: Gratitude and Sincerity",
        paragraphs: [
          "The peach rose symbolizes gratitude, sincerity, warmth and appreciation. The colour is soft and makes them look friendly and welcoming.",
          "They can be presented to thank or appreciate a friend, family member, teacher, colleague or anyone who has helped you. If you want the gift to be warm and understated, peach roses are also suitable for celebrations.",
        ],
      },
      {
        heading: "Green Roses: Growth and Renewal",
        paragraphs: [
          "Green roses are less traditional, but they can symbolize growth, renewal, balance and new opportunities.",
          "They might be suitable for events focusing on change or personal development. Green roses are perfect for a graduation, new job, house-warming or another milestone of a new stage in life.",
          "They also make a great choice for a person who loves unusual or distinctive flowers, since they are not as common as traditional rose colours.",
        ],
      },
      {
        heading: "Blue Roses: Mystery and Imagination",
        paragraphs: [
          "Blue roses are often seen as a mystery, something unique, imaginative and something that is hard to attain. A natural blue rose is very rare, so most blue roses given as gifts have been specially grown or dyed.",
          "They have a distinct look, making them perfect for those who appreciate creative or unique gifts. Use them when you want to give someone flowers that are different than a traditional bouquet.",
        ],
      },
      {
        heading: "How to Choose the Right Rose Color",
        paragraphs: [
          "When selecting roses, think about the occasion and your connection to the recipient. Red roses may be good for a romantic partner, but yellow or pink roses may be better for a close friend. White roses are a symbol of new beginnings; orange or peach roses symbolize excitement and gratitude.",
          "You should also consider the recipient's personal preferences. The meaning of a flower is subjective and depends on culture and personal experience, so there isn't one meaning that will apply in every situation. The traditional meaning of the flower is often less important than the thought behind the gift.",
        ],
      },
      {
        heading: "Final Thoughts",
        paragraphs: [
          "Learning the meanings of rose colours can help you choose flowers that match the feeling you want to express when you give them. For example, red can mean romance, pink can mean appreciation, yellow can mean friendship, white can mean new beginnings and other colours can mean admiration, gratitude, enthusiasm or personality.",
          "Ultimately, the best rose colour is the one that feels right for the person and the occasion. A beautiful bouquet can elevate an everyday moment into something meaningful, even when the message is uncomplicated.",
        ],
      },
    ],
  },
  {
    slug: "what-to-write-in-a-gift-message",
    title: "What to Write in a Gift Message",
    description:
      "A thoughtful message makes a gift more special. Find what to write in a gift message for birthdays, weddings, anniversaries, graduations, thank-yous, and everyday surprises.",
    excerpt:
      "You don't have to write a long or complicated gift message. A brief personal note appropriate to the occasion and your relationship with the recipient will suffice.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-22",
    relatedCategory: "birthday-gifts",
    sections: [
      {
        paragraphs: [
          "A thoughtful message makes a gift more special. Whether it's a birthday, wedding, anniversary, graduation, festival or just to make someone smile, a few sincere words can make the moment more special when you give a gift. But so many people have a hard time answering one simple question: what to write in a gift message?",
          "The good news is you don't have to write a long or complicated gift message. Often a brief personal message appropriate to the occasion and your relationship with the recipient will suffice.",
        ],
      },
      {
        heading: "Why Is a Gift Message Important?",
        paragraphs: [
          "A gift message makes a gift more personal. The gift itself shows that you thought of someone, and the message explains the emotion behind it. A simple sentence like \"Hope this brings a smile to your day\" can make an ordinary gift seem more thoughtful.",
          "A good gift message can also help the recipient to feel remembered and appreciated. This is especially helpful if you are sending a gift online or giving it to someone who lives far away.",
        ],
      },
      {
        heading: "What Should You Include in a Gift Message?",
        paragraphs: [
          "When you write your message, think about three basic things: the occasion, the person and your relationship with him/her.",
          "For instance, a birthday greeting for a best friend can be informal and funny, whereas a message for a wedding present can be more sincere and respectful. For example, a message to a colleague is typically polite and to the point.",
          "Try to include a genuine thought rather than using complicated words. You can mention what the occasion is, wish the person well and finish with a warm sentence.",
        ],
      },
      {
        heading: "Gift Message Ideas for Every Occasion",
        paragraphs: [
          "Use these short examples as a starting point, then adjust the wording so it sounds like you.",
        ],
      },
      {
        heading: "Birthday Gift Message",
        paragraphs: [
          "Birthday messages can be cheerful and personal. You do not need to write a long paragraph.",
          "Examples include:",
          "\"Wishing you a wonderful birthday filled with happiness and good memories.\"",
          "\"Hope your special day is full of laughter, fun, and everything you enjoy.\"",
          "\"Happy Birthday! May the coming year bring you many reasons to smile.\"",
          "For a close friend, you can make the message more personal by mentioning a shared memory or an inside joke.",
        ],
      },
      {
        heading: "Wedding Gift Message",
        paragraphs: [
          "Wedding messages are usually warm, positive, and respectful. Focus on the couple's new journey together.",
          "You could write:",
          "\"Congratulations on your wedding. Wishing you both a lifetime of happiness and beautiful memories.\"",
          "\"May your life together be filled with love, understanding, and countless happy moments.\"",
          "\"Best wishes as you begin this wonderful new chapter together.\"",
        ],
      },
      {
        heading: "Anniversary Gift Message",
        paragraphs: [
          "An anniversary gift message can celebrate the relationship and the memories built over time.",
          "For example:",
          "\"Wishing you both another beautiful year filled with love, laughter, and wonderful memories. Happy Anniversary!\"",
          "For a partner, you can make it more personal by talking about what you appreciate about them.",
        ],
      },
      {
        heading: "Graduation Gift Message",
        paragraphs: [
          "Graduation is an important milestone, so the message can focus on achievement and the future.",
          "You might write:",
          "\"Congratulations on your graduation! Your hard work has paid off, and I hope this is the beginning of many exciting opportunities.\"",
          "A simple message of encouragement can also work well: \"Be proud of how far you have come, and keep believing in what you can achieve.\"",
        ],
      },
      {
        heading: "Thank-You Gift Message",
        paragraphs: [
          "If you are giving a gift to thank someone, make the message directly connected to your appreciation.",
          "For example:",
          "\"Thank you for always being there when I needed your support. This small gift is just a little way of showing how much I appreciate you.\"",
          "This type of message works well for friends, family members, teachers, colleagues, or anyone who has helped you.",
        ],
      },
      {
        heading: "What to Write When There Is No Special Occasion?",
        paragraphs: [
          "You do not always need a birthday, anniversary, or holiday as a reason to give someone a gift. Sometimes, an unexpected present can be even more meaningful.",
          "In this situation, keep the message natural:",
          "\"Just a little something to brighten your day.\"",
          "\"No special reason—just wanted to make you smile.\"",
          "\"Saw this and thought of you. Hope you like it!\"",
          "These messages are simple and do not create unnecessary pressure or formality.",
        ],
      },
      {
        heading: "Keep the Message Personal",
        paragraphs: [
          "One of the easiest ways to make a gift message better is to personalize it for the recipient.",
          "For instance, instead of \"Hope you enjoy your gift,\" you could say, \"I hope this makes your weekend a little more relaxing.\"",
          "Personal details give authenticity even to a short message.",
        ],
      },
      {
        heading: "How Long Should a Gift Message Be?",
        paragraphs: [
          "No set length to gift message. Generally, two to four sentences should do the trick. The idea is to convey a feeling, not to write an essay.",
          "If you know the recipient well, you might consider a longer personal note. One or two thoughtful sentences are usually better for professional contacts or acquaintances.",
        ],
      },
      {
        heading: "What Should You Avoid?",
        paragraphs: [
          "Don't use too formal language or words that don't sound like you in your gift message. A message should sound like something you would actually say.",
          "It is also better not to comment about the price, size or quality of the gift. Be sure to keep the focus on the recipient and why you are giving the gift.",
          "If you are not sure what to write, keep it simple. A real \"Thinking of you and hope this makes you smile\" is often better than a long message with unnecessary words.",
        ],
      },
      {
        heading: "Conclusion",
        paragraphs: [
          "Gift message wording doesn't have to be hard. Consider the occasion, your relationship with the recipient, and the feeling you want to convey. Then write some real words that sound real.",
          "Funny, emotional, appreciative, straight forward - whatever the message is, the most important thing is that it feels genuine. A thoughtful note can make a simple gift something to remember and remind someone that they are thought of and remembered.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function listAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function allBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}
