import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import copyShareIcon from '../assets/copy-share-icon.svg'
import whatsappShareIcon from '../assets/whatsapp-share-icon.svg'
import { formatNewsTimestamp } from '../utils/formatNewsTimestamp.js'
import { slugify } from '../data/syllabusData'
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'
import { MS_PER_DAY, SITE_URL } from '../siteConfig.js'

const blogPosts = [
  {
    slug: 'academy-dependence-cripples-css-aspirants',
    title: 'Academy Dependence Can Cripple Your CSS Potential',
    date: '2026-04-08T12:15:00+05:00',
    readTime: '7 min read',
    author: 'Guardian Angel',
    excerpt: `Many CSS aspirants think that joining an academy is the golden ticket to success. They believe that if they enroll in a famous academy, follow its instructions blindly, and consume every note and lecture it offers, they will automatically become toppers. But this is an illusion. Just like a bird cannot experience its full potential unless it spreads its wings, a person cannot discover his true abilities if he remains dependent on an academy.
Academies often inject fear into students, making them believe they are incomplete or incapable without external guidance. They create a mindset where aspirants feel lost without constant instruction. In reality, academies are running businesses. They brand CSS as a product, sell notes, organize workshops, podcasts, and events, all in the name of success, while the true purpose of CSS, serving the nation with knowledge and integrity, is overshadowed.
Blind dependence makes students passive. They stop thinking, analyzing, and questioning. They rely on pre-made arguments, popular opinions, and ready-made answers, instead of developing their own insight. This is the true danger: the student becomes crippled intellectually, losing creativity and independence.
CSS is not a brand or a business; it is a national duty. Success comes from consistent effort, self-study, critical thinking, and a sincere desire to serve. Top CSS officers were not products of academies; they were individuals who questioned, explored, and learned from multiple sources, building their own understanding.  
If you want to fly, do not depend on anyone to hold your wings. Explore, think, make mistakes, and create your own path. The academy can provide guidance, but it cannot give you your potential. That is yours to discover.`,
    internalLinks: [
    { label: 'Read CSS Rules and Standards', to: '/css-rules' },
    { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
    ],
    externalLinks: [
    { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
    { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
    ]
    }, 
    {
      slug: 'biggest-motivation-for-css',
      title: 'The True Motivations Behind Pursuing CSS',
      date: '2026-04-08T12:45:00+05:00',
      readTime: '6 min read',
      author: 'Guardian Angel',
      excerpt: `The biggest motivation for CSS is not just personal success. It is deeper and more meaningful than marks or ranks. The first motivation is your parents. They had dreams when they were your age, visions to achieve something great, but life circumstances did not allow them to fulfill them. Now, through you, they see their unfulfilled dreams come alive. Every effort you make honors them and their sacrifices.
The second motivation is your nation. Pakistan needs honest and dedicated officers who can serve with integrity, improve systems, and contribute to a prosperous future. Your hard work in CSS is not just for a personal goal; it is a commitment to serve the people and bring positive change.
The third motivation is to live a life of honor and integrity. Eat halal, work with dedication, and become a great officer whose contributions are recognized even after retirement. True greatness is not just in the rank but in the respect, trust, and legacy you leave behind. A great officer leaves behind not only a professional reputation but a life of exemplary character and service.`,
      internalLinks: [
      { label: 'Read CSS Rules and Standards', to: '/css-rules' },
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
      ],
      externalLinks: [
      { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
      { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
      ]
      },
      {
        slug: 'ignore-market-noise-focus-on-css',
        title: 'Ignore the Noise and Focus on Your CSS Journey',
        date: '2026-04-08T13:15:00+05:00',
        readTime: '6 min read',
        author: 'Guardian Angel',
        excerpt: `In the CSS world, there is too much noise. Some say CSS can be completed in three months, others in four. Some insist that buying their notes or enrolling in their courses is the only path to success. Some offer individual mentorship programs, workshops, and endless seminars. All of this noise contaminates your focus, stresses your mind, and clouds your approach to preparation.
Remember the words of Albert Einstein: if you judge a fish by its ability to climb a tree, it will spend its entire life believing it is stupid. Comparing yourself to others, listening to every opinion, and following every trend will not make you a better aspirant. CSS is your journey, unique and personal. Your strength comes from believing in yourself and trusting Allah's plan.
Do not be judgmental. Do not measure your progress against others. Instead, understand your abilities, set a routine, and follow it with discipline. The right preparation is consistent, thoughtful, and self-driven. Focus on learning, thinking critically, and practicing daily. Step by step, idea by idea, question by question, you will build confidence and clarity.
Ignore the market noise. Focus on your journey. Trust your efforts, your growth, and the guidance of Allah. Success is not determined by who shouts the loudest or sells the most notes, but by who perseveres, learns, and believes in themselves.
CSS is not a race to follow trends. It is a personal mission to unlock your potential and serve a greater purpose. Tune out the distractions, trust your path, and dedicate yourself to consistent, sincere effort. Your faith, patience, and focus will guide you to success.`,
        internalLinks: [
        { label: 'Read CSS Rules and Standards', to: '/css-rules' },
        { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
        ],
        externalLinks: [
        { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
        { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
        ]
        },
        {
          slug: 'consistency-true-spirit-css-jawan',
          title: 'Consistency is the true spirit of a CSS Jawan',
          date: '2026-04-08T13:45:00+05:00',
          readTime: '5 min read',
          author: 'Guardian Angel',
          excerpt: `Consistency is the path to success. In the journey of CSS, there will be days when your body feels tired, your mind feels exhausted, your eyes strain, and your soul seems weak. But the true spirit of a CSS jawan does not give up. Your spirit, your determination, and your inner fire keep you moving forward.
Being consistent means showing up every day, even when it is hard. It means writing one more answer, reading one more page, practicing one more question. It is the small efforts, repeated daily, that build unstoppable momentum.
The path to becoming a CSP officer is not easy. It tests your patience, endurance, and commitment. The mind may complain, the body may resist, and fatigue may try to stop you, but your spirit must stay strong. This unwavering commitment and resilience define a CSS jawan.
member, consistency is not just about hours; it is about mindset. It is about believing in yourself, trusting Allah, and continuing the journey no matter the obstacles. Every step you take consistently brings you closer to your goal.
Embrace consistency, nurture your spirit, and fight every day. That is how ordinary students become extraordinary officers, and how dreams turn into reality.`,
          internalLinks: [
          { label: 'Read CSS Rules and Standards', to: '/css-rules' },
          { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
          ],
          externalLinks: [
          { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
          { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
          ]
          },
          {
            slug: 'css-hibernation-dedication',
            title: 'Hibernate to Rise: The Path of a CSS Jawan',
            date: '2026-04-08T14:15:00+05:00',
            readTime: '6 min read',
            author: 'Guardian Angel',
            excerpt: `To become a CSS officer, you must learn the art of hibernation. Social isolation is not loneliness; it is focus. Gatherings, parties, and group discussions may seem fun and enjoyable, but for a CSS jawan, they are distractions that steal precious time and energy.
Smile, laughter, and leisure are poisons to your mission. The world will not understand your silence, your sacrifices, or your dedication. Society may ridicule you, mock your dreams, and question your choices. But a true CSS jawan does not bend to judgment or public opinion.
You must disappear into the world of studies and research. Immerse yourself completely, lose yourself in preparation, and let your spirit thrive in discipline and knowledge. Every hour you invest in learning, thinking, and writing builds the foundation of your future.
This hibernation is temporary but crucial. One day, you will emerge, transformed, as a CSP officer. The same society that mocked you will respect you, honor you, and admire your dedication. Your sacrifice and focus will turn ridicule into recognition.
Prove the doubters wrong. Embrace solitude, dedicate yourself to learning, and emerge victorious. The path of a CSS jawan is not easy, but it leads to greatness, honor, and service that inspires generations.`,
            internalLinks: [
            { label: 'Read CSS Rules and Standards', to: '/css-rules' },
            { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
            ],
            externalLinks: [
            { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
            { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
            ]
            },
            {
              slug: 'not-all-make-it-css-truth',
              title: 'The Bitter Truth About CSS and Finding Your Purpose',
              date: '2026-04-08T14:45:00+05:00',
              readTime: '6 min read',
              author: 'Guardian Angel',
              excerpt: `Not all people make it in CSS. This is a bitter and harsh truth. Thousands of aspirants apply every year, but only a handful qualify, and even fewer get allocated to coveted positions. The numbers are small, but the effort you put in must be immense.
Do not be disheartened by this reality. Life has a better purpose for you, one that Allah Almighty has planned uniquely. Your mission is to give your level best, leaving no room for regrets. Every hour you dedicate, every page you read, every answer you write, shapes you into a better, stronger, and more sensible person.
Even if you do not achieve your ultimate goal, remember that knowledge is never wasted. It is transferred, shared, and utilized across generations. The lessons, discipline, and skills you acquire through preparation remain with you forever.
Trust in Allah's plan, focus on your efforts, and embrace the journey. Success is not only measured by passing an exam or earning a title, but by the growth, wisdom, and character you develop along the way. Keep striving, and know that every sacrifice has meaning and purpose.`,
              internalLinks: [
              { label: 'Read CSS Rules and Standards', to: '/css-rules' },
              { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
              ],
              externalLinks: [
              { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
              { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
              ]
              },
              {
                slug: 'spread-knowledge-css',
                title: 'The Power of Spreading Knowledge in CSS',
                date: '2026-04-08T15:15:00+05:00',
                readTime: '5 min read',
                author: 'Guardian Angel',
                excerpt: `Knowledge is a treasure that grows when shared. In the journey of CSS, your learning is not meant to be hoarded or sold for profit. True knowledge is meant to be spread, shared, and used to uplift others.
Your pious act of helping fellow aspirants, guiding someone struggling, or sharing your insights may return to you in unexpected ways. A small act of guidance or support can create a ripple effect, benefiting many and enriching your own journey.
Do not let greed or fear control your knowledge. Teach, mentor, and assist whenever possible. Knowledge has a sacred power; when shared with sincerity, it multiplies, coming back to bless you in ways you cannot foresee.
Remember, the goal of learning CSS is not just personal success but creating a positive impact around you. Spread knowledge freely, help others grow, and trust that Allah will reward your efforts and good deeds many times over.`,
                internalLinks: [
                { label: 'Read CSS Rules and Standards', to: '/css-rules' },
                { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
                ],
                externalLinks: [
                { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
                { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
                ]
                },
                {
                  slug: 'css-positive-mindset',
                  title: 'Start Your CSS Journey with Patience and Focus',
                  date: '2026-04-08T15:45:00+05:00',
                  readTime: '5 min read',
                  author: 'Guardian Angel',
                  excerpt: `Do not begin your CSS journey with revenge, hatred, or a broken heart. Success never comes from anger or the desire to prove someone wrong. The path of a CSS jawan requires maturity, patience, and self-discipline. Sabr and focus are the true fuels of determination.
Many aspirants start their preparation driven by hurt or resentment, thinking that success will heal their wounds or serve as payback. These are not the ingredients for becoming a CSP officer. Hatred and revenge act as poison, clouding judgment, weakening motivation, and distracting from true growth.
Instead, concentrate on becoming a better version of yourself. Be consistent in your studies, deliberate in your actions, and steadfast in your commitment. Let every effort be directed toward knowledge, improvement, and service, not personal grudges or anger.
Your CSS journey should be a mission of self transformation, discipline, and growth. Leave revenge and hatred behind. Focus on learning, practicing, and building the character that a CSP officer embodies. Consistency, patience, and determination will guide you to success, far more than any fleeting emotion ever can.`,
                  internalLinks: [
                  { label: 'Read CSS Rules and Standards', to: '/css-rules' },
                  { label: 'Practice with CSS Past Papers', to: '/css-past-papers' }
                  ],
                  externalLinks: [
                  { label: 'FPSC Official Website', url: '[https://fpsc.gov.pk/](https://fpsc.gov.pk/)' },
                  { label: 'World Bank Data', url: '[https://data.worldbank.org/](https://data.worldbank.org/)' }
                  ]
                  },
                  
   
  {
    slug: 'research-mindset-for-css-success',
    title: 'The Biggest Secret of CSS Success Is Not in Notes, It Is in You',
    date: '2026-03-18T23:41:00+05:00',
    readTime: '8 min read',
    author: 'Guardian Angel',
    excerpt: `
Every year, thousands of students start their CSS journey with one dream: to see their name in the final result.
They buy expensive notes, join academies, watch endless videos, and keep asking one question: “What is the secret of CSS success?”
Most people think the secret is hidden in some special notes, some famous teacher, or some magical strategy used by toppers.
But the truth is very different. The biggest secret of CSS success is not in notes. It is in you. It is in your mindset, your hard work, your consistency, and your courage to keep going when others give up.
Many students fail not because they are weak, but because they stop believing in themselves. They see other people studying more, writing better, or speaking more confidently, and they start thinking, “Maybe CSS is not for me.” This is the biggest mistake.
No one is born ready for CSS. No one starts with perfect English. No one starts with complete knowledge. Every successful CSS officer was once an ordinary student who was confused, afraid, and unsure. The only difference is that they did not stop. They continued even when they felt tired, got low marks, or when people laughed at their dream.
You must understand one thing very clearly: CSS is not a test of who is naturally intelligent. CSS is a test of who can stay in the race. The student who studies daily for six months will defeat the student who studies only when motivated. The student who practices writing every day will defeat the student who only collects notes.
Many CSS aspirants waste months collecting material. They download PDFs, save articles, buy books, and make folder after folder. But they forget one thing: collecting notes is not preparation. Reading is not enough. Watching lectures is not enough. Real preparation starts when you sit down and think, write, make mistakes, and improve.
Top CSS students do not simply memorize things. They ask questions. Why did this happen? What is the cause? What is the solution? What is my own opinion? That is why their answers become powerful. Your answer does not become strong because you used difficult words. Your answer becomes strong when it shows clear thinking. Even simple English can score very high if your ideas are clear.
Never think that your background decides your future. It does not matter whether you studied in English medium or Urdu medium, whether you belong to a big city or a small village, or whether you joined a famous academy or studied alone. What matters is whether you are willing to fight for your dream every single day.
There will be days when you feel weak, when you open your books and understand nothing, and when you compare yourself with others and feel left behind. On those days, remember this: you do not have to become perfect in one day. You only have to become a little better than yesterday. Read one more page. Write one more answer. Learn one more concept. Wake up one more day and continue. That is how CSS is cleared. Not in one big moment, but in hundreds of small efforts.
The student who wins CSS is usually not the smartest person in the room. He or she is the one who refused to quit.
If you have failed before, do not think your story is over. Sometimes failure is not the end. Sometimes it is the training that prepares you for your biggest victory. One day, the same person who is tired today, confused today, and struggling today will look back and smile. Because one day, your result will come. One day, your name will be there. One day, people will ask you, “What was your secret?” And your answer will be simple: “I never gave up.”
    `,
    internalLinks: [
      { label: 'Read CSS Rules and Standards', to: '/css-rules' },
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'World Bank Data', url: 'https://data.worldbank.org/' },
    ],
  },
  
  {
    slug: 'css-jawan-spirit-discipline-and-unity',
    title: 'CSS Jawans: The Soldiers of Knowledge',
    date: '2026-03-19T00:44:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'A CSS Jawan is not just a student but a soldier of knowledge who lives and breathes the mission of CSS, someone who eats, sleeps, thinks, and drinks CSS with complete dedication and discipline. This identity is not limited to success or failure because a CSS Jawan includes every person connected to this journey whether an aspirant, a struggling candidate, a qualifier, or a serving officer, with no discrimination among them as all share the same purpose of growth and service to the nation. The journey is not only about passing an exam but about building character, consistency, and intellectual strength, and through platforms like Guardian Angel, this mission is supported so that every CSS Jawan has the opportunity to turn effort into achievement and purpose into impact.',
    internalLinks: [
      { label: 'Build mission routine in Guardian Study Planner', to: '/guardian-study-planner' },
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'Press Information Department Pakistan', url: 'https://pid.gov.pk/' },
    ],
  },
]

const getBlogWordCount = (post) => {
  const source = `${post?.content || post?.excerpt || ''}`.trim()
  if (!source) return 0
  return source.split(/\s+/).filter(Boolean).length
}

const getBlogReadTime = (post) => {
  const words = getBlogWordCount(post)
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

const buildBlogDisplayDateMap = (posts) => {
  const year = 2026
  const rangeStart = Date.UTC(year, 2, 20, 0, 0, 0, 0) // 20 March
  const rangeEnd = Date.UTC(year, 3, 8, 22, 0, 0, 0) // 8 April
  let cursor = rangeEnd
  const entries = [...(posts || [])].sort((a, b) => {
    const aTime = new Date(a?.date || 0).getTime()
    const bTime = new Date(b?.date || 0).getTime()
    return bTime - aTime
  })
  const dateMap = {}
  entries.forEach((post, index) => {
    const seed = `${post?.slug || post?.title || ''}`
    const hash = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const gapDays = index === 0 ? 0 : 1 + (hash % 3) // 1-3 day gaps
    cursor -= gapDays * MS_PER_DAY
    if (cursor < rangeStart) cursor = rangeStart + (hash % Math.max(1, rangeEnd - rangeStart))
    const minuteOfDay = (hash * 41) % (14 * 60) + 8 * 60 // 08:00-21:59
    const hours = Math.floor(minuteOfDay / 60)
    const minutes = minuteOfDay % 60
    const dated = new Date(cursor)
    dated.setUTCHours(hours, minutes, 0, 0)
    dateMap[post.slug] = dated.toISOString()
  })
  return dateMap
}

const hasOffensiveBlogLanguage = (text) => {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
  return BLOG_OFFENSIVE_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(normalized))
}

const BLOG_CATEGORY_FILTERS = [
  'All',
  'Motivation',
  'Self Study',
  'Current Affairs',
  'Writing Skills',
  'Mindset & Faith',
]

const MAX_BLOG_ATTACHMENTS = 10

const MAX_SINGLE_BLOG_ATTACHMENT_BYTES = 8 * 1024 * 1024

const MAX_TOTAL_BLOG_ATTACHMENT_BYTES = 25 * 1024 * 1024

const BLOG_OFFENSIVE_WORDS = [
  'abuse',
  'bastard',
  'bitch',
  'bloody',
  'bullshit',
  'chutiya',
  'damn',
  'fool',
  'fuck',
  'fucking',
  'haramzada',
  'harami',
  'idiot',
  'jerk',
  'kameena',
  'lanat',
  'loser',
  'madarchod',
  'moron',
  'motherfucker',
  'randi',
  'shit',
  'slut',
  'stupid',
]

const getBlogCategories = (post) => {
  if (Array.isArray(post?.categories) && post.categories.length > 0) {
    return post.categories.filter((item) => BLOG_CATEGORY_FILTERS.includes(item) && item !== 'All')
  }
  const text = `${post?.title || ''} ${post?.excerpt || ''}`.toLowerCase()
  const tags = new Set()

  if (/\bmotivation|discipline|consistency|confidence\b/.test(text)) tags.add('Motivation')
  if (/\bself study|academy|notes|research\b/.test(text)) tags.add('Self Study')
  if (/\bcurrent affairs|pakistan affairs|news|foreign|policy\b/.test(text)) tags.add('Current Affairs')
  if (/\bessay|precis|writing|argument|thesis\b/.test(text)) tags.add('Writing Skills')
  if (/\bfaith|allah|destiny|mindset|judgement|competition\b/.test(text)) tags.add('Mindset & Faith')
  if (post?.slug === 'css-jawan-spirit-discipline-and-unity') {
    tags.add('Self Study')
    tags.add('Mindset & Faith')
  }

  if (tags.size === 0) tags.add('Motivation')
  return Array.from(tags)
}

export default function BlogPage({ authUser }) {
  const { blogSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [editingBlogSlug, setEditingBlogSlug] = useState('')
  const [appDialog, setAppDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    confirmText: 'OK',
    showCancel: false,
  })
  const [pendingDeleteBlog, setPendingDeleteBlog] = useState(null)
  const [blogDraft, setBlogDraft] = useState({
    title: '',
    category: 'Motivation',
    content: '',
    attachments: [],
  })
  const [userBlogs, setUserBlogs] = useState([])
  const [reactionsBySlug, setReactionsBySlug] = useState({})
  const [userReactionBySlug, setUserReactionBySlug] = useState({})
  const [commentsBySlug, setCommentsBySlug] = useState({})
  const [commentDraftBySlug, setCommentDraftBySlug] = useState({})
  const allBlogs = [...userBlogs, ...blogPosts]
  const displayBlogDateMap = buildBlogDisplayDateMap(blogPosts)
  const getDisplayBlogDate = (post) =>
    post?.isUserGenerated ? post?.date : displayBlogDateMap[post?.slug] || post?.date
  const getAuthOwnerKey = () => {
    if (!authUser) return ''
    return String(authUser.username || authUser.email || authUser.fullName || '').trim().toLowerCase()
  }
  const getAuthOwnerCandidates = () => {
    if (!authUser) return []
    const candidates = [
      authUser.username,
      authUser.email,
      authUser.fullName,
      authUser.name,
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean)
    return Array.from(new Set(candidates))
  }
  const canManageBlog = (post) => {
    if (!post?.isUserGenerated) return false
    if (authUser?.id && post.ownerUserId && String(post.ownerUserId) === String(authUser.id)) return true
    const authCandidates = getAuthOwnerCandidates()
    if (authCandidates.length === 0) return false
    const postOwnerKey = String(post.ownerKey || '').trim().toLowerCase()
    const postAuthor = String(post.author || '').trim().toLowerCase()
    if (postOwnerKey && authCandidates.includes(postOwnerKey)) return true
    if (postAuthor && authCandidates.includes(postAuthor)) return true
    return false
  }
  const featuredPosts = blogPosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const visiblePosts = allBlogs.filter((post) =>
    activeCategory === 'All' ? true : getBlogCategories(post).includes(activeCategory),
  )
  const regularPosts = visiblePosts.filter((post) => post?.isUserGenerated)
  const blogSlugKey = allBlogs
    .map((post) => post.slug)
    .filter(Boolean)
    .sort()
    .join('|')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Guardian Angel CSS Blog',
    url: `${SITE_URL}/blogs`,
    blogPost: allBlogs.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: getDisplayBlogDate(post),
      dateModified: getDisplayBlogDate(post),
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Guardian Angel',
      },
      description: post.excerpt,
      timeRequired: `PT${Math.max(1, Math.ceil(getBlogWordCount(post) / 200))}M`,
      mainEntityOfPage: `${SITE_URL}/blogs/${post.slug}`,
    })),
  }
  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setPublishError('')
    setAttachmentError('')
    setEditingBlogSlug('')
    setBlogDraft({ title: '', category: 'Motivation', content: '', attachments: [] })
  }
  const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  const handleDraftAttachmentUpload = async (event) => {
    const pickedFiles = Array.from(event.target.files || [])
    if (pickedFiles.length === 0) return
    setAttachmentError('')
    let nextAttachments = [...(blogDraft.attachments || [])]
    for (const file of pickedFiles) {
      if (nextAttachments.length >= MAX_BLOG_ATTACHMENTS) {
        setAttachmentError(`Maximum ${MAX_BLOG_ATTACHMENTS} files allowed per blog.`)
        break
      }
      if (file.size > MAX_SINGLE_BLOG_ATTACHMENT_BYTES) {
        setAttachmentError(`"${file.name}" exceeds 8 MB. Please upload a smaller file.`)
        continue
      }
      const runningTotal = nextAttachments.reduce((sum, item) => sum + (item.size || 0), 0)
      if (runningTotal + file.size > MAX_TOTAL_BLOG_ATTACHMENT_BYTES) {
        setAttachmentError('Total attachment size cannot exceed 25 MB per blog.')
        break
      }
      const alreadyAdded = nextAttachments.some((item) => item.name === file.name && item.size === file.size)
      if (alreadyAdded) continue
      try {
        const dataUrl = await readFileAsDataUrl(file)
        if (!dataUrl) {
          setAttachmentError(`"${file.name}" could not be processed.`)
          continue
        }
        nextAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
        })
      } catch {
        setAttachmentError(`"${file.name}" could not be uploaded.`)
      }
    }
    setBlogDraft((current) => ({
      ...current,
      attachments: nextAttachments,
    }))
    event.target.value = ''
  }
  const removeDraftAttachment = (attachmentId) => {
    setBlogDraft((current) => ({
      ...current,
      attachments: (current.attachments || []).filter((item) => item.id !== attachmentId),
    }))
  }
  const downloadAttachment = (attachment, event) => {
    if (event) event.stopPropagation()
    if (!attachment?.dataUrl) return
    const link = document.createElement('a')
    link.href = attachment.dataUrl
    link.download = attachment.name || 'guardian-angel-attachment'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const renderBlogAttachments = (post, { inModal = false } = {}) => {
    const attachments = Array.isArray(post?.attachments) ? post.attachments : []
    if (attachments.length === 0) return null
    return (
      <div className={`blog-attachments ${inModal ? 'modal' : ''}`}>
        <p className="blog-attachments-title">Attachments ({attachments.length})</p>
        <div className="blog-attachment-list">
          {attachments.map((file) => (
            <button
              key={`${post.slug || 'post'}-${file.id || file.name}`}
              type="button"
              className="blog-attachment-item"
              onClick={(event) => downloadAttachment(file, event)}
              title={`Download ${file.name}`}
            >
              <span className="blog-attachment-name">{file.name}</span>
              <span className="blog-attachment-size">{formatFileSize(file.size)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  const loadUserBlogs = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('user_blogs')
        .select('*')
        .order('created_at', { ascending: false })
      const mapped = (data || []).map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        date: row.created_at,
        author: row.author_name || 'Guardian User',
        ownerKey: row.owner_key || '',
        ownerUserId: row.owner_user_id || '',
        excerpt: row.excerpt || '',
        content: row.content || '',
        categories: Array.isArray(row.categories) ? row.categories : ['Motivation'],
        attachments: Array.isArray(row.attachments) ? row.attachments : [],
        isUserGenerated: true,
      }))
      setUserBlogs(mapped)
    } catch {
      // Ignore fetch errors and keep existing list.
    }
  }

  useEffect(() => {
    loadUserBlogs()
  }, [])

  const handlePublishBlog = async (event) => {
    event.preventDefault()
    if (!authUser) {
      setPublishError('Please sign in to publish a blog.')
      return
    }
    const title = blogDraft.title.trim()
    const content = blogDraft.content.trim()
    const category = blogDraft.category
    if (title.length < 8) {
      setPublishError('Blog title should be at least 8 characters.')
      return
    }
    if (content.split(/\s+/).filter(Boolean).length < 10) {
      setPublishError('Blog content should be at least 10 words for publishing.')
      return
    }
    if (hasOffensiveBlogLanguage(`${title} ${content}`)) {
      setPublishError('Abusive or offensive language is not allowed in blog content.')
      return
    }
    const baseSlug = slugify(title) || `blog-${Date.now()}`
    let uniqueSlug = baseSlug
    let suffix = 1
    const existingSlugs = new Set(allBlogs.filter((post) => post.slug !== editingBlogSlug).map((post) => post.slug))
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${suffix}`
      suffix += 1
    }
    const words = content.split(/\s+/).filter(Boolean)
    const excerpt = words.slice(0, 70).join(' ')
    const nextPost = {
      slug: uniqueSlug,
      title,
      date: new Date().toISOString(),
      author: authUser.fullName || authUser.username || 'Guardian User',
      ownerKey: getAuthOwnerKey(),
      ownerUserId: authUser.id || '',
      excerpt: excerpt.length < content.length ? `${excerpt}...` : excerpt,
      content,
      categories: [category],
      attachments: blogDraft.attachments || [],
      isUserGenerated: true,
    }
    if (!supabase || !authUser?.id) {
      setPublishError('Supabase is not configured for blog publishing.')
      return
    }
    try {
      if (editingBlogSlug) {
        const editingPost = userBlogs.find((post) => post.slug === editingBlogSlug)
        if (!editingPost?.id) {
          setPublishError('Unable to update this blog right now.')
          return
        }
        const { error: updateError } = await supabase
          .from('user_blogs')
          .update({
            slug: nextPost.slug,
            title: nextPost.title,
            excerpt: nextPost.excerpt,
            content: nextPost.content,
            categories: nextPost.categories,
            attachments: nextPost.attachments,
            author_name: nextPost.author,
            owner_key: nextPost.ownerKey,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id)
        if (updateError) throw updateError
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('user_blogs')
          .insert({
            owner_user_id: authUser.id,
            owner_key: nextPost.ownerKey,
            author_name: nextPost.author,
            slug: nextPost.slug,
            title: nextPost.title,
            excerpt: nextPost.excerpt,
            content: nextPost.content,
            categories: nextPost.categories,
            attachments: nextPost.attachments,
          })
          .select('id, created_at')
          .single()
        if (insertError) throw insertError
        if (inserted?.id) nextPost.id = inserted.id
        if (inserted?.created_at) nextPost.date = inserted.created_at
      }
      await loadUserBlogs()
    } catch (dbError) {
      setPublishError(dbError?.message || 'Unable to publish blog. Please try again.')
      return
    }
    setBlogDraft({ title: '', category: 'Motivation', content: '', attachments: [] })
    setPublishError('')
    setAttachmentError('')
    setEditingBlogSlug('')
    setIsCreateModalOpen(false)
    openBlogModal(nextPost)
  }
  const handleEditBlog = (post) => {
    if (!canManageBlog(post)) return
    setEditingBlogSlug(post.slug)
    setBlogDraft({
      title: post.title || '',
      category: (Array.isArray(post.categories) && post.categories[0]) || 'Motivation',
      content: post.content || '',
      attachments: Array.isArray(post.attachments) ? post.attachments : [],
    })
    setPublishError('')
    setAttachmentError('')
    setIsCreateModalOpen(true)
    setSelectedBlog(null)
  }
  const handleDeleteBlog = (post) => {
    if (!canManageBlog(post)) return
    setPendingDeleteBlog(post)
    setAppDialog({
      isOpen: true,
      title: 'Delete Blog',
      message: 'Delete this blog permanently? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      showCancel: true,
    })
  }
  const closeAppDialog = () => {
    setAppDialog((current) => ({ ...current, isOpen: false }))
    setPendingDeleteBlog(null)
  }
  const handleAppDialogConfirm = async () => {
    if (pendingDeleteBlog) {
      try {
        if (pendingDeleteBlog?.id && supabase) {
          const { error: deleteError } = await supabase.from('user_blogs').delete().eq('id', pendingDeleteBlog.id)
          if (deleteError) throw deleteError
        }
        await loadUserBlogs()
        if (blogSlug === pendingDeleteBlog.slug) navigate('/blogs')
        setSelectedBlog(null)
      } catch {
        setAppDialog({
          isOpen: true,
          title: 'Delete Failed',
          message: 'Unable to delete this blog right now. Please try again.',
          variant: 'danger',
          confirmText: 'OK',
          showCancel: false,
        })
        setPendingDeleteBlog(null)
        return
      }
    }
    closeAppDialog()
  }
  const openBlogModal = (post) => {
    const targetPath = `/blogs/${post.slug}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }
  const closeBlogModal = () => {
    if (blogSlug) {
      navigate('/blogs')
    }
  }
  const getBlogShareUrl = (post) => `${SITE_URL}/blogs/${post.slug}`
  const shareBlogOnFacebook = (post, event) => {
    if (event) event.stopPropagation()
    const url = getBlogShareUrl(post)
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }
  const shareBlogOnWhatsApp = (post, event) => {
    if (event) event.stopPropagation()
    const url = getBlogShareUrl(post)
    const text = `${post.title} - ${url}`
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }
  const copyBlogLink = async (post, event) => {
    if (event) event.stopPropagation()
    const url = getBlogShareUrl(post)
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setAppDialog({
        isOpen: true,
        title: 'Link Copied',
        message: 'Blog link copied to clipboard.',
        variant: 'info',
        confirmText: 'OK',
        showCancel: false,
      })
    } catch {
      setAppDialog({
        isOpen: true,
        title: 'Copy Failed',
        message: 'Unable to copy link right now. Please copy it manually from browser URL bar.',
        variant: 'danger',
        confirmText: 'OK',
        showCancel: false,
      })
    }
  }
  const loadBlogEngagement = async () => {
    if (!supabase) return
    const slugs = allBlogs.map((item) => item.slug).filter(Boolean)
    if (slugs.length === 0) return
    try {
      const { data: reactions } = await supabase
        .from('blog_reactions')
        .select('blog_slug, user_id, reaction_type')
        .in('blog_slug', slugs)
      const nextReactionCounts = {}
      const nextUserReactions = {}
      ;(reactions || []).forEach((item) => {
        const slug = item.blog_slug
        const reactionType = item.reaction_type === 'dislike' ? 'dislike' : 'like'
        if (!nextReactionCounts[slug]) nextReactionCounts[slug] = { like: 0, dislike: 0 }
        nextReactionCounts[slug][reactionType] += 1
        if (authUser?.id && item.user_id === authUser.id) nextUserReactions[slug] = reactionType
      })

      const { data: comments } = await supabase
        .from('blog_comments')
        .select('id, blog_slug, user_id, author_name, content, created_at')
        .in('blog_slug', slugs)
        .order('created_at', { ascending: true })
      const nextComments = {}
      ;(comments || []).forEach((item) => {
        if (!nextComments[item.blog_slug]) nextComments[item.blog_slug] = []
        nextComments[item.blog_slug].push(item)
      })
      setReactionsBySlug(nextReactionCounts)
      setUserReactionBySlug(nextUserReactions)
      setCommentsBySlug(nextComments)
    } catch {
      // Keep interaction widgets silent on fetch failure.
    }
  }
  const requireAuthForEngagement = () => {
    if (authUser) return true
    setAppDialog({
      isOpen: true,
      title: 'Sign In Required',
      message: 'Please sign in to like, dislike, or comment on blogs.',
      variant: 'info',
      confirmText: 'OK',
      showCancel: false,
    })
    return false
  }
  const handleReaction = async (post, reactionType, event) => {
    if (event) event.stopPropagation()
    if (!requireAuthForEngagement() || !supabase) return
    const slug = post?.slug
    if (!slug || !authUser?.id) return
    const currentReaction = userReactionBySlug[slug] || ''
    try {
      if (currentReaction === reactionType) {
        await supabase.from('blog_reactions').delete().eq('blog_slug', slug).eq('user_id', authUser.id)
      } else {
        await supabase.from('blog_reactions').upsert(
          {
            blog_slug: slug,
            user_id: authUser.id,
            reaction_type: reactionType,
          },
          { onConflict: 'blog_slug,user_id' },
        )
      }
      await loadBlogEngagement()
    } catch {
      // Keep UI unchanged if update fails.
    }
  }
  const handleCommentSubmit = async (post, event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!requireAuthForEngagement() || !supabase) return
    const slug = post?.slug
    const content = String(commentDraftBySlug[slug] || '').trim()
    if (!slug || !content || !authUser?.id) return
    try {
      await supabase.from('blog_comments').insert({
        blog_slug: slug,
        user_id: authUser.id,
        author_name: authUser.fullName || authUser.username || 'Guardian User',
        content,
      })
      setCommentDraftBySlug((current) => ({ ...current, [slug]: '' }))
      await loadBlogEngagement()
    } catch {
      // Keep UI unchanged if insert fails.
    }
  }
  const handleCommentDelete = async (post, comment, event) => {
    if (event) event.stopPropagation()
    if (!supabase || !authUser?.id || !comment?.id) return
    if (comment.user_id !== authUser.id) return
    try {
      await supabase.from('blog_comments').delete().eq('id', comment.id).eq('user_id', authUser.id)
      await loadBlogEngagement()
    } catch {
      // Keep UI unchanged if delete fails.
    }
  }
  const renderBlogEngagement = (post, { inModal = false } = {}) => {
    const slug = post?.slug
    if (!slug) return null
    const reactionCounts = reactionsBySlug[slug] || { like: 0, dislike: 0 }
    const currentReaction = userReactionBySlug[slug] || ''
    const comments = commentsBySlug[slug] || []
    return (
      <div className={`blog-engagement ${inModal ? 'modal' : ''}`}>
        <div className="blog-reaction-row">
          <button
            type="button"
            className={`blog-reaction-btn ${currentReaction === 'like' ? 'active' : ''}`}
            onClick={(event) => handleReaction(post, 'like', event)}
          >
            Like {reactionCounts.like}
          </button>
          <button
            type="button"
            className={`blog-reaction-btn ${currentReaction === 'dislike' ? 'active' : ''}`}
            onClick={(event) => handleReaction(post, 'dislike', event)}
          >
            Dislike {reactionCounts.dislike}
          </button>
          <span className="blog-comment-count">{comments.length} comments</span>
        </div>
        {inModal ? (
          <div className="blog-comments">
            <div className="blog-comment-list">
              {comments.map((comment) => (
                <article key={comment.id} className="blog-comment-item">
                  <p>
                    <strong>{comment.author_name || 'User'}</strong> · {formatNewsTimestamp(comment.created_at)}
                  </p>
                  <p>{comment.content}</p>
                  {authUser?.id && comment.user_id === authUser.id ? (
                    <button
                      type="button"
                      className="btn btn-secondary blog-comment-delete"
                      onClick={(event) => handleCommentDelete(post, comment, event)}
                    >
                      Delete
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
            <form className="blog-comment-form" onSubmit={(event) => handleCommentSubmit(post, event)}>
              <textarea
                value={commentDraftBySlug[slug] || ''}
                onChange={(event) =>
                  setCommentDraftBySlug((current) => ({ ...current, [slug]: event.target.value }))
                }
                placeholder={authUser ? 'Write a comment...' : 'Sign in to comment'}
                rows={3}
                disabled={!authUser}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!authUser || !String(commentDraftBySlug[slug] || '').trim()}
              >
                Post Comment
              </button>
            </form>
          </div>
        ) : null}
      </div>
    )
  }
  useEffect(() => {
    loadBlogEngagement()
  }, [blogSlugKey, authUser?.id])

  useEffect(() => {
    if (!blogSlug) {
      setSelectedBlog(null)
      return
    }
    const matched = allBlogs.find((post) => post.slug === blogSlug) || null
    setSelectedBlog(matched)
  }, [blogSlug, allBlogs])

  useEffect(() => {
    if (!selectedBlog) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeBlogModal()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedBlog])
  return (
    <main className="page-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="container blog-page" id="css-blog">
        <div className="section-title">
          <p>Guardian Angel Blog</p>
          <h2>CSS Strategy, Writing, and Current Affairs Insights</h2>
        </div>
        <p className="rules-source blog-jawan-mantra">
          <span className="guardian-highlight-word">
            Focus, Discipline and Determination, defines a CSS Jawan
          </span>
        </p>
        {authUser ? (
          <div className="blog-write-widget-wrap">
            <button type="button" className="btn btn-primary blog-write-widget" onClick={() => setIsCreateModalOpen(true)}>
              Write a Blog
            </button>
          </div>
        ) : null}

        <div className="blog-category-chips" role="tablist" aria-label="Blog categories">
          {BLOG_CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={`blog-category-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="blog-featured-section">
          <div className="blog-featured-head">
            <h3>Featured</h3>
          </div>
          <div className="blog-grid blog-featured-grid">
            {featuredPosts.map((post) => (
              <article
                className="blog-card blog-card-featured"
                key={`featured-${post.slug}`}
                id={`featured-${post.slug}`}
                role="button"
                tabIndex={0}
                onClick={() => openBlogModal(post)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openBlogModal(post)
                  }
                }}
              >
                <p className="blog-featured-badge">Featured</p>
                <h3>{post.title}</h3>
                <p className="blog-meta">
                  By <strong>{post.author}</strong> · {formatNewsTimestamp(getDisplayBlogDate(post))} · {getBlogReadTime(post)}
                </p>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-tag-row">
                  {getBlogCategories(post).map((tag) => (
                    <span key={`${post.slug}-featured-${tag}`} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              {renderBlogAttachments(post)}
                <div className="blog-share-row">
                  <button
                    type="button"
                    className="blog-share-btn fb"
                    onClick={(event) => shareBlogOnFacebook(post, event)}
                    aria-label="Share blog on Facebook"
                    title="Share on Facebook"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V9c0-.9.3-1.6 1.6-1.6h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3v2.1H8v3.1h2.7v8h2.8Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="blog-share-btn wa"
                    onClick={(event) => shareBlogOnWhatsApp(post, event)}
                    aria-label="Share blog on WhatsApp"
                    title="Share on WhatsApp"
                  >
                    <img src={whatsappShareIcon} alt="" className="blog-share-icon-image" />
                  </button>
                  <button
                    type="button"
                    className="blog-share-btn copy"
                    onClick={(event) => copyBlogLink(post, event)}
                    aria-label="Copy blog link"
                    title="Copy link"
                  >
                    <img src={copyShareIcon} alt="" className="blog-share-copy-image" />
                  </button>
                </div>
                {renderBlogEngagement(post)}
              </article>
            ))}
          </div>
        </div>
        <div className="blog-featured-separator" aria-hidden="true" />

        <div className="blog-grid">
          {regularPosts.map((post) => (
            <article
              className="blog-card"
              key={post.slug}
              id={post.slug}
              role="button"
              tabIndex={0}
              onClick={() => openBlogModal(post)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openBlogModal(post)
                }
              }}
            >
              <h3>{post.title}</h3>
              <p className="blog-meta">
                By <strong>{post.author}</strong> · {formatNewsTimestamp(getDisplayBlogDate(post))} · {getBlogReadTime(post)}
              </p>
              <p className="blog-excerpt">{post.excerpt}</p>
              <div className="blog-tag-row">
                {getBlogCategories(post).map((tag) => (
                  <span key={`${post.slug}-${tag}`} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>
              {renderBlogAttachments(post)}
              <div className="blog-share-row">
                <button
                  type="button"
                  className="blog-share-btn fb"
                  onClick={(event) => shareBlogOnFacebook(post, event)}
                  aria-label="Share blog on Facebook"
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V9c0-.9.3-1.6 1.6-1.6h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3v2.1H8v3.1h2.7v8h2.8Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="blog-share-btn wa"
                  onClick={(event) => shareBlogOnWhatsApp(post, event)}
                  aria-label="Share blog on WhatsApp"
                  title="Share on WhatsApp"
                >
                  <img src={whatsappShareIcon} alt="" className="blog-share-icon-image" />
                </button>
                <button
                  type="button"
                  className="blog-share-btn copy"
                  onClick={(event) => copyBlogLink(post, event)}
                  aria-label="Copy blog link"
                  title="Copy link"
                >
                  <img src={copyShareIcon} alt="" className="blog-share-copy-image" />
                </button>
              </div>
              {renderBlogEngagement(post)}

            </article>
          ))}
        </div>
        {selectedBlog ? (
          <div className="blog-modal-overlay" onClick={closeBlogModal} role="dialog" aria-modal="true">
            <article className="blog-modal-card" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="blog-modal-close" onClick={closeBlogModal} aria-label="Close blog">
                ×
              </button>
              <h3>{selectedBlog.title}</h3>
              <p className="blog-meta">
                By <strong>{selectedBlog.author}</strong> · {formatNewsTimestamp(getDisplayBlogDate(selectedBlog))} ·{' '}
                {getBlogReadTime(selectedBlog)}
              </p>
              {canManageBlog(selectedBlog) ? (
                <div className="blog-owner-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => handleEditBlog(selectedBlog)}>
                    Edit Blog
                  </button>
                  <button type="button" className="btn btn-secondary blog-delete-btn" onClick={() => handleDeleteBlog(selectedBlog)}>
                    Delete Blog
                  </button>
                </div>
              ) : null}
              <div className="blog-share-row modal">
                <button
                  type="button"
                  className="blog-share-btn fb"
                  onClick={(event) => shareBlogOnFacebook(selectedBlog, event)}
                  aria-label="Share blog on Facebook"
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V9c0-.9.3-1.6 1.6-1.6h1.7V4.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3v2.1H8v3.1h2.7v8h2.8Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="blog-share-btn wa"
                  onClick={(event) => shareBlogOnWhatsApp(selectedBlog, event)}
                  aria-label="Share blog on WhatsApp"
                  title="Share on WhatsApp"
                >
                  <img src={whatsappShareIcon} alt="" className="blog-share-icon-image" />
                </button>
                <button
                  type="button"
                  className="blog-share-btn copy"
                  onClick={(event) => copyBlogLink(selectedBlog, event)}
                  aria-label="Copy blog link"
                  title="Copy link"
                >
                  <img src={copyShareIcon} alt="" className="blog-share-copy-image" />
                </button>
              </div>
              {renderBlogEngagement(selectedBlog, { inModal: true })}
              {renderBlogAttachments(selectedBlog, { inModal: true })}
              <p className="blog-modal-content">{selectedBlog.content || selectedBlog.excerpt}</p>
            </article>
          </div>
        ) : null}
        {isCreateModalOpen ? (
          <div className="blog-modal-overlay" onClick={closeCreateModal} role="dialog" aria-modal="true">
            <article className="blog-modal-card blog-create-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="blog-modal-close"
                onClick={closeCreateModal}
                aria-label="Close create blog"
              >
                ×
              </button>
              <h3>{editingBlogSlug ? 'Edit Your Blog' : 'Publish Your Blog'}</h3>
              <form className="blog-create-form" onSubmit={handlePublishBlog}>
                <label>
                  Blog Title
                  <input
                    type="text"
                    value={blogDraft.title}
                    onChange={(event) => setBlogDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Enter blog title"
                    required
                  />
                </label>
                <label>
                  Category
                  <select
                    value={blogDraft.category}
                    onChange={(event) =>
                      setBlogDraft((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    {BLOG_CATEGORY_FILTERS.filter((item) => item !== 'All').map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Blog Content
                  <textarea
                    rows={7}
                    value={blogDraft.content}
                    onChange={(event) => setBlogDraft((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Write your blog here..."
                    required
                  />
                </label>
                <div className="blog-attachment-field">
                  <p className="blog-attachment-field-label">Attach Files (images, PPT, Word, PDF, ZIP, etc.)</p>
                  <div className="blog-attachment-picker">
                    <input
                      id="blog-attachment-input"
                      className="blog-attachment-input"
                      type="file"
                      multiple
                      onChange={handleDraftAttachmentUpload}
                    />
                    <label htmlFor="blog-attachment-input" className="blog-attachment-picker-btn">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 4a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 3.99a1 1 0 0 1-1.4 0l-4-3.99a1 1 0 1 1 1.4-1.42l2.3 2.3V5a1 1 0 0 1 1-1Zm-7 13a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
                      </svg>
                      <span>Upload Files</span>
                    </label>
                    <span className="blog-attachment-picker-meta">
                      {blogDraft.attachments.length > 0
                        ? `${blogDraft.attachments.length} file(s) selected`
                        : 'No file selected yet'}
                    </span>
                  </div>
                </div>
                {blogDraft.attachments.length > 0 ? (
                  <div className="blog-draft-attachments">
                    <p className="blog-attachments-title">
                      Ready to publish ({blogDraft.attachments.length}/{MAX_BLOG_ATTACHMENTS})
                    </p>
                    <div className="blog-attachment-list">
                      {blogDraft.attachments.map((file) => (
                        <div key={file.id} className="blog-attachment-item draft">
                          <span className="blog-attachment-name">{file.name}</span>
                          <span className="blog-attachment-size">{formatFileSize(file.size)}</span>
                          <button
                            type="button"
                            className="blog-attachment-remove"
                            onClick={() => removeDraftAttachment(file.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {attachmentError ? <p className="planner-error">{attachmentError}</p> : null}
                {publishError ? <p className="planner-error">{publishError}</p> : null}
                <div className="blog-create-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingBlogSlug ? 'Update Blog' : 'Publish Blog'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                    Cancel
                  </button>
                </div>
              </form>
            </article>
          </div>
        ) : null}
        {appDialog.isOpen ? (
          <div className="app-dialog-overlay" role="dialog" aria-modal="true" onClick={closeAppDialog}>
            <article className={`app-dialog-card ${appDialog.variant}`} onClick={(event) => event.stopPropagation()}>
              <h4>{appDialog.title || 'Notice'}</h4>
              <p>{appDialog.message}</p>
              <div className="app-dialog-actions">
                {appDialog.showCancel ? (
                  <button type="button" className="btn btn-secondary" onClick={closeAppDialog}>
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`btn ${appDialog.variant === 'danger' ? 'btn-secondary app-dialog-danger-btn' : 'btn-primary'}`}
                  onClick={handleAppDialogConfirm}
                >
                  {appDialog.confirmText || 'OK'}
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export function LegacyBlogSlugRedirect() {
  const { blogSlug } = useParams()
  return <Navigate to={`/blogs/${blogSlug || ''}`} replace />
}
