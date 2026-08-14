import { categoryHref } from "@/lib/category-urls";

export type OccasionFaq = { q: string; a: string };

export type OccasionPage = {
  slug: string;
  title: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: string;
  etiquette: string;
  faqs: OccasionFaq[];
  /** Internal category slug used for categoryHref / product matching. */
  categorySlug: string;
  /** Extra tokens used to loosely match product tags/names. */
  matchTokens: string[];
};

export const occasionPages: OccasionPage[] = [
  {
    slug: "birthday",
    title: "Birthday Flowers & Gifts USA — Same-Day Options | BlossomPot",
    h1: "Birthday Flowers, Cakes & Gift Ideas",
    primaryKeyword: "birthday flowers USA",
    secondaryKeywords: [
      "birthday cake delivery",
      "birthday gift hamper",
      "send birthday flowers",
      "same-day birthday gifts",
    ],
    categorySlug: "birthday-gifts",
    matchTokens: ["birthday", "cake", "balloon", "celebration"],
    intro:
      "Birthdays call for color, sweetness, and a message that feels personal. BlossomPot helps you send birthday flowers, celebration cakes, and curated gift hampers across the United States with clear delivery expectations on every product page. Whether you are surprising a friend in another city or arranging a doorstep delivery for a family celebration, start with the mood you want—bright mixed blooms for a joyful vibe, classic roses for something elegant, or a cake-and-flower combo when you want the full party feeling. Many shoppers pair a bouquet with a short handwritten-style gift note so the recipient knows the thought behind the order. If timing matters, look for same-day eligible gifts in select metros and confirm the local cut-off before checkout. Nationwide options remain available when you need reliable shipping windows rather than rush delivery. Browse birthday collections, compare presentation styles, and choose a gift that matches how close you are to the person celebrating—not just what looks good in a photo.",
    etiquette:
      "Keep birthday gifting simple and sincere. A concise note naming the occasion and one specific wish usually lands better than a long generic paragraph. If you are sending to a workplace, choose arrangements that travel well and avoid overwhelming fragrance. For kids’ birthdays, colorful mixed flowers or a dessert-forward gift often feel more playful than formal roses. When ordering for someone you do not know well, stick to classic color palettes and skip overly romantic styling. Always double-check the delivery address and preferred arrival day—arriving a day early is usually kinder than a day late. If the recipient has allergies or dietary needs, prefer plants, non-edible hampers, or confirm cake flavors before you order.",
    faqs: [
      {
        q: "What are good birthday flower choices for USA delivery?",
        a: "Bright mixed bouquets, seasonal blooms, and classic roses work well for most birthdays. Pair flowers with a cake or small hamper when you want a fuller celebration gift.",
      },
      {
        q: "Can I get same-day birthday gift delivery?",
        a: "Same-day options may be available for eligible products in select cities when you order before the local cut-off. Check the product page and checkout guidance for your recipient’s ZIP.",
      },
      {
        q: "Should I include a birthday message?",
        a: "Yes—most BlossomPot gifts support a personal message. Keep it short, name the occasion, and add one specific wish or memory.",
      },
    ],
  },
  {
    slug: "anniversary",
    title: "Anniversary Flowers & Romantic Gifts USA | BlossomPot",
    h1: "Anniversary Flowers, Roses & Romantic Gift Ideas",
    primaryKeyword: "anniversary flowers USA",
    secondaryKeywords: [
      "anniversary roses",
      "romantic gift delivery",
      "anniversary cake",
      "send anniversary flowers",
    ],
    categorySlug: "anniversary-gifts",
    matchTokens: ["anniversary", "rose", "romantic", "love"],
    intro:
      "Anniversaries are about marking time together—quietly or grandly. BlossomPot’s anniversary gifts focus on romantic flowers, elegant rose arrangements, celebration cakes, and keepsake-style hampers you can send across the USA. Red and soft pink roses remain timeless for couples, while pastel mixed bouquets feel thoughtful for milestone years when you want softness over drama. Many customers schedule delivery for the morning of the anniversary so the gift arrives before evening plans, or they ship a day early when the couple is traveling. Add a short message that references the year or a shared detail; specificity makes the gift feel intentional. If you are shopping from another state or country, enter the recipient’s US address at checkout and review shipping windows before you pay. From classic dozen roses to flower-and-dessert combos, choose a presentation that matches your relationship—intimate, celebratory, or simply grateful for another year. Couples often appreciate gifts that arrive ready to display, so choose designs with clear presentation and include vase expectations only when the product description supports them. If you are shopping together with family members, agree on one primary gift to avoid duplicate deliveries on the same day.",
    etiquette:
      "Anniversary gifts should feel personal without pressure. Romantic styling is appropriate for partners; for parents’ or friends’ anniversaries, choose elegant mixed blooms and warmer, less intimate wording. Avoid overly public surprises at work unless you know they welcome attention. If you are coordinating with dinner reservations, confirm delivery windows so flowers do not arrive after everyone has left. A brief note that names the milestone (“happy 10 years”) reads more thoughtfully than generic love quotes alone. When budget is modest, a well-chosen bouquet with a sincere message often outperforms a rushed luxury add-on. Confirm whether the couple prefers home or workplace delivery, and avoid surprising a partner at the office unless you know it will be welcome. When ordering internationally into the USA, leave buffer time around weekends and holidays so the anniversary date is protected.",
    faqs: [
      {
        q: "What flowers are best for anniversaries?",
        a: "Roses are the classic anniversary choice. Soft mixed bouquets and romantic pink-and-cream arrangements also work beautifully for milestone celebrations.",
      },
      {
        q: "Can I send anniversary flowers and a cake together?",
        a: "Yes—many shoppers pair flowers with celebration cakes or dessert-forward hampers. Browse anniversary and cake collections, then add a shared gift message at checkout.",
      },
      {
        q: "When should anniversary gifts arrive?",
        a: "Morning-of delivery is popular when available. If timing is tight, ordering for the day before is often safer than risking a late arrival.",
      },
    ],
  },
  {
    slug: "sympathy",
    title: "Sympathy Flowers & Condolence Gifts USA | BlossomPot",
    h1: "Sympathy Flowers & Thoughtful Condolence Gifts",
    primaryKeyword: "sympathy flowers USA",
    secondaryKeywords: [
      "condolence flowers",
      "funeral flowers delivery",
      "sympathy gift ideas",
      "send sympathy bouquet",
    ],
    categorySlug: "flowers",
    matchTokens: ["sympathy", "condolence", "white", "peaceful", "lily"],
    intro:
      "When words feel small, a carefully chosen sympathy arrangement can offer quiet presence. BlossomPot provides guidance and floral options suitable for condolence gifting across the United States—soft whites, gentle greens, and calm mixed bouquets that prioritize dignity over spectacle. Sympathy flowers are often sent to a home, service venue, or family gathering; always confirm where the family prefers deliveries and whether a service has specific timing rules. Keep your message brief, compassionate, and free of advice. Plants and understated arrangements can be meaningful when the family already has many cut flowers. Because grief schedules are unpredictable, flexible delivery windows and clear product descriptions matter more than rush marketing. Shop peaceful floral styles, add a short condolence note, and choose packaging that arrives neat and respectful. BlossomPot focuses on honest delivery expectations so your gesture reaches people at a difficult time without unnecessary complication. If you are unsure which style to choose, prioritize calm whites, soft greens, and simple wrapping over elaborate celebration designs. Support teams can help with address questions, but the tone of the note should always come from you.",
    etiquette:
      "Sympathy etiquette favors restraint. Use simple language—“Thinking of you,” “With sympathy,” or a short personal memory if appropriate. Avoid cheerful colors or celebratory cakes unless the family has requested something specific. Do not ask for details about the loss in your gift note. If sending to a workplace or service, choose sturdy arrangements and confirm the correct name on the order. When multiple relatives may receive flowers, consider a single thoughtful arrangement for the household rather than many small gifts. Respect cultural and religious preferences when known; when unsure, classic white and green florals are a safe default. When multiple friends want to contribute, pooling for one dignified arrangement is often kinder than a flood of competing deliveries. Never include promotional language, upsells, or requests for updates in a condolence message.",
    faqs: [
      {
        q: "What flowers are appropriate for sympathy?",
        a: "Soft white, cream, and green arrangements are traditional. Peaceful mixed bouquets and understated designs are usually more appropriate than bright party florals.",
      },
      {
        q: "Where should sympathy flowers be delivered?",
        a: "Confirm with the family whether to send to a home, service location, or gathering. Always use the exact name and address they provide.",
      },
      {
        q: "What should I write on a sympathy card?",
        a: "Keep it brief and compassionate. A short expression of support or a gentle memory is enough—avoid advice or lengthy explanations.",
      },
    ],
  },
  {
    slug: "get-well",
    title: "Get Well Flowers & Care Packages USA | BlossomPot",
    h1: "Get Well Soon Flowers & Cheerful Care Gifts",
    primaryKeyword: "get well flowers USA",
    secondaryKeywords: [
      "get well soon bouquet",
      "hospital flower delivery",
      "get well gift basket",
      "cheer up flowers",
    ],
    categorySlug: "flowers",
    matchTokens: ["get well", "wellness", "cheer", "bright", "care"],
    intro:
      "A get-well gift should feel uplifting without demanding energy from someone who is resting. BlossomPot’s get-well ideas include cheerful mixed flowers, soft pastel bouquets, and light gift hampers that travel well across the USA. Bright but gentle color stories—yellows, soft pinks, and fresh greens—often read as hopeful without being loud. If delivering to a hospital or care facility, check visitor and flower policies first; some locations restrict strong fragrance, latex balloons, or large arrangements. For home recovery, a compact bouquet or a small treats hamper can brighten a room without creating extra work. Add a short note that focuses on care and patience rather than pressure to “feel better fast.” Review product pages for delivery windows, especially if timing around appointments matters. Thoughtful get-well gifting is less about grandeur and more about comfort, clarity, and a kind message arriving when it helps most. Recovery gifts should respect energy levels: compact designs, easy-care presentation, and notes that do not demand a reply. BlossomPot product pages outline delivery windows so you can aim for a quiet afternoon rather than a hectic morning of appointments.",
    etiquette:
      "Ask before sending flowers to a medical facility—policies vary widely. Prefer lighter scents and manageable sizes. Keep messages warm and low-pressure; avoid humor that could feel dismissive. If the person is on a restricted diet, skip edible gifts or confirm first. For colleagues, a shared office-friendly bouquet or a card-plus-small-plant approach can be considerate. Always include your name so the recipient knows who sent the care package. When recovery may take time, a simple check-in message with the gift matters as much as the blooms themselves. If the person is contagious or immunocompromised, ask a household member before sending anything scented or edible. Offer practical support in your note only if you can follow through, and otherwise keep the message simply kind.",
    faqs: [
      {
        q: "Can I send get-well flowers to a hospital?",
        a: "Sometimes—policies differ by facility. Confirm rules on flowers, fragrance, and delivery desks before ordering to a hospital address.",
      },
      {
        q: "What colors work for get-well bouquets?",
        a: "Soft yellows, pinks, lavenders, and fresh greens feel hopeful and calm. Extremely formal funeral whites are usually better reserved for sympathy.",
      },
      {
        q: "Are gift hampers good get-well presents?",
        a: "Yes, when diet and facility rules allow. Light snack hampers or non-edible comfort gifts can be easier than large floral displays.",
      },
    ],
  },
  {
    slug: "thank-you",
    title: "Thank You Flowers & Appreciation Gifts USA | BlossomPot",
    h1: "Thank-You Flowers & Appreciation Gift Ideas",
    primaryKeyword: "thank you flowers USA",
    secondaryKeywords: [
      "appreciation bouquet",
      "thank you gift delivery",
      "gratitude flowers",
      "hostess thank you gift",
    ],
    categorySlug: "gift-hampers",
    matchTokens: ["thank", "appreciation", "gratitude", "hostess"],
    intro:
      "Thank-you gifts turn everyday gratitude into something tangible. BlossomPot makes it easy to send thank-you flowers, polished bouquets, and compact appreciation hampers throughout the United States—ideal after hospitality, mentorship, client support, or a favor that made a difference. Soft mixed blooms and cheerful seasonal arrangements feel warm without implying romance, while a small dessert or gourmet-style add-on can make the gesture feel complete. Because thank-you moments are often time-sensitive, many customers choose reliable nationwide shipping or same-day eligible options in select cities when available. Your note can be short: name what you are thanking them for and leave it there. That specificity is what makes appreciation gifts memorable. Explore flowers and hamper collections, match the formality to your relationship, and choose presentation that looks intentional when it arrives at a home or office doorstep. Appreciation gifts also work well after interviews, vendor partnerships, or neighborhood favors where a handwritten card alone feels incomplete. Choose colors that feel warm rather than romantic unless the relationship clearly calls for it, and keep packaging tidy for office reception desks.",
    etiquette:
      "Be specific in your thank-you note—mention the dinner, help, or project by name. For professional contexts, keep styling elegant and avoid overly romantic red roses. Office deliveries should be moderate in size and fragrance. If thanking a host, send within a few days while the occasion is fresh. When multiple people helped, consider individual notes even if the physical gift is shared. Budget-friendly does not mean careless; tidy packaging and a clear message matter more than upgrading every add-on. Send promptly while the kindness is still fresh in memory. If thanking a team, address the note to the group and name the project. Avoid gifts that create obligation or look like an attempt to influence a business decision.",
    faqs: [
      {
        q: "What is a good thank-you flower arrangement?",
        a: "Mixed seasonal bouquets and soft pastel designs are versatile. They read as warm appreciation without the romantic tone of classic red roses.",
      },
      {
        q: "Can I send a thank-you gift to an office?",
        a: "Yes—choose a manageable bouquet or compact hamper and include a clear recipient name and suite or desk detail when possible.",
      },
      {
        q: "How soon should thank-you gifts arrive?",
        a: "Within a few days of the favor or event is ideal. If timing is tight, a sincere note with a scheduled delivery still feels thoughtful.",
      },
    ],
  },
  {
    slug: "congratulations",
    title: "Congratulations Flowers & Celebration Gifts USA | BlossomPot",
    h1: "Congratulations Flowers, Cakes & Celebration Gifts",
    primaryKeyword: "congratulations flowers USA",
    secondaryKeywords: [
      "congrats bouquet",
      "promotion gift ideas",
      "celebration cake delivery",
      "new job flowers",
    ],
    categorySlug: "celebration-gifts",
    matchTokens: ["congrat", "celebration", "promotion", "success"],
    intro:
      "Congratulations gifts should feel bright, proud, and forward-looking. Whether someone earned a promotion, closed a deal, passed an exam, or reached a personal milestone, BlossomPot offers celebratory flowers, cakes, and gift hampers for USA delivery. Bold mixed bouquets, cheerful color blocking, and dessert pairings help the moment feel marked—not muted. Many shoppers send congratulations gifts to offices; when you do, keep arrangements practical and include precise delivery details. For home celebrations, a cake-and-flower combination can double as both gesture and shared treat. Write a message that names the achievement so the gift documents the win, not just a generic “congrats.” Review delivery windows on each product page, especially if you are coordinating with a party date. From understated elegance to festive flair, choose a style that matches how public or personal the accomplishment is. Milestone congratulations also fit new homes, published work, and personal goals that deserve recognition outside traditional holidays. BlossomPot’s celebration collections make it easy to match energy level—quiet elegance for private wins, brighter florals for public parties.",
    etiquette:
      "Name the achievement in your card. For workplace congratulations, avoid overly personal or romantic styling. If several colleagues are contributing, one well-chosen shared gift often looks more polished than many tiny deliveries. Do not exaggerate claims about the person’s role or results in the note—keep praise accurate. When the recipient is modest, a refined bouquet may land better than an oversized display. Timing near the announcement or party usually feels most relevant. Ask whether the recipient wants public recognition before sending a large office display. Keep comparisons to other people out of the card, and focus on their effort and outcome. If budget is shared among friends, decide the amount before browsing so the final pick stays cohesive.",
    faqs: [
      {
        q: "What gifts work for job promotions?",
        a: "Elegant mixed flowers, celebration cakes, or a polished hamper are popular. Keep office deliveries neat and professionally styled.",
      },
      {
        q: "Should congratulations flowers be colorful?",
        a: "Often yes—bright, celebratory palettes suit milestones. Softer tones work when you want elegance over festivity.",
      },
      {
        q: "Can I schedule congratulations gifts for a party date?",
        a: "Yes—choose a delivery day that matches the celebration and confirm available windows at checkout for the recipient address.",
      },
    ],
  },
  {
    slug: "new-baby",
    title: "New Baby Flowers & Welcome Gifts USA | BlossomPot",
    h1: "New Baby Flowers & Welcome Gift Ideas",
    primaryKeyword: "new baby flowers USA",
    secondaryKeywords: [
      "baby shower flowers",
      "newborn gift delivery",
      "welcome baby bouquet",
      "new parents gift hamper",
    ],
    categorySlug: "gift-hampers",
    matchTokens: ["baby", "newborn", "shower", "welcome"],
    intro:
      "Welcoming a new baby is tender, busy, and often sleep-deprived—gifts should reduce friction, not add it. BlossomPot’s new-baby ideas include soft pastel flowers, gentle mixed bouquets, and parent-friendly hampers designed for USA delivery. Soft pinks, blues, creams, and greens feel classic; gender-neutral palettes are a thoughtful default when preferences are unknown. Many families appreciate gifts that arrive after the first whirlwind days rather than at the hospital door. Compact arrangements and practical treat boxes can brighten a nursery corner without demanding vase logistics beyond the basics. Your message can congratulate both baby and parents, keep wishes short, and offer support without asking for visits or updates. Shop floral and hamper collections with calm styling, confirm the home address, and choose delivery timing that respects resting schedules. A kind, low-maintenance gift is often the most memorable welcome. Welcome gifts can also support parents with easy treats or calm florals that do not require elaborate setup after sleepless nights. When possible, coordinate with close family so multiple identical bouquets do not arrive on the same afternoon.",
    etiquette:
      "Prefer gender-neutral or soft pastel designs unless the family has shared a preference. Avoid strong fragrance near newborns when possible. Do not show up unannounced with a large entourage of gifts. Keep notes warm and free of parenting advice. If sending edibles, consider that new parents may appreciate easy snacks more than elaborate desserts. Hospital deliveries can be complicated—home delivery a few days later is often kinder. Include your full name; exhausted parents may not recognize a nickname alone. Respect visiting boundaries and never pressure parents for photos in exchange for a gift. If you include clothing or toys in a broader plan, keep floral styling soft and non-allergenic when you know sensitivities exist in the household.",
    faqs: [
      {
        q: "When should new-baby gifts be delivered?",
        a: "A few days after birth to the home is often ideal. Confirm whether the family prefers hospital delivery before ordering there.",
      },
      {
        q: "Are pastel flowers appropriate for newborns?",
        a: "Yes—soft pastels and gentle mixed bouquets are classic. Gender-neutral creams and greens are a thoughtful choice when unsure.",
      },
      {
        q: "What message should I write for new parents?",
        a: "Offer warm congratulations and a short wish for rest and joy. Skip advice and requests for photos or visits.",
      },
    ],
  },
  {
    slug: "housewarming",
    title: "Housewarming Flowers & Home Gifts USA | BlossomPot",
    h1: "Housewarming Flowers, Plants & Gift Ideas",
    primaryKeyword: "housewarming flowers USA",
    secondaryKeywords: [
      "housewarming gift delivery",
      "new home flowers",
      "plants for housewarming",
      "home sweet home gift",
    ],
    categorySlug: "plants",
    matchTokens: ["housewarming", "home", "plant", "new home"],
    intro:
      "A new home deserves a gift that feels settled and welcoming. BlossomPot offers housewarming flowers, plants, and curated gift ideas with USA delivery so you can celebrate movers near or far. Plants and lasting greenery are popular because they grow with the space; fresh bouquets bring instant color for a first evening in the house. Soft neutrals, leafy greens, and cheerful mixed blooms suit most interiors without clashing with unknown décor. Many hosts open gifts during a gathering—choose sturdy packaging and include a note that references the new address or neighborhood if you know it. If the move is still in progress, schedule delivery for after the heavy boxes day so someone is home to receive it. Explore plants, flowers, and hamper options, match scale to apartment versus house, and keep the gesture warm rather than extravagant unless you know the hosts well. Housewarming presents are also useful when friends relocate across state lines and cannot host a party right away—schedule delivery for a weekend evening when someone is likely home. BlossomPot’s plants and floral options help you match apartment living versus larger houses without guessing square footage.",
    etiquette:
      "Ask about plant care comfort before sending high-maintenance greenery. For renters or frequent movers, a bouquet or non-plant hamper may be easier. Avoid overly large arrangements that dominate a small entryway. If attending a housewarming party, coordinating delivery for the event day can be lovely—confirm someone can accept the order. Keep the card light and happy; this is a celebration of beginnings. When sending from out of town, double-check unit numbers and gate codes in the delivery instructions. Include clear unit and buzzer details for multi-family buildings. If the hosts are still painting or renovating, a later delivery date often works better than arriving during chaos. Keep the card light, local, and free of unsolicited décor advice.",
    faqs: [
      {
        q: "Are plants better than cut flowers for housewarmings?",
        a: "Plants last longer and suit many new homes, but cut flowers are perfect for an immediate celebration. Choose based on the recipient’s lifestyle.",
      },
      {
        q: "What if I do not know their décor style?",
        a: "Greens, soft neutrals, and simple mixed bouquets are safe. Avoid ultra-specific theme colors unless you know their preferences.",
      },
      {
        q: "Can housewarming gifts be delivered same-day?",
        a: "In select cities, same-day eligible products may be available before local cut-off. Otherwise, schedule a reliable delivery window around move-in.",
      },
    ],
  },
  {
    slug: "graduation",
    title: "Graduation Flowers & Congrats Gifts USA | BlossomPot",
    h1: "Graduation Flowers, Cakes & Congrats Gift Ideas",
    primaryKeyword: "graduation flowers USA",
    secondaryKeywords: [
      "graduation bouquet",
      "congrats grad gifts",
      "graduation cake delivery",
      "send graduation flowers",
    ],
    categorySlug: "celebration-gifts",
    matchTokens: ["graduation", "grad", "school", "diploma"],
    intro:
      "Graduation marks effort, transition, and pride—gifts should feel celebratory and portable enough for busy ceremony weekends. BlossomPot helps you send graduation flowers, cheerful bouquets, cakes, and gift hampers across the USA to homes, party venues, or family gatherings. School colors can inspire palettes when you know them; otherwise bright mixed blooms and festive cakes are crowd-pleasers. Many families prefer delivery to the graduate’s home on party day rather than to a crowded ceremony site. A short note naming the school or degree makes the gift feel anchored in the achievement. If relatives are coordinating presents, flowers plus a dessert can complement cash or practical gifts without competing. Check product pages for timing options and same-day eligibility in select areas. From high school to advanced degrees, choose a style that matches the graduate’s personality—bold and fun, or clean and elegant. Graduation weekends move quickly, so flexible USA delivery windows and accurate family addresses matter more than ceremony-site drop-offs. Pair flowers with a dessert only when you know there will be a gathering large enough to enjoy it.",
    etiquette:
      "Confirm the best delivery address; campuses and venues can be hard for couriers. Keep messages proud but not preachy about the future. For group gifts, one polished arrangement often photographs better for family memories. Avoid fragile add-ons if the graduate is traveling soon after. If multiple celebrations span different cities, send to where the graduate will actually be staying. Name the milestone clearly so the card remains meaningful years later. Avoid clogging the graduate’s phone with delivery questions—coordinate with a parent or roommate instead. Keep gift messaging proud but grounded, and skip pressure about jobs or next degrees unless they have invited that conversation.",
    faqs: [
      {
        q: "Where should graduation flowers be sent?",
        a: "Home or party venues are usually easier than ceremony sites. Confirm the address with family before ordering.",
      },
      {
        q: "Do school colors matter for graduation bouquets?",
        a: "They are a nice touch when known, but bright mixed flowers and celebration cakes work well for any graduate.",
      },
      {
        q: "Can I include a graduation cake with flowers?",
        a: "Yes—flower-and-cake pairings are popular for grad parties. Add one shared message covering both items when possible.",
      },
    ],
  },
  {
    slug: "wedding",
    title: "Wedding Flowers & Couple Gift Ideas USA | BlossomPot",
    h1: "Wedding Flowers, Romantic Gifts & Couple Celebrations",
    primaryKeyword: "wedding flowers gifts USA",
    secondaryKeywords: [
      "wedding gift delivery",
      "congrats newlyweds flowers",
      "bridal shower flowers",
      "couple anniversary style gifts",
    ],
    categorySlug: "wedding-gifts",
    matchTokens: ["wedding", "bridal", "newlywed", "couple"],
    intro:
      "Wedding gifting spans showers, ceremony weekends, and newlywed congratulations. BlossomPot focuses on elegant flowers, romantic bouquets, and refined gift presentations you can send across the United States—whether you attend in person or celebrate from afar. Soft romantic palettes, classic whites and blushes, and premium rose arrangements suit many couples; brighter celebration styles work for lively receptions. Always follow the couple’s registry preferences when they exist; flowers remain a warm gesture alongside practical gifts. Delivery timing matters: pre-wedding showers, hotel suites, or post-honeymoon homecomings each need different addresses. Include a concise congratulations note that uses both names when appropriate. Review shipping windows and any same-day options in select cities if last-minute travel plans change. Choose quality presentation over quantity—wedding weekends are busy, and a well-chosen bouquet can still feel personal amid many presents. Guests sending from another state should prioritize reliable delivery dates over last-minute upgrades. BlossomPot wedding-adjacent collections emphasize elegant presentation that photographs well without competing with the couple’s florist of record for the ceremony itself.",
    etiquette:
      "Respect registries and stated wishes. Do not send large surprise installations to venues without coordinator approval. For destination weddings, confirm whether gifts should go to a local address or wait until the couple returns home. Keep card wording inclusive of both partners. Avoid overly personal romantic notes if you are a colleague rather than a close friend. If contributing to a group gift, coordinate so duplicates are minimized. Neat packaging and accurate name spelling matter on wedding weekend. Do not attempt to redesign the wedding color story unless asked. If the couple requested no gifts, honor that and send a card alone. For plus-ones contributing separately, align so the household does not receive three near-identical bouquets on the same morning.",
    faqs: [
      {
        q: "Are flowers appropriate if the couple has a registry?",
        a: "Yes—flowers are a lovely complementary gesture. Many guests send blooms for the shower, suite, or homecoming in addition to a registry gift.",
      },
      {
        q: "When should wedding congratulations flowers arrive?",
        a: "Common choices are the rehearsal dinner day, wedding morning at a prep location (with permission), or after the honeymoon at home.",
      },
      {
        q: "What colors suit wedding congratulations bouquets?",
        a: "Ivory, blush, soft neutrals, and classic roses are timeless. Match wedding colors only when you know them with confidence.",
      },
    ],
  },
  {
    slug: "valentines",
    title: "Valentine’s Day Flowers & Romantic Gifts USA | BlossomPot",
    h1: "Valentine’s Day Flowers, Roses & Romantic Gifts",
    primaryKeyword: "Valentine's Day flowers USA",
    secondaryKeywords: [
      "Valentine roses delivery",
      "romantic Valentine gifts",
      "Valentine cake flowers",
      "send Valentine bouquet",
    ],
    categorySlug: "valentines-day-gifts",
    matchTokens: ["valentine", "rose", "romantic", "love"],
    intro:
      "Valentine’s Day is peak romantic gifting—roses, soft pinks, chocolate pairings, and messages that say you planned ahead. BlossomPot offers Valentine’s flowers, classic rose bouquets, cakes, and romantic gift sets with USA delivery guidance on every product page. Red roses remain iconic, while blush roses and mixed romantic blooms offer a fresher look for couples who prefer less tradition. Because February demand is high, ordering early improves delivery date choice; same-day eligible options may still appear in select cities before local cut-offs. Pair flowers with a dessert or compact hamper when you want a fuller surprise. Keep your note personal and specific rather than copying a stock poem. Whether you are celebrating a new relationship or a long partnership, choose a presentation that fits your shared style—dramatic, minimal, or playfully sweet—and confirm the recipient address carefully amid busy holiday logistics. Valentine’s logistics reward early checkout: preferred dates fill quickly, and clear recipient details prevent hallway mix-ups in apartment buildings. If you are celebrating friendship instead of romance, choose cheerful mixed blooms and lighter wording so the gesture stays comfortable.",
    etiquette:
      "Order earlier than you think you need to during Valentine week. If sending to a workplace, consider privacy and arrangement size. Romantic red roses are best for partners; for friends, choose friendly mixed blooms and lighter wording. Avoid public proposals via delivery unless you are certain it will be welcome. Double-check name spelling and apartment numbers. A sincere short message usually outperforms a long generic love letter pasted from the internet. Be mindful of shared workplaces and roommates when planning a surprise. If a relationship is new, a thoughtful mid-size bouquet often feels more considerate than an oversized display. Always verify spelling of names and nicknames before the card is printed.",
    faqs: [
      {
        q: "When should I order Valentine’s flowers?",
        a: "Earlier in February is safest for preferred delivery dates. Last-minute same-day options may exist only for eligible products in select cities.",
      },
      {
        q: "Are mixed bouquets okay instead of red roses?",
        a: "Absolutely—blush roses and romantic mixed blooms are popular and often feel more personal than a default dozen red roses.",
      },
      {
        q: "Can I combine Valentine flowers with cake?",
        a: "Yes—flower-and-cake combinations make a memorable Valentine surprise. Add one clear romantic message at checkout.",
      },
    ],
  },
  {
    slug: "mothers-day",
    title: "Mother’s Day Flowers & Gifts USA | BlossomPot",
    h1: "Mother’s Day Flowers, Brunches & Thoughtful Gifts",
    primaryKeyword: "Mother's Day flowers USA",
    secondaryKeywords: [
      "Mother's Day bouquet",
      "gifts for mom delivery",
      "Mother's Day cake flowers",
      "send flowers for Mother's Day",
    ],
    categorySlug: "mothers-day-gifts",
    matchTokens: ["mother", "mom", "mum", "mothers day"],
    intro:
      "Mother’s Day gifts should feel grateful, warm, and easy to enjoy. BlossomPot curates Mother’s Day flowers, soft bouquets, cakes, and thoughtful hampers for delivery across the United States. Pastel mixed blooms, garden-inspired arrangements, and classic roses are perennial favorites; plants can be meaningful for moms who love lasting greenery. Many families coordinate brunch timing with morning flower delivery so the celebration starts at the door. If siblings are sharing a gift, one beautiful arrangement with a joint note often feels more special than fragmented presents. Long-distance children especially rely on clear USA shipping windows and gift messages that sound like their voice. Browse Mother’s Day and flowers collections, choose colors she actually loves, and avoid last-minute stress by confirming address and delivery day early. The best Mother’s Day gift reads as appreciation—not obligation—backed by careful presentation and a sincere few lines. Mother’s Day demand is seasonal, so ordering ahead improves the chance of your preferred delivery day. BlossomPot pages highlight flowers, cakes, and hampers that feel grateful rather than generic, with room for a message that sounds like your actual voice—not a template.",
    etiquette:
      "Use the name she prefers—Mom, Mama, first name, or a family nickname. If multiple children contribute, sign everyone’s names. Consider allergies and fragrance sensitivity. For moms who dislike clutter, a refined bouquet may beat a bulky basket. If she hosts brunch, schedule delivery before guests arrive. Keep the note specific: mention a quality you admire or a recent kindness. Avoid guilt-tinged language; gratitude lands better than apology essays. If Mom cares for others all year, make the gift easy to receive and enjoy without extra errands. Coordinate with siblings early, confirm the address once, and avoid turning the card into a list of apologies. Appreciation should feel steady, specific, and kind.",
    faqs: [
      {
        q: "What flowers are popular for Mother’s Day?",
        a: "Soft mixed bouquets, garden-style blooms, pink roses, and cheerful pastels are favorites. Plants are great for moms who enjoy lasting greenery.",
      },
      {
        q: "Can siblings share one Mother’s Day flower order?",
        a: "Yes—one polished arrangement with all names on the card often feels more intentional than several small separate gifts.",
      },
      {
        q: "Should Mother’s Day gifts arrive in the morning?",
        a: "Morning delivery is popular when available, especially before brunch. Choose the window that fits her plans and confirm at checkout.",
      },
    ],
  },
];

const bySlug = new Map(occasionPages.map((o) => [o.slug, o]));

export function getOccasion(slug: string): OccasionPage | undefined {
  return bySlug.get(slug);
}

export function allOccasionSlugs(): string[] {
  return occasionPages.map((o) => o.slug);
}

export function occasionCategoryHref(occasion: OccasionPage): string {
  return categoryHref(occasion.categorySlug);
}
