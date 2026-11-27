// Guardian Portfolio: guidance content shown on the landing page and in the editor.

/** Gig ideas that suit CSS aspirants. Used as one-click templates in the editor. */
export const GIG_IDEAS = [
  {
    title: 'I will review your CSS essay and give detailed feedback',
    category: 'Writing',
    description:
      'Line-by-line comments on structure, argument and English, plus a short note on how to raise your score. Delivered as an annotated PDF.',
    price: '1500',
    delivery: '2 days',
  },
  {
    title: 'I will teach English grammar and précis writing online',
    category: 'Tutoring',
    description: 'One-to-one sessions on Zoom or WhatsApp video: grammar, précis, comprehension and sentence correction.',
    price: '2000',
    delivery: '1 hour session',
  },
  {
    title: 'I will translate Urdu documents into clear English',
    category: 'Translation',
    description: 'Accurate Urdu to English (or English to Urdu) translation of letters, articles and documents, proofread before delivery.',
    price: '1000',
    delivery: '1 day',
  },
  {
    title: 'I will write well-researched articles and blog posts',
    category: 'Writing',
    description: 'Original, plagiarism-free articles on current affairs, education or business, with sources listed.',
    price: '2500',
    delivery: '3 days',
  },
  {
    title: 'I will tutor Matric and FSc students in my subject',
    category: 'Tutoring',
    description: 'Home or online tuition with weekly tests and progress updates for parents.',
    price: '8000',
    delivery: 'Monthly',
  },
  {
    title: 'I will prepare research summaries and literature reviews',
    category: 'Research',
    description: 'Clear summaries of reports, books or papers with key points, quotes and references.',
    price: '3000',
    delivery: '4 days',
  },
  {
    title: 'I will design social media posts in Canva',
    category: 'Design',
    description: '10 branded posts for Instagram or Facebook, with editable Canva links.',
    price: '3500',
    delivery: '3 days',
  },
  {
    title: 'I will do accurate data entry and typing in MS Office',
    category: 'Data entry',
    description: 'Typing from scans or images into Word or Excel, formatted and checked twice.',
    price: '1200',
    delivery: '2 days',
  },
]

/** A clearly labelled example profile for /guardian-portfolio/example. Fictional. */
export const EXAMPLE_PORTFOLIO = {
  display_name: 'Ayesha Malik',
  headline: 'CSS aspirant · English tutor and essay reviewer',
  offer: 'I help CSS and university students write clearer essays and précis, and score higher in English.',
  bio:
    'I am preparing for CSS while teaching English to Matric, FSc and CSS students. I studied English literature at university and have reviewed more than 150 practice essays. I give honest, specific feedback and deliver on time.',
  city: 'Lahore',
  rate_text: 'From Rs 1,500 per essay',
  skillsText: 'Essay feedback, Précis writing, English grammar, Urdu–English translation, Research writing, MS Word',
  links: { whatsapp: '', website: '', upwork: '', fiverr: '', linkedin: '' },
  slug: 'example',
  is_public: true,
  photo_path: '',
  photoUrl: '',
  gigs: [
    { id: 'ex-1', ...GIG_IDEAS[0], currency: 'PKR', cover_path: '', coverUrl: '' },
    { id: 'ex-2', ...GIG_IDEAS[1], currency: 'PKR', cover_path: '', coverUrl: '' },
    { id: 'ex-3', ...GIG_IDEAS[2], currency: 'PKR', cover_path: '', coverUrl: '' },
  ],
}

export const EXAMPLE_ITEMS = [
  {
    id: 'ex-item-1',
    title: 'Sample essay feedback (annotated)',
    description: 'How a 2,500-word CSS essay was reviewed: comments on outline, arguments and language.',
    itemType: 'document',
  },
  {
    id: 'ex-item-2',
    title: 'Précis lesson plan',
    description: 'A four-week plan used with online students, with practice passages and answers.',
    itemType: 'document',
  },
]

export const HOW_IT_WORKS = [
  {
    title: 'Create your profile',
    text: 'Add your name, a one-line headline, what you offer and your skills. Add a photo if you like.',
  },
  {
    title: 'Publish your gigs',
    text: 'List up to 5 services with a clear title, what the client gets, a starting price and delivery time.',
  },
  {
    title: 'Show your work',
    text: 'Upload samples or add links: essays, translations, designs, lesson plans. Proof wins clients.',
  },
  {
    title: 'Share one link and get orders',
    text: 'Publish your profile, share your link on WhatsApp and social media, and clients contact you directly.',
  },
]

export const SAFETY_TIPS = [
  'Agree the work, price and deadline in writing (WhatsApp is fine) before you start.',
  'For new clients, ask for part of the payment in advance through a bank or mobile wallet.',
  'Never share passwords, CNIC copies or bank PINs with anyone.',
  'Deliver original work. Do not copy, and do not take on dishonest jobs such as sitting exams for others.',
  'Keep your study plan first: take on only as much work as your preparation allows.',
]

export const PORTFOLIO_FAQ = [
  {
    q: 'Is Guardian Portfolio really free?',
    a: 'Yes. There are no fees and no commission. Guardian Angel never takes a share of what you earn.',
  },
  {
    q: 'How do clients pay me?',
    a: 'Clients contact you directly through WhatsApp or your links, and you agree payment between you (for example bank transfer, JazzCash or Easypaisa). Guardian Angel does not handle payments and is not part of the agreement.',
  },
  {
    q: 'Who can see my profile?',
    a: 'Only you, until you publish it. Once published, anyone with your link can see it and it appears on the Browse page. You can unpublish at any time.',
  },
  {
    q: 'Do I need to be a CSS aspirant?',
    a: 'Guardian Portfolio is built for CSS Jawans, but any Guardian Angel member can create a profile.',
  },
  {
    q: 'What should I offer?',
    a: 'Start with what you already do well: writing, teaching, translation, research or design. Look at the gig ideas below for inspiration.',
  },
]
