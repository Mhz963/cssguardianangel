import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'
import logo from './assets/guardian-angel-logo.png'
import {
  compulsorySubjects,
  detailedSubjectPages,
  optionalGroups,
  slugify,
} from './data/syllabusData'
import { jsPDF } from 'jspdf'

const pillars = [
  {
    title: 'Premium Quality Content',
    text: 'Guardian Angel material is designed according to FPSC standards and focuses on topper level preparation.',
  },
  {
    title: 'Completely Free',
    text: 'No subscriptions. No hidden charges. Knowledge is Priceless.',
  },
  {
    title: 'Smart Preparation',
    text: 'Guardian Angel focuses on strategic preparation, not unnecessary workload.',
  },
  {
    title: 'Equal Opportunity',
    text: 'Students from every city, village, and background can prepare for CSS.',
  },
]

const cssRulesSections = [
  {
    title: 'CSS Age Limit',
    content: [
      "1. No candidate shall be eligible for admission to the competitive examination unless he is neither below the age of twenty-one years nor above the age of thirty years on the cut-off date.",
      "Explanation: A candidate born on or before the 31st day of December, 1988 and on or after the 2nd day of January, 1998 shall not be eligible for the competitive examination of the year 2019.",
      "2. Two years relaxation in upper-age limit of a candidate shall be admissible in respect of the following categories, namely:",
      "(a) the candidates belonging to the scheduled caste and Buddhist community subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(b) the candidates belonging to the recognized Tribes who are permanent residents of the areas mentioned below and whose families have been living in these areas, subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf:",
      "(i) Baluchistan;",
      "(ii) Tribal Areas of D.I.Khan and Peshawar Divisions (including former Frontier States of Dir, Swat, Chitral and Amb);",
      "(iii) former excluded (Baloch) area forming part of the Dera Ghazi Khan and Rajanpur Districts;",
      "(iv) former Tribal Areas of Mardan and Hazara Divisions; and",
      "(v) Upper Tanawal Area of Hazara Division;",
      "(c) the candidates who are permanent residents of Azad Kashmir Territory, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Division to which business of Azad Jammu and Kashmir stands allocated;",
      "(d) the candidates who are permanent residents of Gilgit-Baltistan including Gilgit, Diamir, Baltistan, Ghizer and Guanche, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(e) the special candidates, namely, physically impaired, hearing or speech impaired and visually impaired, subject to production of certificate of disability in support of their claim issued by an officer of the Federal Government or, as the case may be, Provincial Government duly authorized in this behalf;",
      "(f) in-service Government servants, armed forces personnel, contract employees, including the Government servants of Azad Jammu and Kashmir, who possess a minimum of two years continuous Government service as on the cut-off date subject to production of departmental permission certificate from the competent authority as set out by the Commission from time to time. Employees of nationalized banks, State Bank of Pakistan, Water and Power Development Authority, regulatory authorities, autonomous bodies and other semi-autonomous bodies are not entitled to the age-relaxation under these rules:",
      "Provided that period of extraordinary leave (EOL) shall not be considered as period spent on duty under Fundamental Rule-9(6) for grant of age-relaxation under these rules.",
      "3. The relaxation in upper age-limits prescribed in these rules shall be permitted upto the maximum period of an individual concession and not by the total period of the concessions taken together, if admissible in any case.",
      "4. Except as provided in these rules, a candidate shall not be entitled to further relaxation in age-limit under any other rule for the time being in force or on any other ground.",
    ],
  },
  {
    title: 'CSS Cut-off Date',
    content: [
      "The cutoff date for determining the eligibility of the candidate in terms of age, qualifications, domicile shall be the 31st day of December of the year preceding the year of competitive examination.",
      "Explanation: For competitive examination 2019 the cut-off date thereof shall be the 31st day of December, 2018.",
    ],
  },
  {
    title: 'CSS Educational Qualifications',
    content: [
      "1. A candidate for competitive examination must hold at least a second division or grade \"C\" bachelor's degree in any faculty of one of the Pakistani universities or an equivalent degree or comparable educational qualifications of a foreign university recognized by the Higher Education Commission (HEC), subject to production of equivalence certificate issued by HEC.",
      "2. Where a candidate does not hold the required degree on or before the cut-off date, he shall be required to produce a certificate from the duly authorized officer of the concerned degree awarding institution, to the effect that the candidate has fulfilled all the requirements of the said degree and has cleared and passed the examination for the said degree on or before the cut-off date. The candidate however would be required to produce the said degree before the final result is declared by the Commission.",
      "3. A candidate who has obtained a third division or 'D' grade in his bachelor's degree shall be eligible for the competitive examination in cases where he has obtained a higher division or grade in master's degree.",
    ],
  },
  {
    title: 'CSS Nationality',
    content: [
      '1. Candidates for competitive examination must be a citizen of Pakistan or a person deriving his nationality from the State of Jammu and Kashmir.',
      '2. A candidate who has married a person who is not a citizen of Pakistan shall not be eligible for appointment provided that a person who marries a foreign national of any country recognized by Federal Government with the prior permission of Government may be regarded as eligible for appointment.',
    ],
  },
  {
    title: 'CSS Domicile',
    content: [
      '1. Seats in respect of the Occupational Groups and Services shall be allocated in accordance with the policy as may be prescribed by the Federal Government before finalizing the appointments and for that purpose the candidates shall produce domicile certificate issued by the competent authority in accordance with the law and the rules.',
      '2. A candidate who has acquired the citizenship of Pakistan by registration under the Pakistan Citizenship Act, 1951 (II of 1951) and the rules made thereunder shall produce along with the application an attested copy of the certificate of citizenship. A candidate who has not been registered as a citizen of Pakistan but claims that he should be deemed to be citizen of Pakistan under the Pakistan Citizenship Act, 1951 (II of 1951) shall produce proof to the effect that he fulfills the conditions on the basis of which he claims to be deemed as a citizen of Pakistan. A candidate who derives his nationality from the State of Jammu and Kashmir shall produce along with the application a certificate issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim.',
      '3. Candidates of Azad Jammu and Kashmir shall produce domicile certificate alongwith permanent residence certificate along with the application forms issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim. No such certificates shall be accepted at any later stage.',
      '4. Domicile once claimed by a candidate and accepted by the Commission for the purpose of admission to competitive examination shall be final. No change will be allowed at a subsequent examination or selection.',
      '5. Domicile claimed by a candidate and accepted at the time of his first entry into Government service shall be treated as final for the purpose of candidature and allocation and no subsequent change in his domicile shall be accepted.',
    ],
  },
  {
    title: 'CSS Application Form',
    content: [
      "1. All applications for the competitive examination must be made online through the Commission's website www.fpsc.gov.pk.",
      '2. Online applications must be made on or before the closing date as advertised by the Commission.',
      "3. Printed copy of duly filled online application form (i.e. hardcopy) may be obtained and after signing it, copies of all documents and certificates as mentioned in application form alongwith original treasury receipt may be attached with it and dispatched to the Secretary of the Commission, so as to reach the Commission's headquarters within ten days of the closing date.",
      '4. An online application received incomplete, wrongly filled in or its hardcopy not accompanied with any one of the documents mentioned in the application form, shall be rejected.',
      '5. Hardcopy of the online application, if reached to the Commission after the stipulated period of ten days from the closing date, it shall not be accepted and online form already submitted to the Commission shall stand rejected.',
      '6. Any correction in the printed hard copy of online form may be made by hand and initialled before dispatch or submission to the Commission, whereafter no request for change in any entry of online application or its hard copy shall be accepted.',
      '7. No plea that hardcopy of online application form or any document attached therewith has been lost or delayed in the post shall be entertained.',
      "8. The candidate shall have to pay or deposit two hundred and fifty Rupees in the Commission's head of account as fine, if hard copy of online application is received without signature, subject to no other deficiency in application or attached documents, otherwise his application shall stand rejected.",
      '9. Hardcopy of the online application must be dispatched in a separate envelope. Two or more applications in one envelope shall not be acceptable.',
      "10. Candidate shall pay two thousand two hundred Rupees, or such other fee as the Commission may determine from time to time, as application fee for competitive examination as per procedure prescribed in Appendix-II and deposited in the nearest Government's treasury or in State Bank or National Bank of Pakistan under the head of account C02101-Organs of State Exam Fee (FPSC Receipt). Cash, postal orders, bank drafts and cheques shall not be accepted by the Commission.",
      '11. Original treasury receipt for written examination must be attached with the application form to be deposited to the Commission. Without providing original treasury receipt, the application of the candidate shall be rejected.',
      '12. Subjects for the competitive examination shall comprise compulsory papers of 600 marks and optional papers of 600 marks.',
      '13. Optional subjects must be selected carefully, as wrong selection of subjects shall lead to rejection of candidature.',
      '14. Combination of optional subjects once chosen before closing date for submission of online application or corrected in hard copy of online application shall be treated as final and no request for change in subjects shall be allowed thereafter.',
      '15. A candidate who misses any compulsory or optional subject of written examination for medical or any other reasons shall neither be allowed to appear in the remaining subjects nor separate examination for re-appearing in that missed paper shall be allowed.',
      '16. No candidate shall be eligible to avail more than three chances of the competitive examination within prescribed age-limits.',
      'Explanation.- A candidate shall be deemed to have attempted the examination and his chance stand consumed, if he actually appeared in any one or more papers of the competitive examination and even if he tendered blank answer book or sheet and even if rejected subsequently.',
      '17. A candidate who conceals the number of previous attempts, shall be liable to prosecution leading to his disqualification under these rules.',
      "18. No candidate shall be admitted to the examination hall who does not hold original Computerized National Identity Card (CNIC) and admission certificate generated or downloaded from the Commission's website i.e. www.fpsc.gov.pk as admission certificate shall not be sent through post.",
      '19. A candidate who arrives at examination hall or centre late, than the time mentioned in admission certificate and date sheet, he shall not be allowed to sit in the examination.',
      '20. Candidates shall be admitted to the examination provisionally at their own risk subject to their being found eligible in all respects. On detailed scrutiny of the applications after the announcement of result of the written examination, if any candidate is found ineligible in any respect under these rules his candidature shall be cancelled and rejected regardless of the fact whether he has appeared in the examination or qualified therein.',
      '21. To avoid inconvenience, candidates shall ensure before appearing at the examination that they fulfill all requirements of the rules, relating to the examination.',
    ],
  },
  {
    title: 'CSS Occupational Groups',
    content: [
      'The competitive examination shall be conducted by the Commission in respect of the Occupational Groups and Services consisting of:',
      '1. Commerce and Trade Group',
      '2. Foreign Service of Pakistan',
      '3. Information Group',
      '4. Inland Revenue Service',
      '5. Military Lands and Cantonments Group',
      '6. Office Management Group',
      '7. Pakistan Administrative Service',
      '8. Pakistan Audit and Accounts Service',
      '9. Pakistan Customs Service',
      '10. Police Service of Pakistan',
      '11. Postal Group',
      '12. Railways (Commercial and Transportation) Group',
    ],
  },
  {
    title: 'CSS Qualifying Marks for Written Exam',
    content: [
      '1. A candidate who fails to secure at least 40% marks in any of the compulsory subjects, 33% marks in any of the optional subjects and 50% marks in the aggregate shall be considered to have failed in written examination and shall not be eligible for medical examination, psychological assessment and viva voce.',
      '2. Only the candidates declared qualified in the written examination and found eligible shall be called for subsequent medical examination, psychological assessment and viva voce.',
    ],
  },
  {
    title: 'CSS Medical Examination',
    content: [
      '1. All candidates must be in good mental and bodily health and free from any physical defect likely to interfere with the discharge of their duties. The candidates who after such medical examination which the Commission and the appointing authority may prescribe are found not to satisfy these requirements shall not be appointed except special candidates as mentioned in sub-rule (2) of CSS Competitive Examination Rules, 2019.',
      '2. Special candidates in the categories of physically impaired, hearing or speech impaired and visually impaired shall be eligible to compete for competitive examination against all Occupational Groups and Services according to his choice.',
      '3. Special candidates who are visually impaired or physically impaired shall be provided helper (writer), if they have been, by any Federal or a Provincial Council for Rehabilitation of Disabled Persons, declared permanently incapacitated with respect to writing and a disability certificate in that regard has been attached by them with application form and also requested for provision of helper in their application form. The Commission shall arrange the helper from within the available staff of the Commission deputed at the examination centre. The role of the helper would merely be to reproduce in writing the words so uttered by the special candidate. No intellectual contribution by the helper shall be permissible. The educational level of the helper would be graduation, intermediate or matriculation as per availability at the examination centre. No request for helper of choice or venue of the examination shall be entertained. The special candidate alongwith helper shall remain within the examination hall till conclusion of the paper.',
      '4. Extra time of 15 minutes per hour shall only be allowed to visually impaired candidates. The other categories of special candidates shall not be allowed extra time.',
      "5. The special candidate referred to in sub-rules (3) and (4) of CSS Competitive Examination Rules, 2019 may attempt the question paper on computer, as the case may be, for which facility shall only be provided at the Commission's headquarters and its provincial offices, however, no TA/DA shall be admissible. Such computer literate candidates shall fill the relevant entries in the online application form, else they shall not be allowed to attempt the paper on computer.",
      '6. No application or medical certificate regarding claim for disability or request for provision of helper or computer on medical grounds or sudden accident, shall be accepted after the closing date, except where the claim has been made in the application form before the closing date and certificate of disability as aforesaid attached as an evidence.',
      '7. Candidates who qualify the written examination shall be medically examined by the medical board constituted for the purpose. If any candidate remains absent twice in his medical examination, his candidature shall automatically stand rejected and no appeal in this regard shall be entertained and his chance shall be considered as consumed.',
      "8. In order to prevent disappointment, candidates may get themselves examined by a Government's medical officer of the standing of a civil surgeon before applying for admission to the examination.",
    ],
  },
  {
    title: 'CSS Viva Voce',
    content: [
      '1. A candidate who is declared qualified in written examination shall be interviewed by a board who shall have before them a record of his career, both academic and extramural and he shall be asked questions on matters of general interest. The object of the interview is to assess his suitability for the services for which he is entered and in framing their assessment the board shall attach particular importance to the moral and ethical qualities of the candidates, his intelligence and alertness of mind, his vigour and strength of character and his potential qualities of leadership. The board shall take into consideration his extramural activities such as sports, debates, hobbies, etc., and their effect on his physique and character, in assessing his merit.',
      '2. All candidates are expected to have basic knowledge regarding Islam and Pakistan. Questions may be asked in the viva voce on these subjects. Persons securing less than pass marks in these subjects shall not be considered for appointment, irrespective of their proficiency in other fields. However, the non-Muslim candidates shall not be asked any question regarding Islam.',
      '3. Viva voce shall be of 300 marks. A candidate who fails to secure at least 100 marks in viva voce shall be considered to have failed and shall not be eligible for appointment.',
      '4. The result of viva voce shall be intimated to all candidates in due course of time.',
    ],
  },
]

const formatPastPaperTitle = (relativePath) => {
  const fileName = relativePath.split('/').pop() || ''
  const noTimestamp = fileName
    .replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const withoutExt = noTimestamp.replace(/\.pdf$/i, '')
  return withoutExt
    .replace(/&amp;/gi, '&')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatStudySlideTitle = (fileName) => {
  const withoutExt = fileName.replace(/\.(ppt|pptx|pdf)$/i, '')
  return withoutExt
    .replace(/^Guardian_Angel_CSS_/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractLectureNumber = (fileName) => {
  const match = fileName.match(/Lecture_(\d+)/i)
  return match ? Number(match[1]) : null
}

const criminologySlideFiles = [
  'Guardian_Angel_CSS_Criminology_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_2_Section_I.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_3_Section_II.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_4_Section_III.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_5_Section_IV.pptx',
]

const genderStudiesSlideFiles = [
  'Guardian_Angel_CSS_Gender_Studies_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_2_Section_I.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_3_Social_Construction_of_Gender.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_4_Feminist_Theories_and_Practice.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_5_Feminist_Movements.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_6_Gender_and_Development.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_7_Status_of_Women_in_Pakistan.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_8_Gender_and_Governance.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_9_Gender_Based_Violence.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_10_Case_Studies.pptx',
]

const criminologySlides = criminologySlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS Crimionlgy Lecture Sides/${fileName}`, import.meta.url).href,
}))

const genderStudiesSlides = genderStudiesSlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS Gender Studies Lecture Sides/${fileName}`, import.meta.url).href,
}))

const cssStudyMaterials = [
  {
    subject: 'Criminology',
    description: 'Foundational to advanced criminology lectures curated for CSS aspirants.',
    slides: criminologySlides,
  },
  {
    subject: 'Gender Studies',
    description: 'Complete lecture sequence covering core concepts, theories, and case studies.',
    slides: genderStudiesSlides,
  },
]

const cssPastPapers2025Paths = [
  'assets/media/2025-06-05-06-24-08-Accountancy-&amp;-Auditing-I-.pdf',
  'assets/media/2025-06-05-06-24-11-Accountancy-&amp;-Auditing-II-.pdf',
  'assets/media/2025-06-05-06-24-16-AGRICULTURE-&amp;-FORESTRY-.pdf',
  'assets/media/2025-06-05-06-24-19-ANTHROPOLOGY--.pdf',
  'assets/media/2025-06-05-06-24-23-APPLIED-MATHS.pdf',
  'assets/media/2025-06-05-06-24-27-ARABIC.pdf',
  'assets/media/2025-06-05-06-24-32-BALOCHI.pdf',
  'assets/media/2025-06-05-06-24-36-BOTANY.pdf',
  'assets/media/2025-06-05-06-24-40-BRITISH-HISTORY.pdf',
  'assets/media/2025-06-05-06-24-44-BUSINESS-ADMN.pdf',
  'assets/media/2025-06-05-06-24-48-CHEMISTRY-1.pdf',
  'assets/media/2025-06-05-06-24-52-CHEMISTRY-2.pdf',
  'assets/media/2025-06-05-06-24-56-COMARATIVE-ST.-NM-.pdf',
  'assets/media/2025-06-05-06-25-04-COMPUTER-SCIENCE-PAPER-1.pdf',
  'assets/media/2025-06-05-06-25-08-COMPUTER-SCIENCE-PAPER-2.pdf',
  'assets/media/2025-06-05-06-25-12-CONSTITUTIONAL-LAW.pdf',
  'assets/media/2025-06-05-06-25-16-CRIMINOLOGY.pdf',
  'assets/media/2025-06-05-06-25-20-ECONOMICS-PAPER-1.pdf',
  'assets/media/2025-06-05-06-25-25-ECONOMICS-PAPER-2.pdf',
  'assets/media/2025-06-05-06-25-33-ENGLISH-(P&amp;C).pdf',
  'assets/media/2025-06-05-06-25-37-ENGLISH-LITERATURE.pdf',
  'assets/media/2025-06-05-06-27-15-ENVIRONMENTAL-SC..pdf',
  'assets/media/2025-06-05-06-27-22-ESSAY-25.pdf',
  'assets/media/2025-06-05-06-27-29-EUROPEAN-HISTORY.pdf',
  'assets/media/2025-06-05-06-27-34-GENDER-STUDIES.pdf',
  'assets/media/2025-06-05-06-27-42-GEOGRAPHY.pdf',
  'assets/media/2025-06-05-06-27-45-GEOLOGY.pdf',
  'assets/media/2025-06-05-06-29-50-GK2--(CA)-.pdf',
  'assets/media/2025-06-05-06-29-55-GK3-PAK-AFFAIRS-.pdf',
  'assets/media/2025-06-05-06-30-01-GK-I.pdf',
  'assets/media/2025-06-05-06-32-49-GOVERNANCE-&amp;-P.P..pdf',
  'assets/media/2025-06-05-06-32-52-History-of-USA.pdf',
  'assets/media/2025-06-05-06-32-56-HISTORY-PAK-&amp;-INDIA.pdf',
  'assets/media/2025-06-05-06-32-59-INTERNATIONAL-LAW.pdf',
  'assets/media/2025-06-05-06-33-04-IR-1.pdf',
  'assets/media/2025-06-05-06-33-07-IR-II.pdf',
  'assets/media/2025-06-05-06-33-10-ISLAMIC-HISTORY.pdf',
  'assets/media/2025-06-05-06-33-15-ISLAMIC-STUDIES.pdf',
  'assets/media/2025-06-05-06-33-20-JOURNALISM-&amp;-Mass-communication-.pdf',
  'assets/media/2025-06-05-06-33-25-LAW.pdf',
  'assets/media/2025-06-05-06-33-28-MERCANTILE-LAW.pdf',
  'assets/media/2025-06-05-06-33-33-MUSLIM-LAW-&amp;-JURIS.pdf',
  'assets/media/2025-06-05-06-33-40-PASHTO-.pdf',
  'assets/media/2025-06-05-06-33-44-PERSIAN.pdf',
  'assets/media/2025-06-05-06-33-48-PHILOSOPHY.pdf',
  'assets/media/2025-06-05-06-33-53-PHYSICS-1.pdf',
  'assets/media/2025-06-05-06-33-56-PHYSICS-2.pdf',
  'assets/media/2025-06-05-06-34-00-POL.SCIENCE-PAPER-1.pdf',
  'assets/media/2025-06-05-06-34-05-POL.SCIENCE-PAPER-2.pdf',
  'assets/media/2025-06-05-06-34-11-PSYCHOLOGY.pdf',
  'assets/media/2025-06-05-06-34-16-PUBLIC-ADMNISTRATION.pdf',
  'assets/media/2025-06-05-06-34-20-PUNJABI.pdf',
  'assets/media/2025-06-05-06-34-23-PURE-MATHS.pdf',
  'assets/media/2025-06-05-06-34-30-SINDHI.pdf',
  'assets/media/2025-06-05-06-34-34-SOCIOLOGY-.pdf',
  'assets/media/2025-06-05-06-34-39-STATISTICS.pdf',
  'assets/media/2025-06-05-06-34-43-TOWN-PLANNING.pdf',
  'assets/media/2025-06-05-06-34-49-URDU-LITERATURE.pdf',
  'assets/media/2025-06-05-06-34-56-ZOOLOGY.pdf',
]

const cssPastPapers2025 = cssPastPapers2025Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2024Paths = [
  'assets/media/2024-06-27-05-06-15-PURE-MATHS.pdf',
  'assets/media/2024-06-27-05-06-15-AGRICULTURE-&amp;-FORESTRY-.pdf',
  'assets/media/2024-06-27-05-06-15-ARABIC.pdf',
  'assets/media/2024-06-27-05-06-15-BALOCHI.pdf',
  'assets/media/2024-06-27-05-06-15-CRIMINOLOGY.pdf',
  'assets/media/2024-06-27-05-06-15-ECONOMICS-PAPER-2.pdf',
  'assets/media/2024-06-27-05-06-15-ECONOMICS-PAPER-1.pdf',
  'assets/media/2024-06-27-05-06-15-CONSTITUTIONAL-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-COMPUTER-SCIENCE-PAPER-1.pdf',
  'assets/media/2024-06-27-05-06-15-COMPUTER-SCIENCE-PAPER-2.pdf',
  'assets/media/2024-06-27-05-06-15-ENGLISH-LITERATURE.pdf',
  'assets/media/2024-06-27-05-06-15-ENVIRONMENTAL-SC..pdf',
  'assets/media/2024-06-27-05-06-15-ESSAY.pdf',
  'assets/media/2024-06-27-05-06-15-GENDER-STUDIES.pdf',
  'assets/media/2024-06-27-05-06-15-EUROPEAN-HISTORY.pdf',
  'assets/media/2024-06-27-05-06-15-ENGLISH-(P&amp;C).pdf',
  'assets/media/2024-06-27-05-06-15-History-of-USA.pdf',
  'assets/media/2024-06-27-05-06-15-GOVERNANCE-&amp;-P.P..pdf',
  'assets/media/2024-06-27-05-06-15-GK-I.pdf',
  'assets/media/2024-06-27-05-06-15-GK2--(CA)-.pdf',
  'assets/media/2024-06-27-05-06-15-GK3-PAK-AFFAIRS-.pdf',
  'assets/media/2024-06-27-05-06-15-GEOGRAPHY.pdf',
  'assets/media/2024-06-27-05-06-15-INTERNATIONAL-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-HISTORY-PAK-&amp;-INDIA.pdf',
  'assets/media/2024-06-27-05-06-15-IR-II.pdf',
  'assets/media/2024-06-27-05-06-15-ISLAMIC-HISTORY.pdf',
  'assets/media/2024-06-27-05-06-15-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-JOURNALISM-&amp;-Mass-communication-.pdf',
  'assets/media/2024-06-27-05-06-15-ISLAMIC-STUDIES.pdf',
  'assets/media/2024-06-27-05-06-15-MUSLIM-LAW-&amp;-JURIS.pdf',
  'assets/media/2024-06-27-05-06-15-PERSIAN.pdf',
  'assets/media/2024-06-27-05-06-15-PHILOSOPHY.pdf',
  'assets/media/2024-06-27-05-06-15-PASHTO-.pdf',
  'assets/media/2024-06-27-05-06-15-PSYCHOLOGY.pdf',
  'assets/media/2024-06-27-05-06-15-POL.SCIENCE-PAPER-2.pdf',
]

const cssPastPapers2024 = cssPastPapers2024Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2023Paths = [
  'assets/media/2024-06-13-Computer-Science,-Paper-2.pdf',
  'assets/media/2024-06-13-Economics-Paper-1.pdf',
  'assets/media/2024-06-13-English-(P&amp;C)-subjective.pdf',
  'assets/media/2024-06-13-Economics-2.pdf',
  'assets/media/2024-06-13-English-Literature.pdf',
  'assets/media/2024-06-13-Criminology.pdf',
  'assets/media/2024-06-13-Environmental-Science.pdf',
  'assets/media/2024-06-13-Essay.pdf',
  'assets/media/2024-06-13-European-History.pdf',
  'assets/media/2024-06-13-Gender-Studies.pdf',
  'assets/media/2024-06-13-Geology.pdf',
  'assets/media/2024-06-13-Geography.pdf',
  'assets/media/2024-06-13-GK3-(Pakistan-Affairs).pdf',
  'assets/media/2024-06-13-Governance-&amp;-P.Policies.pdf',
  'assets/media/2024-06-13-GK-I-(General-Science-and-Ability).pdf',
  'assets/media/2024-06-13-History-of-Pakistan-&amp;-India.pdf',
  'assets/media/2024-06-13-IR-II.pdf',
  'assets/media/2024-06-13-International-Law.pdf',
  'assets/media/2024-06-13-IR-1.pdf',
  'assets/media/2024-06-13-History-of-USA.pdf',
  'assets/media/2024-06-13-Islamic-History-and-Culture.pdf',
  'assets/media/2024-06-13-Islamic-Studies.pdf',
  'assets/media/2024-06-13-Law.pdf',
  'assets/media/2024-06-13-Journalism-and-Mass-Communication.pdf',
  'assets/media/2024-06-13-Persian.pdf',
  'assets/media/2024-06-13-Philosophy.pdf',
  'assets/media/2024-06-13-Muslim-Law-&amp;-Jurisprudence.pdf',
  'assets/media/2024-06-13-Physics-Paper-2.pdf',
  'assets/media/2024-06-13-Physics-Paper-1.pdf',
  'assets/media/2024-06-13-Mercantile-Law.pdf',
  'assets/media/2024-06-13-Pol-Science-Paper-1.pdf',
  'assets/media/2024-06-13-Psychology.pdf',
  'assets/media/2024-06-13-Punjabi-subjective.pdf',
  'assets/media/2024-06-13-Pol-Science-Paper-2.pdf',
  'assets/media/2024-06-13-Pure-Mathematics.pdf',
  'assets/media/2024-06-13-Public-Administration.pdf',
  'assets/media/2024-06-13-Town-Planning-and-Urban-Mgmt.pdf',
  'assets/media/2024-06-13-Pushto.pdf',
  'assets/media/2024-06-13-Sociology.pdf',
  'assets/media/2024-06-13-Sindhi.pdf',
  'assets/media/2024-06-13-Statistics.pdf',
  'assets/media/2024-06-13-Urdu-Literature.pdf',
  'assets/media/2024-06-13-Zoology.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-I.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-II.pdf',
  'assets/media/2024-06-13-Agriculture-&amp;-Forestry.pdf',
  'assets/media/2024-06-13-Applied-Mathematics.pdf',
  'assets/media/2024-06-13-Anthropology.pdf',
  'assets/media/2024-06-13-Arabic.pdf',
  'assets/media/2024-06-13-Balochi.pdf',
  'assets/media/2024-06-13-Botany.pdf',
  'assets/media/2024-06-13-British-History.pdf',
  'assets/media/2024-06-13-Chemistry,-Paper-I.pdf',
  'assets/media/2024-06-13-Chemistry-II.pdf',
  'assets/media/2024-06-13-Business-Administration.pdf',
  'assets/media/2024-06-13-Comparitive--Studies.-NM.pdf',
]

const cssPastPapers2023 = cssPastPapers2023Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2022Paths = [
  'assets/media/2024-06-13-Constitutional-Law-subjective.pdf',
  'assets/media/2024-06-13-European-History-subjective.pdf',
  'assets/media/2024-06-13-Gender-Studies-subjective.pdf',
  'assets/media/2024-06-13-GK3-PAK-AFFAIRS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-GK-I--subjective.pdf',
  'assets/media/2024-06-13-History-of-Pakistan-&amp;-India-subjective.pdf',
  'assets/media/2024-06-13-International-Law--subjective.pdf',
  'assets/media/2024-06-13-HISTORY-OF-THE-USA-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-IR-1-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-IR-II-Subjective-.pdf',
  'assets/media/2024-06-13-ISLAMIC-HISTORY-AND-CULTURE-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-LAW-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-JOURNALISM-&amp;-MASS-COM-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Islamic-Studies-subjective.pdf',
  'assets/media/2024-06-13-PASHTO-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-MERCANTILE-LAW-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Muslim-Law-&amp;-Jurisprudence-subjective.pdf',
  'assets/media/2024-06-13-PHILOSOPHY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-PHYSICS-PAPER-1-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Persian-subjective.pdf',
  'assets/media/2024-06-13-POL.SCIENCE-PAPER-1.-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Physics-II-subjective.pdf',
  'assets/media/2024-06-13-POL.SCIENCE-PAPER-2.-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-PURE-MATHEMATICS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Public-Administration-subjective.pdf',
  'assets/media/2024-06-13-Psychology-subjective.pdf',
  'assets/media/2024-06-13-SOCIOLOGY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Sindhi-subjective.pdf',
  'assets/media/2024-06-13-Statistics-subjective.pdf',
  'assets/media/2024-06-13-TOWN-PLANNING-&amp;-URBAN-MNGT-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Urdu-Literature-subjective.pdf',
  'assets/media/2024-06-13-Zoology-subjective.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-II--subjective.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-I--subjective.pdf',
  'assets/media/2024-06-13-AGRICULTURE-&amp;-FORESTRY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-ANTHROPOLOGY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Balochi-subjective.pdf',
  'assets/media/2024-06-13-Botany-subjective.pdf',
  'assets/media/2024-06-13-BUSINESS-ADMINISTRATION-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-APPLIED-MATHEMATICS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-British-History-subjective.pdf',
  'assets/media/2024-06-13-Chemistry,-Paper-I-subjective.pdf',
  'assets/media/2024-06-13-Chemistry-II--subjective.pdf',
  'assets/media/2024-06-13-COMARATIVE-ST.-NM-SUBJECTIVE-(1).pdf',
  'assets/media/2024-06-13-Computer-Science,-Paper-2-subjective.pdf',
  'assets/media/2024-06-13-COMPUTER-SCIENCE-PAPER-1-SUBJECTIVE.pdf',
]

const cssPastPapers2022 = cssPastPapers2022Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapersByYear = [
  {
    year: '2025',
    sourceUrl: 'https://www.fpsc.gov.pk/category/css-2025-descriptive-papers-1241569033-2025-06-05',
    papers: cssPastPapers2025,
  },
  {
    year: '2024',
    sourceUrl: 'https://www.fpsc.gov.pk/category/css-2023-descriptive-papers-516644049-2024-06-27',
    papers: cssPastPapers2024,
  },
  {
    year: '2023',
    sourceUrl: 'https://fpsc.gov.pk/category/css-2023-descriptive-papers-1663083777-2024-06-13',
    papers: cssPastPapers2023,
  },
  {
    year: '2022',
    sourceUrl: 'https://fpsc.gov.pk/category/css-2023-descriptive-papers-815643912-2024-06-13',
    papers: cssPastPapers2022,
  },
]

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DUMMY_TEST_PROFILE = {
  username: 'guardian.student',
  password: 'Study@123',
  fullName: 'Guardian Test Student',
}
const TESTING_SIGNIN_DRAFT_KEY = 'ga-testing-signin-draft'
const TESTING_PLANNER_FORM_KEY = 'ga-testing-planner-form'

const DEFAULT_PLANNER_FORM = {
  examDate: '',
  studyHours: '6',
  productiveHours: ['07:00-08:00', '08:00-09:00', '09:00-10:00'],
  stage: 'beginner',
  cssAttempt: 'first',
  difficulty: 'difficult',
  learningPreference: 'lectures-first',
}

const PRODUCTIVE_HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const startHour = index + 5
  const endHour = startHour + 1
  const id = `${`${startHour}`.padStart(2, '0')}:00-${`${endHour}`.padStart(2, '0')}:00`
  return {
    id,
    startHour,
    label: `${`${startHour}`.padStart(2, '0')}:00 - ${`${endHour}`.padStart(2, '0')}:00`,
  }
})
const PLANNER_CORE_COMPULSORY_SUBJECTS = compulsorySubjects.slice(0, 5)
const COMPULSORY_ELECTIVE_OPTIONS = [
  'Islamiat (100 Marks)',
  'Comparative Study of Major Religions (For Non Muslims)',
]
const WATERMARK_IMAGE_URL = new URL('../data/watermark.png', import.meta.url).href
const LOCAL_OUTLINE_IMAGE_URLS = {
  punjabi: [new URL('../data/punjabi-literature-outline-merged.png', import.meta.url).href],
  sindhi: [new URL('../data/sindhi-literature-outline-merged.png', import.meta.url).href],
  balochi: [new URL('../data/balochi-literature-outline-merged.png', import.meta.url).href],
}
const OPTIONAL_SUBJECT_META = optionalGroups.flatMap((group, groupIndex) =>
  group.subjects.map((subject) => {
    const marksMatch = subject.match(/\((\d+)\s*Marks\)/i)
    const marks = marksMatch ? Number(marksMatch[1]) : 100
    const baseTitle = subject.replace(/\s*\(\d+\s*Marks\)/i, '').trim()
    return {
      subject,
      baseTitle,
      group: group.group,
      groupIndex,
      rules: group.rules,
      marks,
    }
  }),
)
const OPTIONAL_META_MAP = Object.fromEntries(
  OPTIONAL_SUBJECT_META.map((item) => [item.subject, item]),
)

const CALENDAR_STATUS_OPTIONS = [
  { id: 'planned', label: 'Planned Study', className: 'status-planned' },
  { id: 'completed', label: 'Marked Completed', className: 'status-completed' },
  { id: 'revision', label: 'Revision Focus', className: 'status-revision' },
  { id: 'mock-test', label: 'Mock Test Day', className: 'status-mock' },
  { id: 'catch-up', label: 'Catch-up Day', className: 'status-catchup' },
  { id: 'rest', label: 'Rest / Recovery', className: 'status-rest' },
  { id: 'skipped', label: 'Skipped', className: 'status-skipped' },
]

const SUBJECT_PERFORMANCE_LEVELS = [
  { id: 'Survivor', scoreHint: 'around 40 marks' },
  { id: 'Contendor', scoreHint: 'above 50 marks' },
  { id: 'Topper', scoreHint: 'above 65 marks' },
]
const DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES = 60
const PLANNER_TAB_SEQUENCE = [
  { id: 'subjects', label: 'Subject Locker' },
  { id: 'strategy', label: 'Strategy Builder' },
  { id: 'performance', label: 'Performance Analysis' },
  { id: 'timer', label: 'Timer & Analytics' },
  { id: 'social', label: 'Social Balance' },
  { id: 'calendar', label: 'Guardian Calendar' },
  { id: 'report', label: 'Guardian Angel Report' },
]
const getNextPerformanceLevel = (currentLevel) => {
  const levelOrder = SUBJECT_PERFORMANCE_LEVELS.map((item) => item.id)
  const currentIndex = levelOrder.indexOf(currentLevel)
  if (currentIndex < 0) return levelOrder[0]
  return levelOrder[(currentIndex + 1) % levelOrder.length]
}
const PERFORMANCE_LEVEL_SCORE_MAP = {
  Survivor: 40,
  Contendor: 50,
  Topper: 65,
}
const clampToPercent = (value) => Math.max(0, Math.min(100, Math.round(value)))

const formatDayKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatClock = (totalMinutes) => {
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${`${minute}`.padStart(2, '0')} ${suffix}`
}

const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`
}
const resolveElapsedSeconds = (accumulatedSeconds, startedAtMs) => {
  if (!startedAtMs) return Math.max(0, Math.floor(accumulatedSeconds || 0))
  const base = Math.max(0, Math.floor(accumulatedSeconds || 0))
  const delta = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
  return base + delta
}

const formatDateDDMMYYYY = (isoDate) => {
  if (!isoDate) return '--/--/----'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return '--/--/----'
  return `${day}/${month}/${year}`
}

const stripHundredMarks = (value) => value.replace(/\s*\(100\s*Marks\)/gi, '').trim()

const fileToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const resolveOutlineImageCandidates = (sourceUrl, imagePath) => {
  if (!imagePath) return []
  if (/^https?:\/\//i.test(imagePath)) return [imagePath]

  const candidates = new Set()

  // Prefer same-origin media first (works when files are hosted in this app).
  try {
    candidates.add(new URL(imagePath, window.location.origin).toString())
  } catch {
    // ignore URL parse issues and continue fallbacks
  }

  if (imagePath.startsWith('/')) {
    if (sourceUrl) {
      try {
        const origin = new URL(sourceUrl).origin
        candidates.add(`${origin}${imagePath}`)
      } catch {
        // ignore fallback parse failure
      }
    }
    candidates.add(imagePath)
    return Array.from(candidates)
  }
  if (sourceUrl) {
    try {
      candidates.add(new URL(imagePath, sourceUrl).toString())
    } catch {
      // ignore fallback parse failure
    }
  }
  candidates.add(imagePath)
  return Array.from(candidates)
}

const imageUrlToPngDataUrl = async (imageUrl) => {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('Unable to fetch outline image.')
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error('Fetched resource is not an image.')
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const imageElement = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = imageElement.width
    canvas.height = imageElement.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to prepare image canvas.')
    ctx.drawImage(imageElement, 0, 0)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function Header({ theme, onToggleTheme, authUser, onLogout }) {
  const [animateToggle, setAnimateToggle] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'CSS Rules', to: '/css-rules' },
    { label: 'CSS Syllabus', to: '/css-syllabus' },
    { label: 'CSS Past Papers', to: '/css-past-papers' },
    { label: 'CSS Study Material', to: '/css-study-material' },
    { label: 'Guardian Study Planner', to: '/guardian-study-planner' },
  ]

  const handleThemeToggle = () => {
    setAnimateToggle(true)
    onToggleTheme()
    window.setTimeout(() => setAnimateToggle(false), 800)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const renderNavLabel = (label) => {
    const words = label.trim().split(/\s+/)
    if (words.length <= 2) return label

    return (
      <span className="nav-label-multiline">
        <span>{words.slice(0, 2).join(' ')}</span>
        <span className="nav-label-secondary">{words.slice(2).join(' ')}</span>
      </span>
    )
  }

  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <Link className="brand" to="/" aria-label="Guardian Angel home">
          <img src={logo} alt="Guardian Angel logo" />
          <div>
            <strong>Guardian Angel</strong>
            <span>Knowledge Is Priceless</span>
          </div>
        </Link>

        <button
          className={`nav-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
          <div className="nav-links">
            {navItems.map((item) =>
              item.to.startsWith('/#') ? (
                <a key={item.label} href={item.to} onClick={closeMobileMenu}>
                {renderNavLabel(item.label)}
                </a>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-active' : '')}
                  onClick={closeMobileMenu}
                >
                {renderNavLabel(item.label)}
                </NavLink>
              ),
            )}
          </div>

          <div className="nav-actions">
            <a className="btn btn-nav" href="/#student-message" onClick={closeMobileMenu}>
              Start Preparation
            </a>
            {authUser ? (
              <button
                className="btn btn-secondary nav-auth-btn"
                type="button"
                onClick={() => {
                  closeMobileMenu()
                  onLogout()
                }}
              >
                Logout
              </button>
            ) : (
              <Link className="btn btn-secondary nav-auth-btn" to="/signin" onClick={closeMobileMenu}>
                Sign In
              </Link>
            )}
            <button
              className={`btn btn-secondary theme-toggle ${animateToggle ? 'animate' : ''}`}
              type="button"
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span aria-hidden="true" className="theme-icon">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" role="img">
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2.2v3M12 18.8v3M2.2 12h3M18.8 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M19.2 4.8l-2.1 2.1M6.9 17.1l-2.1 2.1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M21 14.8A9.2 9.2 0 1 1 9.2 3a7.5 7.5 0 1 0 11.8 11.8Z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

function HomePage() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal-on-scroll')
    if (revealItems.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            currentObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section className="intro" id="home">
        <div className="intro-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata" poster={logo}>
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay" aria-hidden="true" />

        <section className="hero container">
          <div className="hero-copy reveal-on-scroll">
            
            <h1>Empowering Pakistan’s Future Leaders</h1>
            <p className="subtext">
              Guardian Angel is an independent platform dedicated to helping CSS aspirants across
              Pakistan access premium quality education completely free of cost.
            </p>
            
          </div>
        </section>
      </section>

      <main>
        <section className="mission container glass-panel reveal-on-scroll" id="mission">
          <div className="section-title">
            <h2>Knowledge is Priceless</h2>
          </div>
          <p className="mission-body">
            Talent should never be limited by money. In Pakistan, thousands of brilliant students
            cannot afford expensive academies. Guardian Angel exists to bridge that gap. Guardian Angel&apos;s mission is to democratize CSS education in Pakistan by providing
            world class preparation resources free of cost, ensuring that every talented student,
            regardless of financial background, has the opportunity to compete.
          </p>
          
        </section>

        <section className="highlights container" id="why-guardian-angel">
          {pillars.map((item, index) => (
            <article
              className="card reveal-on-scroll"
              key={item.title}
              style={{ '--reveal-delay': `${index * 100}ms` }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="message container glass-panel reveal-on-scroll" id="student-message">
          <div className="message-content">
            <div className="section-title">
              <h2>CSS is not just an examination.</h2>
            </div>
            <p className="message-body">
              It is a gateway to leadership, service, and national impact. Guardian Angel stands
              with every hardworking aspirant who dreams of wearing the badge of Pakistan&apos;s
              civil service.
            </p>
          </div>
          <div className="message-actions">
            <Link className="btn btn-primary home-action-btn" to="/css-rules">
              Browse CSS Rules
            </Link>
      </div>
        </section>

        <section className="cta container reveal-on-scroll" id="join">
          <div>
            
            <h2>If you have the determination, Guardian Angel will provide the guidance</h2>
            <p className="cta-subtext">
              High quality study material built for aspirants who are ready to work hard and
              serve the nation.
        </p>
      </div>
          <Link className="btn btn-primary home-action-btn" to="/css-syllabus">
            Browse CSS Syllabus
          </Link>
        </section>
      </main>
    </>
  )
}

function CssSyllabusPage() {
  return (
    <main className="page-main">
      <section className="syllabus container" id="css-syllabus">
        <div className="section-title">
          <p>CSS Syllabus</p>
          <h2>Compulsory and Optional Subjects</h2>
        </div>

        <article className="syllabus-block">
          <h3>Compulsory Subjects Syllabus</h3>
          <ul className="syllabus-list syllabus-list-links">
            {compulsorySubjects.map((subject) => (
              <li key={subject}>
                <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
              </li>
            ))}
          </ul>
        </article>

        <div className="optional-groups">
          {optionalGroups.map((item) => (
            <article className="group-card" key={item.group}>
              <h3>{item.group}</h3>
              <p className="group-rule">{item.rules}</p>
              <ul className="syllabus-list syllabus-list-links">
                {item.subjects.map((subject) => (
                  <li key={subject}>
                    <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

      </section>
    </main>
  )
}

function CssRulesPage() {
  const [openRuleIndex, setOpenRuleIndex] = useState(0)
  const handleRuleToggle = (index, event) => {
    const headerButton = event.currentTarget
    const topBefore = headerButton.getBoundingClientRect().top

    setOpenRuleIndex((current) => (current === index ? -1 : index))

    window.requestAnimationFrame(() => {
      const topAfter = headerButton.getBoundingClientRect().top
      const delta = topAfter - topBefore
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'auto' })
    })
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Rules</p>
          <h2>Introduction as per CSS Rules 2019</h2>
        </div>

        <p className="rules-source">
          Source:{' '}
          <a
            href="https://www.fpsc.gov.pk/category/introduction-as-per-css-rules-2019"
            target="_blank"
            rel="noreferrer"
          >
            Federal Public Service Commission (FPSC)
          </a>
        </p>

        <div className="rules-accordion">
          {cssRulesSections.map((rule, index) => {
            const isOpen = openRuleIndex === index
            return (
              <article className={`rule-item ${isOpen ? 'open' : ''}`} key={rule.title}>
                <button
                  className="rule-header"
                  type="button"
                  onClick={(event) => handleRuleToggle(index, event)}
                  aria-expanded={isOpen}
                >
                  <span>{rule.title}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>
                <div className={`rule-body ${isOpen ? 'open' : ''}`}>
                  <div className="rule-content">
                    {rule.content.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function CssPastPapersPage() {
  const [query, setQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => cssPastPapersByYear[0]?.year || '')
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()
  const paperCount = cssPastPapersByYear.reduce((total, item) => total + item.papers.length, 0)
  const selectedYearData = cssPastPapersByYear.find((item) => item.year === selectedYear) || null
  const visiblePapers = selectedYearData
    ? normalizedQuery
      ? selectedYearData.papers.filter((paper) => paper.title.toLowerCase().includes(normalizedQuery))
      : selectedYearData.papers
    : []

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Past Papers</p>
          <h2>CSS 2025 Descriptive Papers</h2>
        </div>

        <p className="rules-source">
          Source format:{' '}
          <a
            href="https://www.fpsc.gov.pk/category/previous-question-papers/2024"
            target="_blank"
            rel="noreferrer"
          >
            Federal Public Service Commission (FPSC)
          </a>
        </p>

        <div className="papers-toolbar">
          <div className={`year-select ${isYearMenuOpen ? 'open' : ''}`}>
            <button
              className="year-select-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isYearMenuOpen}
              onClick={() => setIsYearMenuOpen((current) => !current)}
            >
              <span>{selectedYear || 'Select year'}</span>
              <span className="year-select-icon">⌄</span>
            </button>
            {isYearMenuOpen ? (
              <div className="year-select-menu" role="listbox" aria-label="Select CSS past papers year">
                {cssPastPapersByYear.map((item) => (
                  <button
                    key={item.year}
                    type="button"
                    role="option"
                    aria-selected={selectedYear === item.year}
                    className={selectedYear === item.year ? 'selected' : ''}
                    onClick={() => {
                      setSelectedYear(item.year)
                      setQuery('')
                      setIsYearMenuOpen(false)
                    }}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input
            type="search"
            placeholder="Search paper name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS past papers"
            disabled={!selectedYearData}
          />
          <p>{selectedYearData ? `${visiblePapers.length} papers` : `${paperCount} papers total`}</p>
        </div>

        {!selectedYearData ? (
          <article className="papers-empty">
            <h3>Select a year to view papers</h3>
            <p>Choose a year from the dropdown above. Papers for that year will appear instantly.</p>
          </article>
        ) : (
          <>
            <p className="papers-year-source">
              Source:{' '}
              <a href={selectedYearData.sourceUrl} target="_blank" rel="noreferrer">
                FPSC CSS {selectedYearData.year} Descriptive Papers
              </a>
            </p>

            <div className="papers-grid">
              {visiblePapers.map((paper) => (
                <article className="paper-item" key={paper.url}>
                  <h3>{paper.title}</h3>
                  <a className="btn btn-primary" href={paper.url} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function CssStudyMaterialPage() {
  const [query, setQuery] = useState('')
  const [downloadingSubject, setDownloadingSubject] = useState('')
  const [openSubject, setOpenSubject] = useState('')
  const totalSlides = cssStudyMaterials.reduce((count, group) => count + group.slides.length, 0)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTotal = cssStudyMaterials.reduce(
    (count, group) =>
      count +
      group.slides.filter((slide) => slide.title.toLowerCase().includes(normalizedQuery)).length,
    0,
  )

  const getPublicSlideUrl = (slide) => new URL(slide.url, window.location.origin).toString()

  const triggerSlideDownload = (slide) => {
    const publicSlideUrl = getPublicSlideUrl(slide)
    const anchor = document.createElement('a')
    anchor.href = publicSlideUrl
    anchor.download = slide.fileName
    anchor.rel = 'noopener'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  const handleDownloadAll = async (group) => {
    const visibleSlides = group.slides.filter((slide) =>
      slide.title.toLowerCase().includes(normalizedQuery),
    )
    if (visibleSlides.length === 0) return

    setDownloadingSubject(group.subject)
    for (const slide of visibleSlides) {
      triggerSlideDownload(slide)
      await new Promise((resolve) => window.setTimeout(resolve, 170))
    }
    window.setTimeout(() => setDownloadingSubject(''), 250)
  }

  const openSlideViewer = (slide) => {
    const publicSlideUrl = getPublicSlideUrl(slide)
    const onlineViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicSlideUrl)}`
    window.open(onlineViewerUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Study Material</p>
          <h2>Criminology & Gender Studies Lecture Slides</h2>
        </div>

        <p className="rules-source">
          Access organized lecture slides with quick view and one-click download.
          <strong>{` ${totalSlides} slides available in total.`}</strong>
        </p>

        <div className="study-toolbar">
          <input
            type="search"
            placeholder="Search by slide title (e.g. Lecture 3, Governance, Criminology)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS study material slides"
          />
          <p>
            {normalizedQuery ? `${filteredTotal} matching slides` : `${totalSlides} total slides`}
          </p>
        </div>

        <div className="study-groups">
          {cssStudyMaterials.map((group) => {
            const visibleSlides = group.slides.filter((slide) =>
              slide.title.toLowerCase().includes(normalizedQuery),
            )
            const isOpen = openSubject === group.subject

            return (
              <article className={`study-group-card ${isOpen ? 'open' : ''}`} key={group.subject}>
                <button
                  className="study-group-trigger"
                  type="button"
                  onClick={() => setOpenSubject((current) => (current === group.subject ? '' : group.subject))}
                  aria-expanded={isOpen}
                >
                  <span>{group.subject}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>

                <div className={`study-group-body ${isOpen ? 'open' : ''}`}>
                  <header className="study-group-head">
                    <div className="study-group-topbar">
                      <div>
                        <p>{group.description}</p>
                      </div>
                      <div className="study-group-meta">
                        <span>{`${visibleSlides.length}/${group.slides.length} shown`}</span>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => handleDownloadAll(group)}
                          disabled={visibleSlides.length === 0 || downloadingSubject === group.subject}
                        >
                          {downloadingSubject === group.subject
                            ? 'Downloading...'
                            : `Download All (${visibleSlides.length})`}
                        </button>
                      </div>
                    </div>
                  </header>

                  {visibleSlides.length === 0 ? (
                    <article className="papers-empty study-empty">
                      <h3>No matching slides in {group.subject}</h3>
                      <p>Try a different keyword to view slides for this section.</p>
                    </article>
                  ) : (
                    <div className="study-slides-grid">
                      {visibleSlides.map((slide) => (
                        <article className="study-slide-item" key={slide.url}>
                          <div>
                            <div className="study-slide-top">
                              <p className="study-slide-tag">Lecture Slide</p>
                              <span className="study-lecture-badge">
                                {slide.lectureNumber ? `Lecture ${slide.lectureNumber}` : 'Lecture'}
                              </span>
                            </div>
                            <h4>{slide.title}</h4>
                          </div>
                          <div className="study-slide-actions">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => openSlideViewer(slide)}
                            >
                              View Slide
                            </button>
                            <a
                              className="btn btn-primary"
                              href={getPublicSlideUrl(slide)}
                              download={slide.fileName}
                            >
                              Download
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function SubjectDetailPage() {
  const { subjectSlug } = useParams()
  const slugAliases = {
    'english-precis-composition': 'english',
    gsa: 'general-science-ability',
    'islamic-studies': 'islamiat',
    'comparative-religions': 'comparative-study-of-major-religions',
  }

  const resolvedSlug = slugAliases[subjectSlug] ?? subjectSlug
  const subject = detailedSubjectPages.find(
    (item) => item.slug === resolvedSlug || item.sourceSlug === resolvedSlug,
  )

  if (!subject) {
    return (
      <main className="page-main">
        <section className="container subject-page">
          <h1>Subject not found</h1>
          <p>Please return to the syllabus page and choose a listed subject.</p>
          <Link className="btn btn-primary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main">
      <section className="container subject-page">
        <p className="kicker">Detailed CSS Subject Page</p>
        <h1>{subject.title}</h1>
        <div className="subject-meta-grid">
          <article className="subject-meta-card">
            <h3>Marks</h3>
            <p>{subject.marks}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Category</h3>
            <p>{subject.category}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Group</h3>
            <p>{subject.group}</p>
          </article>
        </div>

        <article className="subject-outline">
          <h2>Course Outline</h2>
          {subject.outlineImages?.length > 0 ? (
            <div className="outline-images">
              {subject.outlineImages.map((imagePath) => (
                <img key={imagePath} src={imagePath} alt={`${subject.title} course outline`} />
              ))}
            </div>
          ) : subject.outlineSections?.length > 0 ? (
            <div className="outline-sections">
              {subject.outlineSections.map((section) => (
                <section className="outline-section" key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.points?.length > 0 ? (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : subject.outline.length > 0 ? (
            <ul>
              {subject.outline.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>Detailed outline is not available yet for this subject.</p>
          )}
        </article>

        <div className="subject-actions">
          <Link className="btn btn-secondary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </div>
      </section>
    </main>
  )
}

function SignInPage({ onSignIn, authUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(TESTING_SIGNIN_DRAFT_KEY)
      const draft = raw ? JSON.parse(raw) : null
      return {
        username: draft?.username || '',
        password: draft?.password || '',
      }
    } catch {
      return { username: '', password: '' }
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (authUser) {
      const nextPath = location.state?.from || '/guardian-study-planner'
      navigate(nextPath, { replace: true })
    }
  }, [authUser, navigate, location.state])

  useEffect(() => {
    try {
      localStorage.setItem(TESTING_SIGNIN_DRAFT_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }
  }, [form])

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const isValidUser =
      form.username.trim() === DUMMY_TEST_PROFILE.username &&
      form.password === DUMMY_TEST_PROFILE.password

    if (!isValidUser) {
      setError('Invalid credentials. Use the testing credentials shown below.')
      return
    }

    onSignIn({
      username: DUMMY_TEST_PROFILE.username,
      fullName: DUMMY_TEST_PROFILE.fullName,
    })

    const nextPath = location.state?.from || '/guardian-study-planner'
    navigate(nextPath, { replace: true })
  }

  return (
    <main className="page-main">
      <section className="container auth-page">
        <div className="section-title">
          <p>Sign In Required</p>
          <h2>Access Guardian Study Planner</h2>
        </div>

        <article className="planner-card auth-card">
          <h3>Testing Credentials</h3>
          <p className="auth-note">
            Username: <strong>{DUMMY_TEST_PROFILE.username}</strong> | Password:{' '}
            <strong>{DUMMY_TEST_PROFILE.password}</strong>
          </p>

          <form className="planner-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>

            <button className="btn btn-primary planner-submit" type="submit">
              Sign In
            </button>
            {error ? <p className="planner-error">{error}</p> : null}
          </form>
        </article>
      </section>
    </main>
  )
}

function GuardianStudyPlannerPage({ authUser }) {
  const profileStorageKey = `ga-profile-${authUser.username}`
  const [activePlannerTab, setActivePlannerTab] = useState('subjects')
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const fallbackRaw = localStorage.getItem(TESTING_PLANNER_FORM_KEY)
      const fallbackForm = fallbackRaw ? JSON.parse(fallbackRaw) : null
      return {
        ...DEFAULT_PLANNER_FORM,
        ...(fallbackForm || {}),
        ...(profile?.plannerForm || {}),
      }
    } catch {
      return { ...DEFAULT_PLANNER_FORM }
    }
  })
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
  const [subjectLockerModalMessage, setSubjectLockerModalMessage] = useState('')
  const [selectedOptionalSubjects, setSelectedOptionalSubjects] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const next = profile?.selectedOptionalSubjects
      if (Array.isArray(next)) return next.filter((item) => OPTIONAL_META_MAP[item])
      return []
    } catch {
      return []
    }
  })
  const [selectedCompulsoryElective, setSelectedCompulsoryElective] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = profile?.selectedCompulsoryElective
      if (COMPULSORY_ELECTIVE_OPTIONS.includes(stored)) return stored
      return 'Islamiat (100 Marks)'
    } catch {
      return 'Islamiat (100 Marks)'
    }
  })
  const [subjectsLocked, setSubjectsLocked] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return Boolean(profile?.subjectsLocked)
    } catch {
      return false
    }
  })
  const [draggingSubject, setDraggingSubject] = useState('')
  const [outlinePdfUrl, setOutlinePdfUrl] = useState('')
  const [outlinePdfFileName, setOutlinePdfFileName] = useState('Guardian_Angel_CSS_Course_Outline.pdf')
  const [isGeneratingOutlinePdf, setIsGeneratingOutlinePdf] = useState(false)
  const [weeklyReportPdfUrl, setWeeklyReportPdfUrl] = useState('')
  const [weeklyReportPdfFileName, setWeeklyReportPdfFileName] = useState(
    'Guardian_Angel_Weekly_Report_Card.pdf',
  )
  const [isGeneratingWeeklyReportPdf, setIsGeneratingWeeklyReportPdf] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.completedDays || {}
    } catch {
      return {}
    }
  })
  const [dayStatuses, setDayStatuses] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.dayStatuses || {}
    } catch {
      return {}
    }
  })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [timerStatus, setTimerStatus] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const storedStatus = profile?.timerState?.status
      return storedStatus === 'running' || storedStatus === 'paused' ? storedStatus : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [timerAccumulatedSeconds, setTimerAccumulatedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.timerState?.accumulatedSeconds)
      return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0
    } catch {
      return 0
    }
  })
  const [timerStartedAtMs, setTimerStartedAtMs] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const startedAtMs = Number(profile?.timerState?.startedAtMs)
      const storedStatus = profile?.timerState?.status
      if (storedStatus !== 'running' || !Number.isFinite(startedAtMs)) return null
      return startedAtMs
    } catch {
      return null
    }
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const timerState = profile?.timerState || {}
      const accumulated = Number(timerState.accumulatedSeconds)
      const safeAccumulated = Number.isFinite(accumulated) ? accumulated : 0
      if (timerState.status === 'running' && Number.isFinite(Number(timerState.startedAtMs))) {
        return resolveElapsedSeconds(safeAccumulated, Number(timerState.startedAtMs))
      }
      return Math.max(0, Math.floor(safeAccumulated))
    } catch {
      return 0
    }
  })
  const [timerSessions, setTimerSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.timerSessions || []
    } catch {
      return []
    }
  })
  const [socialTimerStatus, setSocialTimerStatus] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const storedStatus = profile?.socialTimerState?.status
      return storedStatus === 'running' || storedStatus === 'paused' ? storedStatus : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [socialTimerAccumulatedSeconds, setSocialTimerAccumulatedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.socialTimerState?.accumulatedSeconds)
      return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0
    } catch {
      return 0
    }
  })
  const [socialTimerStartedAtMs, setSocialTimerStartedAtMs] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const startedAtMs = Number(profile?.socialTimerState?.startedAtMs)
      const storedStatus = profile?.socialTimerState?.status
      if (storedStatus !== 'running' || !Number.isFinite(startedAtMs)) return null
      return startedAtMs
    } catch {
      return null
    }
  })
  const [socialElapsedSeconds, setSocialElapsedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const socialTimerState = profile?.socialTimerState || {}
      const accumulated = Number(socialTimerState.accumulatedSeconds)
      const safeAccumulated = Number.isFinite(accumulated) ? accumulated : 0
      if (socialTimerState.status === 'running' && Number.isFinite(Number(socialTimerState.startedAtMs))) {
        return resolveElapsedSeconds(safeAccumulated, Number(socialTimerState.startedAtMs))
      }
      return Math.max(0, Math.floor(safeAccumulated))
    } catch {
      return 0
    }
  })
  const [socialDailyLimitMinutes, setSocialDailyLimitMinutes] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.socialDailyLimitMinutes)
      if (!Number.isFinite(stored)) return DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES
      return Math.max(10, Math.min(360, Math.round(stored)))
    } catch {
      return DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES
    }
  })
  const [socialTimerSessions, setSocialTimerSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.socialTimerSessions || []
    } catch {
      return []
    }
  })
  const [subjectPerformanceLevels, setSubjectPerformanceLevels] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.subjectPerformanceLevels || {}
    } catch {
      return {}
    }
  })
  const [draggingPerformanceSubject, setDraggingPerformanceSubject] = useState('')
  const [selectedPerformanceSubject, setSelectedPerformanceSubject] = useState('')
  const [isManualDmcEnabled, setIsManualDmcEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.isManualDmcEnabled || false
    } catch {
      return false
    }
  })
  const [manualDmcScores, setManualDmcScores] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.manualDmcScores || {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      const profilePayload = {
        username: authUser.username,
        fullName: authUser.fullName,
        plannerForm: form,
        selectedCompulsoryElective,
        selectedOptionalSubjects,
        subjectsLocked,
        subjectPerformanceLevels,
        isManualDmcEnabled,
        manualDmcScores,
        completedDays,
        dayStatuses,
        timerSessions,
        socialTimerSessions,
        socialDailyLimitMinutes,
        timerState: {
          status: timerStatus,
          accumulatedSeconds: timerAccumulatedSeconds,
          startedAtMs: timerStartedAtMs,
        },
        socialTimerState: {
          status: socialTimerStatus,
          accumulatedSeconds: socialTimerAccumulatedSeconds,
          startedAtMs: socialTimerStartedAtMs,
        },
      }
      localStorage.setItem(profileStorageKey, JSON.stringify(profilePayload))
      localStorage.setItem(TESTING_PLANNER_FORM_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }
  }, [
    authUser,
    profileStorageKey,
    form,
    selectedCompulsoryElective,
    selectedOptionalSubjects,
    subjectsLocked,
    subjectPerformanceLevels,
    isManualDmcEnabled,
    manualDmcScores,
    completedDays,
    dayStatuses,
    timerSessions,
    socialTimerSessions,
    socialDailyLimitMinutes,
    timerStatus,
    timerAccumulatedSeconds,
    timerStartedAtMs,
    socialTimerStatus,
    socialTimerAccumulatedSeconds,
    socialTimerStartedAtMs,
  ])

  useEffect(() => {
    if (timerStatus !== 'running' || !timerStartedAtMs) {
      setElapsedSeconds(Math.max(0, Math.floor(timerAccumulatedSeconds)))
      return undefined
    }
    const syncElapsed = () => {
      setElapsedSeconds(resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs))
    }
    syncElapsed()
    const timerId = window.setInterval(syncElapsed, 1000)
    window.addEventListener('visibilitychange', syncElapsed)
    window.addEventListener('focus', syncElapsed)
    return () => {
      window.clearInterval(timerId)
      window.removeEventListener('visibilitychange', syncElapsed)
      window.removeEventListener('focus', syncElapsed)
    }
  }, [timerStatus, timerAccumulatedSeconds, timerStartedAtMs])

  useEffect(() => {
    if (socialTimerStatus !== 'running' || !socialTimerStartedAtMs) {
      setSocialElapsedSeconds(Math.max(0, Math.floor(socialTimerAccumulatedSeconds)))
      return undefined
    }
    const syncElapsed = () => {
      setSocialElapsedSeconds(
        resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs),
      )
    }
    syncElapsed()
    const timerId = window.setInterval(syncElapsed, 1000)
    window.addEventListener('visibilitychange', syncElapsed)
    window.addEventListener('focus', syncElapsed)
    return () => {
      window.clearInterval(timerId)
      window.removeEventListener('visibilitychange', syncElapsed)
      window.removeEventListener('focus', syncElapsed)
    }
  }, [socialTimerStatus, socialTimerAccumulatedSeconds, socialTimerStartedAtMs])

  useEffect(
    () => () => {
      if (outlinePdfUrl) URL.revokeObjectURL(outlinePdfUrl)
      if (weeklyReportPdfUrl) URL.revokeObjectURL(weeklyReportPdfUrl)
    },
    [outlinePdfUrl, weeklyReportPdfUrl],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleProductiveHourToggle = (slotId) => {
    setForm((current) => {
      const exists = current.productiveHours.includes(slotId)
      const nextHours = exists
        ? current.productiveHours.filter((id) => id !== slotId)
        : [...current.productiveHours, slotId]
      return { ...current, productiveHours: nextHours.sort() }
    })
  }

  const calculateOptionalTotals = (subjects) => {
    const totalMarks = subjects.reduce((sum, subject) => sum + (OPTIONAL_META_MAP[subject]?.marks || 0), 0)
    const totalPapers = subjects.reduce((sum, subject) => {
      const marks = OPTIONAL_META_MAP[subject]?.marks || 100
      return sum + (marks === 200 ? 2 : 1)
    }, 0)
    return { totalMarks, totalPapers }
  }
  const validateGroupIIRule = (subjects) => {
    const groupII = subjects.filter((item) => OPTIONAL_META_MAP[item]?.group === 'Group II')
    if (groupII.length === 0) return { ok: true }
    const count200 = groupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 200).length
    const count100 = groupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 100).length
    const isValidSingle200 = count200 === 1 && groupII.length === 1
    const isValidDouble100 = count200 === 0 && count100 === 2 && groupII.length === 2
    if (isValidSingle200 || isValidDouble100) return { ok: true }
    return {
      ok: false,
      message:
        'Group II rule: select either one 200 marks subject (Physics/Chemistry) or two 100 marks subjects.',
    }
  }

  const canSelectSubject = (subject, currentSubjects) => {
    const meta = OPTIONAL_META_MAP[subject]
    if (!meta) return { ok: false, message: 'Invalid optional subject.' }
    if (currentSubjects.includes(subject)) return { ok: false, message: 'Subject already selected.' }

    const currentGroupII = currentSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === 'Group II')
    const currentGroupII200 = currentGroupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 200).length
    const currentGroupII100 = currentGroupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 100).length
    if (meta.group !== 'Group II' && currentGroupII200 === 0 && currentGroupII100 === 1) {
      return {
        ok: false,
        reason: 'group2-incomplete-block',
        message:
          'First complete Group II subjects of 200 marks, or remove subjects from Group II to proceed.',
      }
    }

    const inSameGroup = currentSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === meta.group)
    if (meta.group === 'Group II') {
      const has200 = inSameGroup.some((item) => OPTIONAL_META_MAP[item]?.marks === 200)
      if (meta.marks === 200 && inSameGroup.length > 0) {
        return { ok: false, message: 'Group II: 200 marks subject cannot be combined with other Group II subjects.' }
      }
      if (meta.marks === 100 && has200) {
        return { ok: false, message: 'Group II already has a 200 marks subject.' }
      }
      if (meta.marks === 100 && inSameGroup.length >= 2) {
        return { ok: false, message: 'Group II allows max two 100 marks subjects.' }
      }
    } else if (inSameGroup.length >= 1) {
      return { ok: false, message: `${meta.group} allows only one subject.` }
    }

    const candidate = [...currentSubjects, subject]
    const { totalMarks, totalPapers } = calculateOptionalTotals(candidate)
    if (totalMarks > 600) return { ok: false, message: 'Optional selection exceeds 600 marks.' }
    if (totalPapers > 6) return { ok: false, message: 'Optional selection exceeds 6 papers.' }
    return { ok: true }
  }

  const handleAddOptionalSubject = (subject) => {
    if (subjectsLocked) return
    setSelectedOptionalSubjects((current) => {
      const currentTotals = calculateOptionalTotals(current)
      if (
        !current.includes(subject) &&
        (currentTotals.totalMarks >= 600 || currentTotals.totalPapers >= 6)
      ) {
        setError('Optional selection is full (600 marks / 6 papers). Remove one subject to add another.')
        return current
      }
      const validation = canSelectSubject(subject, current)
      if (!validation.ok) {
        if (validation.reason === 'group2-incomplete-block') {
          setSubjectLockerModalMessage(validation.message)
          setError('')
          return current
        }
        setError(validation.message)
        return current
      }
      setSubjectLockerModalMessage('')
      setError('')
      return [...current, subject]
    })
  }

  const handleOptionalDrop = (groupName, event) => {
    event.preventDefault()
    if (subjectsLocked) return
    const subject = event.dataTransfer.getData('text/plain') || draggingSubject
    if (!subject) return
    const meta = OPTIONAL_META_MAP[subject]
    if (!meta || meta.group !== groupName) {
      setError('Drop each subject in its own syllabus group box.')
      return
    }
    handleAddOptionalSubject(subject)
    setDraggingSubject('')
  }

  const handleOptionalSubjectRemove = (subject) => {
    if (subjectsLocked) return
    setSelectedOptionalSubjects((current) => current.filter((item) => item !== subject))
    setSubjectLockerModalMessage('')
    setError('')
  }

  const handleLockSubjects = () => {
    if (!selectedCompulsoryElective) {
      setError('Select one compulsory option (Islamiat or Comparative Study of Major Religions).')
      return
    }
    const groupIIValidation = validateGroupIIRule(selectedOptionalSubjects)
    if (!groupIIValidation.ok) {
      setError(groupIIValidation.message)
      return
    }
    const { totalMarks, totalPapers } = calculateOptionalTotals(selectedOptionalSubjects)
    if (totalMarks !== 600 || totalPapers !== 6) {
      setError('Lock requires exactly 600 optional marks and 6 papers.')
      return
    }
    setError('')
    setSubjectsLocked(true)
  }

  const handleUnlockSubjects = () => {
    setSubjectsLocked(false)
  }

  const handleGenerateCourseOutlinePdf = async () => {
    if (!subjectsLocked) {
      setError('Lock subjects first, then generate your finalized course-outline PDF.')
      return
    }

    const compulsoryFinal = [...PLANNER_CORE_COMPULSORY_SUBJECTS, selectedCompulsoryElective].map((title) => ({
      kind: 'Compulsory',
      displayTitle: stripHundredMarks(title),
      sourceTitle: title,
    }))
    const optionalFinal = selectedOptionalPapers.map((item) => ({
      kind: 'Optional',
      displayTitle: stripHundredMarks(item.paper),
      sourceTitle: item.sourceSubject,
      group: item.group,
    }))
    const finalizedSubjects = [...compulsoryFinal, ...optionalFinal]

    if (finalizedSubjects.length !== 12) {
      setError('Finalized selection must contain exactly 12 subjects/papers before PDF generation.')
      return
    }

    setError('')
    setIsGeneratingOutlinePdf(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 42
      const maxTextWidth = pageWidth - marginX * 2
      const pageBottom = pageHeight - 48
      const contentStartY = 48
      let y = contentStartY

      let watermarkDataUrl = ''
      try {
        const watermarkResponse = await fetch(WATERMARK_IMAGE_URL)
        if (watermarkResponse.ok) {
          watermarkDataUrl = await fileToDataUrl(await watermarkResponse.blob())
        }
      } catch {
        watermarkDataUrl = ''
      }

      const applyWatermark = () => {
        if (!watermarkDataUrl) return
        const width = pageWidth - 24
        const height = pageHeight * 0.476
        doc.addImage(
          watermarkDataUrl,
          'PNG',
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height,
        )
      }

      const ensureSpace = (neededHeight = 20) => {
        if (y + neededHeight <= pageBottom) return
        doc.addPage()
        applyWatermark()
        y = contentStartY
      }

      const drawWrappedText = (text, options = {}) => {
        const { fontSize = 10.5, lineHeight = 14, indent = 0, fontStyle = 'normal' } = options
        const lines = doc.splitTextToSize(text, maxTextWidth - indent)
        ensureSpace(lines.length * lineHeight + 2)
        doc.setFont('helvetica', fontStyle)
        doc.setFontSize(fontSize)
        lines.forEach((line) => {
          doc.text(line, marginX + indent, y)
          y += lineHeight
        })
      }

      // Cover page
      applyWatermark()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(34)
      doc.text('Guardian Angel', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' })
      doc.setFontSize(28)
      doc.text('Finalized CSS Course Outline', pageWidth / 2, pageHeight / 2 + 12, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Candidate: ${authUser.fullName || authUser.username}`, pageWidth / 2, pageHeight - 34, {
        align: 'center',
      })

      // Table of contents placeholder page
      doc.addPage()
      applyWatermark()
      const tocPage = doc.getNumberOfPages()

      // Subject content pages
      const tocEntries = []
      for (let index = 0; index < finalizedSubjects.length; index += 1) {
        const subject = finalizedSubjects[index]
        const source = detailedSubjectPages.find((item) => item.title === subject.sourceTitle)
        const subjectPage = doc.getNumberOfPages() + 1
        tocEntries.push({
          title: subject.displayTitle,
          page: subjectPage,
        })

        doc.addPage()
        applyWatermark()
        y = contentStartY

        drawWrappedText(`${index + 1}. ${subject.displayTitle}`, {
          fontSize: 16,
          lineHeight: 20,
          fontStyle: 'bold',
        })
        y += 6

        if (source?.outlineSections?.length) {
          source.outlineSections.forEach((section) => {
            drawWrappedText(section.heading, { fontSize: 12.8, lineHeight: 17, fontStyle: 'bold' })
            if (section.points?.length) {
              section.points.forEach((point) =>
                drawWrappedText(`- ${point}`, {
                  fontSize: 11.2,
                  lineHeight: 15,
                  indent: 8,
                }),
              )
            }
            y += 4
          })
        } else if (source?.outline?.length) {
          drawWrappedText('Course Outline', { fontSize: 12.8, lineHeight: 17, fontStyle: 'bold' })
          source.outline.forEach((point) =>
            drawWrappedText(`- ${point}`, {
              fontSize: 11.2,
              lineHeight: 15,
              indent: 8,
            }),
          )
        } else if (LOCAL_OUTLINE_IMAGE_URLS[source?.sourceSlug]?.length || source?.outlineImages?.length) {
          const imageList =
            LOCAL_OUTLINE_IMAGE_URLS[source?.sourceSlug] || source.outlineImages || []
          for (const imagePath of imageList) {
            const imageCandidates = /^https?:\/\//i.test(imagePath)
              ? [imagePath]
              : resolveOutlineImageCandidates(source.sourceUrl, imagePath)
            let imageAdded = false
            for (const imageUrl of imageCandidates) {
              try {
                const imageDataUrl = await imageUrlToPngDataUrl(imageUrl)
                const imageProps = doc.getImageProperties(imageDataUrl)
                if (pageBottom - y < 220) {
                  doc.addPage()
                  applyWatermark()
                  y = contentStartY
                  drawWrappedText(`${index + 1}. ${subject.displayTitle}`, {
                    fontSize: 16,
                    lineHeight: 20,
                    fontStyle: 'bold',
                  })
                  y += 6
                }

                const maxImageHeight = Math.min(pageHeight * 0.78, pageBottom - y - 8)
                const aspect = imageProps.height / imageProps.width
                let drawWidth = maxTextWidth
                let drawHeight = drawWidth * aspect
                if (drawHeight > maxImageHeight) {
                  drawHeight = maxImageHeight
                  drawWidth = drawHeight / aspect
                }
                ensureSpace(drawHeight + 12)
                const centeredX = marginX + (maxTextWidth - drawWidth) / 2
                doc.addImage(imageDataUrl, 'PNG', centeredX, y, drawWidth, drawHeight)
                y += drawHeight + 10
                imageAdded = true
                break
              } catch {
                // Try next candidate URL.
              }
            }
            if (!imageAdded) {
              drawWrappedText(`- Outline image could not be loaded from available sources.`, {
                fontSize: 9.6,
                lineHeight: 13,
                indent: 8,
              })
            }
          }
        } else {
          drawWrappedText('Detailed outline is currently unavailable for this subject.', {
            fontSize: 10,
            lineHeight: 14,
            indent: 8,
          })
        }

        y += 10
        ensureSpace(18)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('*****************************************************', pageWidth / 2, y, {
          align: 'center',
        })
        y += 16
      }

      // Fill table of contents
      doc.setPage(tocPage)
      y = 56
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.text('Table of Contents', pageWidth / 2, y, { align: 'center' })
      y += 56
      const tocSubjectFontSize = 16
      const tocPageNumberFontSize = 14
      const tocLineHeight = 22
      const tocRowGap = 14 // approx one line break between entries
      tocEntries.forEach((entry, index) => {
        const subjectLabel = `${index + 1}. ${entry.title}`
        const pageLabel = `Page ${entry.page}`
        const pageLabelWidth = doc.getTextWidth(pageLabel)
        const maxSubjectWidth = maxTextWidth - pageLabelWidth - 20
        const subjectLines = doc.splitTextToSize(subjectLabel, maxSubjectWidth)

        ensureSpace(subjectLines.length * tocLineHeight + tocRowGap)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(tocSubjectFontSize)
        subjectLines.forEach((line, lineIndex) => {
          doc.text(line, marginX, y)
          if (lineIndex === 0) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(tocPageNumberFontSize)
            doc.text(pageLabel, pageWidth - marginX, y, { align: 'right' })
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(tocSubjectFontSize)
          }
          y += tocLineHeight
        })
        y += tocRowGap
      })

      // Footer page numbers
      const totalPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - marginX,
          pageHeight - 18,
          { align: 'right' },
        )
      }

      const blob = doc.output('blob')
      const nextPdfUrl = URL.createObjectURL(blob)
      setOutlinePdfUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPdfUrl
      })

      const stamp = new Date()
      const fileStamp = `${stamp.getFullYear()}-${`${stamp.getMonth() + 1}`.padStart(2, '0')}-${`${stamp.getDate()}`.padStart(2, '0')}`
      setOutlinePdfFileName(`Guardian_Angel_Finalized_CSS_Outline_${fileStamp}.pdf`)
    } catch {
      setError('Unable to generate course-outline PDF. Please try again.')
    } finally {
      setIsGeneratingOutlinePdf(false)
    }
  }

  const handleGeneratePlan = (event) => {
    event.preventDefault()
    setError('')

    const examDate = new Date(`${form.examDate}T23:59:59`)
    const today = startOfDay(new Date())
    const remainingDays = Math.ceil((examDate - today) / MS_PER_DAY)
    const studyHours = Number(form.studyHours)

    if (!form.examDate || Number.isNaN(examDate.getTime())) {
      setError('Please provide a valid CSS exam date.')
      return
    }
    if (remainingDays <= 0) {
      setError('Exam date should be in the future so the planner can generate a timeline.')
      return
    }
    if (!Number.isFinite(studyHours) || studyHours < 2 || studyHours > 14) {
      setError('Please enter realistic study hours between 2 and 14.')
      return
    }
    if (!Array.isArray(form.productiveHours) || form.productiveHours.length === 0) {
      setError('Select at least one productive one-hour slot.')
      return
    }

    const stageShareMap = {
      beginner: { lecture: 0.44, selfStudy: 0.36, revision: 0.2 },
      revision: { lecture: 0.2, selfStudy: 0.35, revision: 0.45 },
      'mock-exams': { lecture: 0.12, selfStudy: 0.28, revision: 0.6 },
    }
    const stageShares = stageShareMap[form.stage] || stageShareMap.beginner
    let lectureShare = stageShares.lecture
    let selfStudyShare = stageShares.selfStudy
    let revisionShare = stageShares.revision

    if (form.learningPreference === 'lectures-first') {
      lectureShare += 0.06
      selfStudyShare -= 0.03
      revisionShare -= 0.03
    } else {
      lectureShare -= 0.03
      selfStudyShare += 0.04
      revisionShare -= 0.01
    }

    if (form.difficulty === 'easy') {
      lectureShare += 0.03
      revisionShare -= 0.03
    } else if (form.difficulty === 'extremely difficult') {
      lectureShare -= 0.03
      revisionShare += 0.05
      selfStudyShare -= 0.02
    }

    lectureShare = Math.max(0.15, lectureShare)
    selfStudyShare = Math.max(0.25, selfStudyShare)
    revisionShare = Math.max(0.2, revisionShare)
    const normalizedTotal = lectureShare + selfStudyShare + revisionShare
    lectureShare /= normalizedTotal
    selfStudyShare /= normalizedTotal
    revisionShare /= normalizedTotal

    const attemptFactorMap = { first: 1, second: 1.07, third: 1.12 }
    const difficultyFactorMap = { easy: 0.92, moderate: 1, difficult: 1.09, 'extremely difficult': 1.16 }
    const urgencyFactor = remainingDays > 150 ? 0.95 : remainingDays > 90 ? 1 : remainingDays > 45 ? 1.08 : 1.16
    const attemptFactor = attemptFactorMap[form.cssAttempt] || 1
    const difficultyFactor = difficultyFactorMap[form.difficulty] || 1
    const productivityFactor = Math.min(1.16, 0.9 + form.productiveHours.length * 0.02)
    const effectiveStudyHours = Math.min(
      14,
      Number((studyHours * urgencyFactor * attemptFactor * difficultyFactor * productivityFactor).toFixed(2)),
    )

    const lectureHours = Number((effectiveStudyHours * lectureShare).toFixed(1))
    const selfStudyHours = Number((effectiveStudyHours * selfStudyShare).toFixed(1))
    const revisionHours = Number((effectiveStudyHours - lectureHours - selfStudyHours).toFixed(1))

    const selectedSlots = PRODUCTIVE_HOUR_OPTIONS.filter((slot) =>
      form.productiveHours.includes(slot.id),
    ).sort((a, b) => a.startHour - b.startHour)
    let cursor = (selectedSlots[0]?.startHour || 7) * 60
    const sessionBlocks = [
      {
        title: 'Lecture Session',
        durationMinutes: Math.round(lectureHours * 60),
        focus: 'Watch lectures and make short concept notes.',
      },
      {
        title: 'Self-Study Session',
        durationMinutes: Math.round(selfStudyHours * 60),
        focus: 'Read syllabus topics, solve questions, and build recall.',
      },
      {
        title: 'Revision Session',
        durationMinutes: Math.round(Math.max(45, revisionHours * 60)),
        focus: 'Revise key notes and practice answer structuring.',
      },
    ]

    const timetable = sessionBlocks.map((block, index) => {
      const start = cursor
      const end = cursor + block.durationMinutes
      cursor = end
      if (index < sessionBlocks.length - 1) cursor += 15
      return {
        ...block,
        timeRange: `${formatClock(start)} - ${formatClock(end)}`,
      }
    })

    const weeklyConsolidation = []
    for (let dayOffset = 6; dayOffset < remainingDays; dayOffset += 7) {
      weeklyConsolidation.push(formatDayKey(addDays(today, dayOffset)))
    }

    const phaseStrategy =
      remainingDays > 120
        ? [
            'Phase 1 (Foundation): 45% of timeline for concept clarity and lectures.',
            'Phase 2 (Coverage): 35% for topic completion and answer writing.',
            'Phase 3 (Final Revision): 20% for mocks and quick revision cycles.',
          ]
        : remainingDays > 60
          ? [
              'Phase 1 (Acceleration): 55% for focused coverage of core topics.',
              'Phase 2 (Revision + Practice): 45% for test practice and weak-area repair.',
            ]
          : [
              'Phase 1 (High-Intensity Revision): 70% for revision, recall, and past-paper practice.',
              'Phase 2 (Final Polishing): 30% for exam-like timed practice and confidence building.',
            ]

    setPlan({
      examDate,
      remainingDays,
      studyHours,
      effectiveStudyHours,
      lectureHours,
      selfStudyHours,
      revisionHours,
      timetable,
      weeklyConsolidation,
      phaseStrategy,
      selectedSlots: selectedSlots.map((slot) => slot.label),
      formula: {
        expression:
          'effectiveHours = baseHours x urgencyFactor x attemptFactor x difficultyFactor x productivityFactor',
        values: {
          baseHours: studyHours,
          urgencyFactor,
          attemptFactor,
          difficultyFactor,
          productivityFactor,
        },
      },
      breakPlan: [
        'Take a 10-minute break after every 50 minutes of deep study.',
        'After every 3 focused blocks, take a 25-30 minute recovery break.',
        'Sleep target: at least 7 hours daily to protect retention and consistency.',
      ],
    })
  }

  const handleGenerateWeeklyReportPdf = () => {
    setIsGeneratingWeeklyReportPdf(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 42
      const maxWidth = pageWidth - marginX * 2
      const pageBottom = pageHeight - 42
      let y = 56

      const ensureSpace = (needed = 20) => {
        if (y + needed <= pageBottom) return
        doc.addPage()
        y = 52
      }
      const drawText = (text, options = {}) => {
        const { size = 11, lineHeight = 15, style = 'normal', bullet = false } = options
        const prefix = bullet ? '- ' : ''
        const lines = doc.splitTextToSize(`${prefix}${text}`, maxWidth)
        ensureSpace(lines.length * lineHeight + 4)
        doc.setFont('helvetica', style)
        doc.setFontSize(size)
        lines.forEach((line) => {
          doc.text(line, marginX, y)
          y += lineHeight
        })
      }
      const drawSection = (title) => {
        ensureSpace(26)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(title, marginX, y)
        y += 18
      }

      const stamp = new Date()
      const dateLabel = stamp.toLocaleDateString('en-GB')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.text('Guardian Angel Weekly Report Card', marginX, y)
      y += 24
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Candidate: ${authUser.fullName || authUser.username}`, marginX, y)
      y += 16
      doc.text(`Generated on: ${dateLabel}`, marginX, y)
      y += 20

      drawSection('Overall Performance Snapshot')
      drawText(`Overall readiness: ${guardianOverallScore}/100 (${guardianOverallStatus})`, { style: 'bold' })
      drawText(
        `Weekly completion: ${weeklyProgressPercent.toFixed(0)}% | Social overuse today: ${socialOveruseMinutes} min | Current streak: ${currentStudyStreak} day(s).`,
      )
      y += 8

      drawSection('Progress Metrics')
      guardianReportRows.forEach((row) => {
        drawText(`${row.label}: ${row.score}%`, { style: 'bold' })
        drawText(row.note)
      })

      drawSection('Current Risks')
      const risks =
        guardianRiskSignals.length > 0
          ? guardianRiskSignals
          : ['No major risk cluster detected currently. Maintain current consistency.']
      risks.forEach((risk) => drawText(risk, { bullet: true }))

      drawSection('Focus Recovery Protocol')
      if (focusRecoveryProtocol) {
        drawText(
          `Backlog: ${focusRecoveryProtocol.backlogMinutes} min | Safe cap: ${focusRecoveryProtocol.maxExtraPerDay} min/day`,
        )
        focusRecoveryProtocol.recoveryDays.forEach((day) => {
          drawText(`${day.dayLabel}: +${day.extraMinutes} min (target ${day.totalTarget} min)`, {
            bullet: true,
          })
        })
      } else {
        drawText('No catch-up needed this week. Keep current execution momentum.')
      }

      drawSection('Next-Week Targets')
      nextWeekTargets.forEach((target) => drawText(target, { bullet: true }))

      const totalPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 18, {
          align: 'right',
        })
      }

      const blob = doc.output('blob')
      const nextPdfUrl = URL.createObjectURL(blob)
      setWeeklyReportPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPdfUrl
      })
      const fileStamp = `${stamp.getFullYear()}-${`${stamp.getMonth() + 1}`.padStart(2, '0')}-${`${stamp.getDate()}`.padStart(2, '0')}`
      setWeeklyReportPdfFileName(`Guardian_Angel_Weekly_Report_Card_${fileStamp}.pdf`)
    } catch {
      setError('Unable to generate weekly report PDF. Please try again.')
    } finally {
      setIsGeneratingWeeklyReportPdf(false)
    }
  }

  const handleTimerStart = () => {
    if (timerStatus === 'running') return
    if (timerStatus === 'idle') {
      setTimerAccumulatedSeconds(0)
      setElapsedSeconds(0)
    }
    setTimerStartedAtMs(Date.now())
    setTimerStatus('running')
  }

  const handleTimerPause = () => {
    if (timerStatus !== 'running' || !timerStartedAtMs) return
    const nextElapsedSeconds = resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs)
    setTimerAccumulatedSeconds(nextElapsedSeconds)
    setElapsedSeconds(nextElapsedSeconds)
    setTimerStartedAtMs(null)
    setTimerStatus('paused')
  }

  const handleTimerStop = () => {
    const finalElapsedSeconds =
      timerStatus === 'running' && timerStartedAtMs
        ? resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs)
        : elapsedSeconds
    if (finalElapsedSeconds > 0) {
      const completedAt = new Date()
      const dayKey = formatDayKey(completedAt)
      setTimerSessions((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          completedAt: completedAt.toISOString(),
          dayKey,
          durationSeconds: finalElapsedSeconds,
        },
      ])
      setCompletedDays((current) => ({ ...current, [dayKey]: true }))
    }
    setElapsedSeconds(0)
    setTimerAccumulatedSeconds(0)
    setTimerStartedAtMs(null)
    setTimerStatus('idle')
  }

  const handleTimerReset = () => {
    setElapsedSeconds(0)
    setTimerAccumulatedSeconds(0)
    setTimerStartedAtMs(null)
    setTimerStatus('idle')
  }

  const handleSocialTimerStart = () => {
    if (socialTimerStatus === 'running') return
    if (socialTimerStatus === 'idle') {
      setSocialTimerAccumulatedSeconds(0)
      setSocialElapsedSeconds(0)
    }
    setSocialTimerStartedAtMs(Date.now())
    setSocialTimerStatus('running')
  }

  const handleSocialTimerPause = () => {
    if (socialTimerStatus !== 'running' || !socialTimerStartedAtMs) return
    const nextElapsedSeconds = resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs)
    setSocialTimerAccumulatedSeconds(nextElapsedSeconds)
    setSocialElapsedSeconds(nextElapsedSeconds)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('paused')
  }

  const handleSocialTimerStop = () => {
    const finalElapsedSeconds =
      socialTimerStatus === 'running' && socialTimerStartedAtMs
        ? resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs)
        : socialElapsedSeconds
    if (finalElapsedSeconds > 0) {
      const completedAt = new Date()
      const dayKey = formatDayKey(completedAt)
      setSocialTimerSessions((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          completedAt: completedAt.toISOString(),
          dayKey,
          durationSeconds: finalElapsedSeconds,
        },
      ])
    }
    setSocialElapsedSeconds(0)
    setSocialTimerAccumulatedSeconds(0)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('idle')
  }

  const handleSocialTimerReset = () => {
    setSocialElapsedSeconds(0)
    setSocialTimerAccumulatedSeconds(0)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('idle')
  }

  const handleSocialLimitChange = (event) => {
    const numericValue = Number(event.target.value)
    if (!Number.isFinite(numericValue)) return
    setSocialDailyLimitMinutes(Math.max(10, Math.min(360, Math.round(numericValue))))
  }

  const handleCalendarStatusChange = (dayKey, statusId) => {
    if (!dayKey) return
    setDayStatuses((current) => ({ ...current, [dayKey]: statusId }))
    if (statusId === 'completed') setCompletedDays((current) => ({ ...current, [dayKey]: true }))
    if (statusId !== 'completed') {
      setCompletedDays((current) => {
        if (!current[dayKey]) return current
        const next = { ...current }
        delete next[dayKey]
        return next
      })
    }
  }

  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const firstWeekday = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  ).getDay()
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const examDayKey = plan ? formatDayKey(plan.examDate) : null
  const consolidationSet = new Set(plan?.weeklyConsolidation ?? [])
  const todayKey = formatDayKey(new Date())
  const currentSessionMinutes = Math.floor(elapsedSeconds / 60)
  const todaySessionMinutes = timerSessions
    .filter((item) => item.dayKey === todayKey)
    .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
  const studiedTodayMinutes = todaySessionMinutes + currentSessionMinutes
  const requiredDailyMinutes = plan ? Math.round(plan.studyHours * 60) : 0
  const remainingTodayMinutes = Math.max(requiredDailyMinutes - studiedTodayMinutes, 0)
  const dailyProgressPercent =
    requiredDailyMinutes > 0 ? Math.min(100, (studiedTodayMinutes / requiredDailyMinutes) * 100) : 0
  const currentSocialSessionMinutes = Math.floor(socialElapsedSeconds / 60)
  const todaySocialLoggedMinutes = socialTimerSessions
    .filter((item) => item.dayKey === todayKey)
    .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
  const socialUsedTodayMinutes = todaySocialLoggedMinutes + currentSocialSessionMinutes
  const socialOveruseMinutes = Math.max(socialUsedTodayMinutes - socialDailyLimitMinutes, 0)
  const socialDailyUsagePercent = Math.min(
    200,
    (socialUsedTodayMinutes / Math.max(1, socialDailyLimitMinutes)) * 100,
  )
  const socialPerformancePenaltyFactor =
    socialOveruseMinutes === 0
      ? 1
      : Math.max(
          0.7,
          1 -
            Math.min(
              0.3,
              (socialOveruseMinutes / Math.max(1, socialDailyLimitMinutes)) * 0.35,
            ),
        )
  const socialDisciplineScore = clampToPercent(
    100 -
      (socialOveruseMinutes / Math.max(1, socialDailyLimitMinutes)) * 65 -
      Math.max(0, socialUsedTodayMinutes - socialDailyLimitMinutes * 0.7) * 0.15,
  )

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(new Date()), index - 6))
  const weeklyProgress = weekDays.map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = timerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSessionMinutes : 0
    const studiedMinutes = minutesFromLogs + todayExtra
    return {
      dayKey,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      studiedMinutes,
      requiredMinutes: requiredDailyMinutes,
      ratio: requiredDailyMinutes > 0 ? Math.min(100, (studiedMinutes / requiredDailyMinutes) * 100) : 0,
    }
  })
  const totalWeekStudiedMinutes = weeklyProgress.reduce((sum, item) => sum + item.studiedMinutes, 0)
  const totalWeekRequiredMinutes = requiredDailyMinutes * 7
  const weeklyProgressPercent =
    totalWeekRequiredMinutes > 0
      ? Math.min(100, (totalWeekStudiedMinutes / totalWeekRequiredMinutes) * 100)
      : 0
  const weeklyDeficitMinutes = Math.max(totalWeekRequiredMinutes - totalWeekStudiedMinutes, 0)
  const missedDailyTarget =
    requiredDailyMinutes > 0 &&
    remainingTodayMinutes >= Math.max(20, Math.round(requiredDailyMinutes * 0.2))
  const missedWeeklyTarget = requiredDailyMinutes > 0 && weeklyProgressPercent < 75
  const shouldShowRecoveryProtocol = Boolean(plan) && (missedDailyTarget || missedWeeklyTarget)
  const focusRecoveryProtocol = (() => {
    if (!shouldShowRecoveryProtocol || !plan) return null
    const weightedBacklogMinutes = Math.round(remainingTodayMinutes + weeklyDeficitMinutes * 0.35)
    const backlogMinutes = Math.max(30, weightedBacklogMinutes)
    const maxExtraPerDay = Math.min(90, Math.max(30, Math.round(requiredDailyMinutes * 0.35)))
    let remaining = backlogMinutes
    const dailyExtras = [0, 0, 0].map((_, index) => {
      const daysLeft = 3 - index
      const allocation = Math.min(maxExtraPerDay, Math.max(20, Math.ceil(remaining / daysLeft)))
      remaining = Math.max(0, remaining - allocation)
      return allocation
    })
    const totalRecovered = dailyExtras.reduce((sum, minutes) => sum + minutes, 0)
    const unresolvedMinutes = Math.max(0, backlogMinutes - totalRecovered)
    const recoveryDays = dailyExtras.map((extraMinutes, index) => {
      const dayDate = addDays(startOfDay(new Date()), index + 1)
      const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'long' })
      const totalTarget = requiredDailyMinutes + extraMinutes
      return {
        id: `${dayLabel}-${index}`,
        dayLabel,
        extraMinutes,
        totalTarget,
        protocol: [
          `Add ${extraMinutes} focused recovery minutes.`,
          'Use 2 deep-work blocks (50 min each) with 10-minute breaks.',
          'Close the day with 20 minutes of revision recap and error log.',
        ],
      }
    })
    return {
      backlogMinutes,
      maxExtraPerDay,
      totalRecovered,
      unresolvedMinutes,
      recoveryDays,
    }
  })()
  const socialWeeklyUsage = weekDays.map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = socialTimerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSocialSessionMinutes : 0
    return {
      dayKey,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      socialMinutes: minutesFromLogs + todayExtra,
    }
  })
  const socialWeeklyAverageMinutes =
    socialWeeklyUsage.reduce((sum, item) => sum + item.socialMinutes, 0) / Math.max(1, socialWeeklyUsage.length)
  const studyConsistencyThresholdMinutes =
    requiredDailyMinutes > 0 ? Math.max(30, Math.round(requiredDailyMinutes * 0.6)) : 60
  const rollingStudyDays = Array.from({ length: 30 }, (_, index) =>
    addDays(startOfDay(new Date()), -(29 - index)),
  ).map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = timerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSessionMinutes : 0
    return {
      dayKey,
      studiedMinutes: minutesFromLogs + todayExtra,
    }
  })
  const currentStudyStreak = (() => {
    let streak = 0
    for (let index = rollingStudyDays.length - 1; index >= 0; index -= 1) {
      if (rollingStudyDays[index].studiedMinutes >= studyConsistencyThresholdMinutes) streak += 1
      else break
    }
    return streak
  })()
  const longestStudyStreak = (() => {
    let longest = 0
    let current = 0
    rollingStudyDays.forEach((day) => {
      if (day.studiedMinutes >= studyConsistencyThresholdMinutes) {
        current += 1
        longest = Math.max(longest, current)
      } else {
        current = 0
      }
    })
    return longest
  })()
  const recent14StudyDays = rollingStudyDays.slice(-14)
  const recent14HitDays = recent14StudyDays.filter(
    (item) => item.studiedMinutes >= studyConsistencyThresholdMinutes,
  ).length
  const studyConsistencyPercent14 = clampToPercent((recent14HitDays / Math.max(1, recent14StudyDays.length)) * 100)
  const revisionDaysCount = Object.values(dayStatuses).filter((status) => status === 'revision').length
  const mockTestDaysCount = Object.values(dayStatuses).filter((status) => status === 'mock-test').length
  const socialWithinLimitDays7 = socialWeeklyUsage.filter(
    (item) => item.socialMinutes <= socialDailyLimitMinutes,
  ).length
  const gamificationBadges = [
    {
      id: 'first-session',
      title: 'First Focus Session',
      description: 'Complete your first tracked study session.',
      unlocked: timerSessions.length > 0 || elapsedSeconds > 0,
      progress: Math.min(100, ((timerSessions.length > 0 ? 1 : 0) / 1) * 100),
    },
    {
      id: 'streak-3',
      title: 'Consistency Starter',
      description: `Maintain a ${studyConsistencyThresholdMinutes}+ min streak for 3 days.`,
      unlocked: currentStudyStreak >= 3,
      progress: Math.min(100, (currentStudyStreak / 3) * 100),
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: `Maintain a ${studyConsistencyThresholdMinutes}+ min streak for 7 days.`,
      unlocked: currentStudyStreak >= 7,
      progress: Math.min(100, (currentStudyStreak / 7) * 100),
    },
    {
      id: 'consistency-14',
      title: 'Rhythm Keeper',
      description: 'Hit study target on at least 10 of last 14 days.',
      unlocked: recent14HitDays >= 10,
      progress: Math.min(100, (recent14HitDays / 10) * 100),
    },
    {
      id: 'revision-7',
      title: 'Revision Milestone',
      description: 'Mark 7 revision-focused days in Guardian Calendar.',
      unlocked: revisionDaysCount >= 7,
      progress: Math.min(100, (revisionDaysCount / 7) * 100),
    },
    {
      id: 'mock-3',
      title: 'Mock Momentum',
      description: 'Complete 3 mock-test days.',
      unlocked: mockTestDaysCount >= 3,
      progress: Math.min(100, (mockTestDaysCount / 3) * 100),
    },
    {
      id: 'social-discipline',
      title: 'Digital Discipline',
      description: 'Stay within social limit for all last 7 days.',
      unlocked: socialWithinLimitDays7 >= 7,
      progress: Math.min(100, (socialWithinLimitDays7 / 7) * 100),
    },
  ]
  const unlockedBadgeCount = gamificationBadges.filter((badge) => badge.unlocked).length
  const nextBadgeTarget = gamificationBadges.find((badge) => !badge.unlocked) || null
  const selectedStatus = selectedCalendarDay ? dayStatuses[selectedCalendarDay] || 'planned' : 'planned'
  const selectedOptionalByGroup = optionalGroups
    .map((group) => ({
      group: group.group,
      subjects: selectedOptionalSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === group.group),
    }))
    .filter((entry) => entry.subjects.length > 0)
  const selectedOptionalSorted = optionalGroups.flatMap((group) =>
    selectedOptionalSubjects.filter((subject) => OPTIONAL_META_MAP[subject]?.group === group.group),
  )
  const selectedOptionalPapers = selectedOptionalByGroup.flatMap((entry) =>
    entry.subjects.flatMap((subject) => {
      const meta = OPTIONAL_META_MAP[subject]
      if (!meta) return []
      if (meta.marks === 200) {
        return [
          `${meta.baseTitle} I (100 Marks)`,
          `${meta.baseTitle} II (100 Marks)`,
        ].map((paper) => ({
          group: entry.group,
          groupIndex: meta.groupIndex,
          paper,
          sourceSubject: subject,
        }))
      }
      return [
        {
          group: entry.group,
          groupIndex: meta.groupIndex,
          paper: `${meta.baseTitle} (100 Marks)`,
          sourceSubject: subject,
        },
      ]
    }),
  )
  const { totalMarks: selectedOptionalMarks, totalPapers: selectedOptionalPaperCount } =
    calculateOptionalTotals(selectedOptionalSubjects)
  const isOptionalSelectionFull = selectedOptionalMarks >= 600 || selectedOptionalPaperCount >= 6
  const compulsoryForAnalysis = [...PLANNER_CORE_COMPULSORY_SUBJECTS, selectedCompulsoryElective].map((item) =>
    stripHundredMarks(item),
  )
  const optionalForAnalysis = selectedOptionalPapers.map((item) => stripHundredMarks(item.paper))
  const performanceSubjects = [...new Set([...compulsoryForAnalysis, ...optionalForAnalysis])].filter(Boolean)

  useEffect(() => {
    setSubjectPerformanceLevels((current) => {
      const next = {}
      performanceSubjects.forEach((subject) => {
        const defaultLevel = subject === 'English (Precis & Composition)' ? 'Contendor' : 'Survivor'
        next[subject] = current[subject] || defaultLevel
      })
      const hasChanged =
        Object.keys(next).length !== Object.keys(current).length ||
        Object.keys(next).some((key) => next[key] !== current[key])
      return hasChanged ? next : current
    })
  }, [performanceSubjects])

  const performanceRows = performanceSubjects.map((subject) => ({
    subject,
    level: subjectPerformanceLevels[subject] || 'Survivor',
  }))
  useEffect(() => {
    if (
      selectedPerformanceSubject &&
      !performanceRows.some((item) => item.subject === selectedPerformanceSubject)
    ) {
      setSelectedPerformanceSubject('')
    }
  }, [performanceRows, selectedPerformanceSubject])
  useEffect(() => {
    setManualDmcScores((current) => {
      const next = {}
      performanceRows.forEach((item) => {
        if (Object.prototype.hasOwnProperty.call(current, item.subject)) {
          next[item.subject] = current[item.subject]
        }
      })
      const hasChanged =
        Object.keys(next).length !== Object.keys(current).length ||
        Object.keys(next).some((key) => next[key] !== current[key])
      return hasChanged ? next : current
    })
  }, [performanceRows])

  const strongSubjects = performanceRows.filter((item) => item.level === 'Topper').map((item) => item.subject)
  const competitiveSubjects = performanceRows
    .filter((item) => item.level === 'Contendor')
    .map((item) => item.subject)
  const weakSubjects = performanceRows.filter((item) => item.level === 'Survivor').map((item) => item.subject)

  const overallPerformanceStatus =
    performanceRows.length === 0
      ? 'Start by selecting subjects in Subject Locker to generate analysis.'
      : strongSubjects.length >= Math.ceil(performanceRows.length / 3)
        ? 'Current profile is high ambition heavy. Rebalance effort to protect consistency.'
        : competitiveSubjects.length >= weakSubjects.length
          ? 'Current profile is competitive and progressing in the right direction.'
          : 'Current profile is foundation focused. Push more subjects into competitive range.'

  const performanceAdvice = [
    weakSubjects.length > 0
      ? `Subjects needing focused improvement: ${weakSubjects.join(', ')}.`
      : 'No critical weak bucket currently. Keep consistency to maintain momentum.',
    'Suggested focus: answer writing structure, timed past-paper practice, and weekly revision cycles.',
    'Balanced preparation advice: keep strong subjects stable, convert contendor subjects to confident range, and allocate extra hours to weak bucket every week.',
  ]
  const performanceByLevel = SUBJECT_PERFORMANCE_LEVELS.map((level) => ({
    ...level,
    subjects: performanceRows
      .filter((item) => item.level === level.id)
      .map((item) => item.subject),
  }))
  const compulsorySubjectSet = new Set(compulsoryForAnalysis.filter(Boolean))
  const optionalSubjectSet = new Set(optionalForAnalysis.filter(Boolean))
  const performanceScoreRows = performanceRows.map((item) => ({
    ...item,
    autoScore: PERFORMANCE_LEVEL_SCORE_MAP[item.level] ?? 0,
    section: compulsorySubjectSet.has(item.subject) ? 'Compulsory' : optionalSubjectSet.has(item.subject) ? 'Optionals' : 'Optionals',
  }))
  const scoredPerformanceRows = performanceScoreRows.map((item) => {
    const rawManualScore = Number(manualDmcScores[item.subject])
    const normalizedManualScore = Number.isFinite(rawManualScore)
      ? Math.max(0, Math.min(100, Math.round(rawManualScore)))
      : item.autoScore
    return {
      ...item,
      score: isManualDmcEnabled ? normalizedManualScore : item.autoScore,
    }
  })
  const compulsoryScoreRows = scoredPerformanceRows.filter((item) => item.section === 'Compulsory')
  const optionalScoreRows = scoredPerformanceRows.filter((item) => item.section === 'Optionals')
  const projectedScoreTotal = scoredPerformanceRows.reduce((sum, item) => sum + item.score, 0)
  const projectedMaxTotal = performanceScoreRows.length * 100
  const projectedScoreBand =
    projectedScoreTotal < 600 ? 'low' : projectedScoreTotal <= 670 ? 'mid' : 'high'
  const subjectLockerScore = clampToPercent(
    (selectedOptionalMarks / 600) * 65 +
      (selectedOptionalPaperCount / 6) * 20 +
      (selectedCompulsoryElective ? 5 : 0) +
      (subjectsLocked ? 10 : 0),
  )
  const strategyFormCompletion =
    [
      Boolean(form.examDate),
      Number(form.studyHours) > 0,
      form.productiveHours.length > 0,
      Boolean(form.stage),
      Boolean(form.cssAttempt),
      Boolean(form.difficulty),
      Boolean(form.learningPreference),
    ].filter(Boolean).length / 7
  const strategyScore = plan
    ? clampToPercent(
        strategyFormCompletion * 35 +
          Math.min(25, (plan.effectiveStudyHours / 8) * 25) +
          Math.min(20, plan.selectedSlots.length * 7) +
          (plan.remainingDays > 0 ? 20 : 10),
      )
    : clampToPercent(strategyFormCompletion * 55)
  const topperRatio = performanceRows.length > 0 ? strongSubjects.length / performanceRows.length : 0
  const contendorRatio = performanceRows.length > 0 ? competitiveSubjects.length / performanceRows.length : 0
  const performanceScoreAverage =
    performanceRows.length > 0 ? projectedScoreTotal / Math.max(1, performanceRows.length) : 0
  const basePerformanceScore = clampToPercent(
    performanceScoreAverage * 0.85 + topperRatio * 12 + contendorRatio * 8,
  )
  const performanceScore = clampToPercent(basePerformanceScore * socialPerformancePenaltyFactor)
  const timerTrackedDays = new Set(timerSessions.map((item) => item.dayKey)).size
  const timerConsistencyPercent = clampToPercent((timerTrackedDays / 14) * 100)
  const timerScore = clampToPercent(
    weeklyProgressPercent * 0.5 + dailyProgressPercent * 0.25 + timerConsistencyPercent * 0.25,
  )
  const allStatusValues = Object.values(dayStatuses)
  const calendarTaggedDays = allStatusValues.length
  const calendarCompletedDays = Object.values(dayStatuses).filter((status) => status === 'completed').length
  const calendarRevisionDays = Object.values(dayStatuses).filter((status) => status === 'revision').length
  const calendarMockDays = Object.values(dayStatuses).filter((status) => status === 'mock-test').length
  const calendarSkippedDays = Object.values(dayStatuses).filter((status) => status === 'skipped').length
  const calendarEngagementPercent = clampToPercent((calendarTaggedDays / 20) * 100)
  const calendarExecutionPercent =
    calendarTaggedDays > 0 ? (calendarCompletedDays / calendarTaggedDays) * 100 : 0
  const calendarScore =
    calendarTaggedDays === 0
      ? 0
      : clampToPercent(
          calendarEngagementPercent * 0.45 +
            calendarExecutionPercent * 0.45 +
            (calendarRevisionDays + calendarMockDays) * 1.2 -
            calendarSkippedDays * 1.4,
        )
  const guardianReportRows = [
    {
      key: 'subjects',
      label: 'Subject Locker',
      score: subjectLockerScore,
      note: `${selectedOptionalMarks}/600 optional marks selected, ${selectedOptionalPaperCount}/6 papers, ${subjectsLocked ? 'locked' : 'draft mode'}.`,
    },
    {
      key: 'strategy',
      label: 'Strategy Builder',
      score: strategyScore,
      note: plan
        ? `${plan.remainingDays} days remaining, ${plan.effectiveStudyHours}h effective daily target, ${plan.selectedSlots.length} productive slot(s).`
        : 'Study strategy not generated yet.',
    },
    {
      key: 'performance',
      label: 'Performance Analysis',
      score: performanceScore,
      note:
        performanceRows.length > 0
          ? `Topper: ${strongSubjects.length}, Contendor: ${competitiveSubjects.length}, Survivor: ${weakSubjects.length}.`
          : 'No performance allocation yet.',
    },
    {
      key: 'timer',
      label: 'Timer & Analytics',
      score: timerScore,
      note: `${studiedTodayMinutes} min today, ${weeklyProgressPercent.toFixed(0)}% weekly completion, ${timerTrackedDays} tracked day(s) in recent logs.`,
    },
    {
      key: 'calendar',
      label: 'Guardian Calendar',
      score: calendarScore,
      note: `${calendarTaggedDays} tagged day(s), ${calendarCompletedDays} completed, ${calendarSkippedDays} skipped.`,
    },
    {
      key: 'social',
      label: 'Social Balance',
      score: socialDisciplineScore,
      note:
        socialOveruseMinutes > 0
          ? `${socialUsedTodayMinutes} min social use today (limit ${socialDailyLimitMinutes} min): over by ${socialOveruseMinutes} min.`
          : `${socialUsedTodayMinutes} min social use today within limit (${socialDailyLimitMinutes} min).`,
    },
  ]
  const guardianOverallScore = clampToPercent(
    subjectLockerScore * 0.2 +
      strategyScore * 0.19 +
      performanceScore * 0.21 +
      timerScore * 0.16 +
      calendarScore * 0.12 +
      socialDisciplineScore * 0.12,
  )
  const guardianOverallStatus =
    guardianOverallScore >= 80
      ? 'High Potential - execution quality is strong and competitive.'
      : guardianOverallScore >= 65
        ? 'Promising - good direction, now tighten consistency and output.'
        : guardianOverallScore >= 50
          ? 'Developing - build stronger routine and convert plans into daily evidence.'
          : 'Early Stage - establish fundamentals before accelerating.'
  const guardianStrengthSignals = [
    subjectsLocked ? 'Subject selection is finalized and structurally valid.' : '',
    strongSubjects.length >= 4 ? 'Multiple subjects are already in Topper range.' : '',
    weeklyProgressPercent >= 70 ? 'Weekly timer completion is on a strong trajectory.' : '',
    calendarCompletedDays >= 5 ? 'Calendar execution indicates steady follow-through.' : '',
    socialOveruseMinutes === 0 ? 'Social media is within the daily discipline limit.' : '',
  ].filter(Boolean)
  const guardianRiskSignals = [
    !subjectsLocked ? 'Subject locker is not locked yet. Finalize to prevent frequent switching.' : '',
    !plan ? 'Strategy is not generated yet. Create your timetable to set daily targets.' : '',
    weakSubjects.length >= 4 ? 'Large Survivor bucket. Raise these subjects with answer-writing drills.' : '',
    weeklyProgressPercent < 45 ? 'Timer evidence is low versus target. Increase focused sessions.' : '',
    calendarSkippedDays >= 3 ? 'Frequent skipped days are reducing momentum. Use catch-up blocks.' : '',
    socialOveruseMinutes > 0
      ? `Social usage exceeded limit by ${socialOveruseMinutes} minutes and reduced performance score impact.`
      : '',
    focusRecoveryProtocol
      ? `Targets are off-track. A 3-day recovery protocol is generated (${focusRecoveryProtocol.backlogMinutes} min backlog).`
      : '',
  ].filter(Boolean)
  const guardianActionPlan = [
    weakSubjects.length
      ? `Next 10 days: prioritize Survivor subjects first (${weakSubjects.slice(0, 4).join(', ')}).`
      : 'Next 10 days: maintain momentum by protecting Topper and Contendor subjects.',
    'Run at least 5 timed answers per week (mix compulsory + optionals) and evaluate structure.',
    requiredDailyMinutes
      ? `Protect minimum ${requiredDailyMinutes} focused minutes daily and recover missed time within 48 hours.`
      : 'Generate strategy first, then protect a non-negotiable daily study target.',
    socialOveruseMinutes > 0
      ? `Cut social media by at least ${Math.ceil(socialOveruseMinutes / 2)} minutes tomorrow to recover readiness score.`
      : 'Keep social media usage within the daily limit to protect readiness score.',
    focusRecoveryProtocol
      ? `Follow Focus Recovery Protocol for next 3 days: +${focusRecoveryProtocol.recoveryDays.map((day) => day.extraMinutes).join('/')} min.`
      : 'No recovery protocol needed currently. Maintain current pace and consistency.',
    'Mark every study day in Guardian Calendar with completed, revision, or mock-test status.',
    'Review this report every week and move one subject from Survivor to Contendor.',
  ]
  const nextWeekTargets = [
    requiredDailyMinutes > 0
      ? `Study minimum ${requiredDailyMinutes} focused minutes daily for next 7 days.`
      : 'Generate strategy and set a daily minimum study target.',
    `Reach at least ${Math.max(75, Math.min(90, Math.round(weeklyProgressPercent + 8)))}% weekly completion.`,
    `Keep social media usage within ${socialDailyLimitMinutes} minutes per day.`,
    weakSubjects.length > 0
      ? `Move at least one subject from Survivor to Contendor (${weakSubjects.slice(0, 2).join(', ')}).`
      : 'Protect current subject strength and convert one Contendor subject to Topper.',
    focusRecoveryProtocol
      ? `Complete 3-day Focus Recovery Protocol (+${focusRecoveryProtocol.recoveryDays
          .map((day) => day.extraMinutes)
          .join('/') } min).`
      : `Extend consistency streak from ${currentStudyStreak} to at least ${Math.max(3, currentStudyStreak + 2)} days.`,
  ]
  const plannerStepIndex = Math.max(
    0,
    PLANNER_TAB_SEQUENCE.findIndex((item) => item.id === activePlannerTab),
  )
  const previousPlannerStep = plannerStepIndex > 0 ? PLANNER_TAB_SEQUENCE[plannerStepIndex - 1] : null
  const nextPlannerStep =
    plannerStepIndex < PLANNER_TAB_SEQUENCE.length - 1 ? PLANNER_TAB_SEQUENCE[plannerStepIndex + 1] : null

  const handlePerformanceDrop = (levelId, event) => {
    event.preventDefault()
    const subject = event.dataTransfer.getData('text/plain') || draggingPerformanceSubject
    if (!subject) return
    setSubjectPerformanceLevels((current) => ({ ...current, [subject]: levelId }))
    setDraggingPerformanceSubject('')
    setSelectedPerformanceSubject(subject)
  }
  const handlePerformanceAssign = (subject, levelId) => {
    if (!subject) return
    setSubjectPerformanceLevels((current) => ({ ...current, [subject]: levelId }))
  }
  const handlePerformanceChipClick = (subject) => {
    const isCoarsePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    if (isCoarsePointer) {
      const currentLevel = subjectPerformanceLevels[subject] || 'Survivor'
      const nextLevel = getNextPerformanceLevel(currentLevel)
      handlePerformanceAssign(subject, nextLevel)
      setSelectedPerformanceSubject(subject)
      return
    }
    setSelectedPerformanceSubject(subject)
  }
  const handlePlannerStepChange = (targetStep) => {
    if (!targetStep) return
    setActivePlannerTab(targetStep.id)
  }
  const handleManualDmcScoreChange = (subject, value) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return
    setManualDmcScores((current) => ({
      ...current,
      [subject]: Math.max(0, Math.min(100, Math.round(numericValue))),
    }))
  }

  return (
    <main className="page-main">
      <section className="container planner-page">
        <div className="section-title">
          <p>Guardian Study Planner</p>
          <h2>Build Your Personalized CSS Preparation Strategy</h2>
        </div>
        <div className="planner-shell">
          <aside className="planner-sidebar">
            <div className="planner-sidebar-head">
              <p>Signed in as</p>
              <h3>{authUser.fullName || authUser.username}</h3>
              <span>@{authUser.username}</span>
            </div>
            <div className="planner-tabs" role="tablist" aria-label="Guardian planner sections">
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'subjects'}
                className={`planner-tab ${activePlannerTab === 'subjects' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('subjects')}
              >
                Subject Locker
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'strategy'}
                className={`planner-tab ${activePlannerTab === 'strategy' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('strategy')}
              >
                Strategy Builder
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'performance'}
                className={`planner-tab ${activePlannerTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('performance')}
              >
                Performance Analysis
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'timer'}
                className={`planner-tab ${activePlannerTab === 'timer' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('timer')}
              >
                Timer & Analytics
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'social'}
                className={`planner-tab ${activePlannerTab === 'social' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('social')}
              >
                Social Balance
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'calendar'}
                className={`planner-tab ${activePlannerTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('calendar')}
              >
                Guardian Calendar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'report'}
                className={`planner-tab ${activePlannerTab === 'report' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('report')}
              >
                Guardian Angel Report
              </button>
            </div>
          </aside>

          <div className="planner-content">
            {activePlannerTab === 'subjects' ? (
              <article className="planner-card subject-locker-card">
                <div className="subject-locker-head">
                  <div>
                    <h3>CSS Subject Locker</h3>
                    <p>
                      Drag subjects in their own group cards and lock at 600 marks.
                    </p>
                  </div>
                  <div className={`subject-lock-badge ${subjectsLocked ? 'locked' : ''}`}>
                    {subjectsLocked ? 'Locked' : 'Draft Mode'}
                  </div>
                </div>
                <section className="subject-panel">
                  <h4>Compulsory Subjects</h4>
                  <ul className="subject-pill-list">
                    {PLANNER_CORE_COMPULSORY_SUBJECTS.map((subject) => (
                      <li key={subject} className="subject-pill compulsory">
                        {subject}
                      </li>
                    ))}
                    <li className="subject-pill compulsory optional">
                      {selectedCompulsoryElective || 'Select one compulsory option'}
                    </li>
                  </ul>
                  {!subjectsLocked ? (
                    <div className="compulsory-elective-box">
                      <p>Choose one option:</p>
                      <div className="compulsory-elective-options">
                        {COMPULSORY_ELECTIVE_OPTIONS.map((option) => (
                          <label
                            key={option}
                            className={`compulsory-elective-option ${
                              selectedCompulsoryElective === option ? 'selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="compulsoryElective"
                              value={option}
                              checked={selectedCompulsoryElective === option}
                              onChange={() => setSelectedCompulsoryElective(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                {subjectsLocked ? (
                  <section className="subject-panel">
                    <h4>Optional Subjects (Locked)</h4>
                    <ul className="subject-pill-list">
                      {selectedOptionalSorted.map((subject) => (
                        <li key={subject} className="subject-pill optional">
                          {subject}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <div
                    className={`subject-locker-grid grouped-optionals-grid ${
                      isOptionalSelectionFull ? 'selection-capped' : ''
                    }`}
                  >
                    {optionalGroups.map((group) => {
                      const selectedInGroup = selectedOptionalSubjects.filter(
                        (subject) => OPTIONAL_META_MAP[subject]?.group === group.group,
                      )
                      return (
                        <section
                          key={group.group}
                          className={`subject-panel optional-group-panel ${
                            isOptionalSelectionFull ? 'capped' : ''
                          }`}
                          onDragOver={(event) => {
                            if (!subjectsLocked && !isOptionalSelectionFull) event.preventDefault()
                          }}
                          onDrop={(event) => handleOptionalDrop(group.group, event)}
                        >
                          <h4>{group.group}</h4>
                          <p className="group-rule">{group.rules}</p>
                          <div className="optional-pool">
                            {group.subjects.map((subject) => {
                              const isSelected = selectedOptionalSubjects.includes(subject)
                              const shouldDisable = isOptionalSelectionFull && !isSelected
                              return (
                                <button
                                  key={subject}
                                  type="button"
                                  className={`subject-chip ${isSelected ? 'selected' : ''}`}
                                  draggable={!subjectsLocked && !shouldDisable}
                                  disabled={shouldDisable}
                                  onDragStart={(event) => {
                                    if (subjectsLocked || shouldDisable) return
                                    event.dataTransfer.setData('text/plain', subject)
                                    setDraggingSubject(subject)
                                  }}
                                  onDragEnd={() => setDraggingSubject('')}
                                  onClick={() => handleAddOptionalSubject(subject)}
                                >
                                  {subject}
                                </button>
                              )
                            })}
                          </div>

                          <div className="group-selected-strip">
                            <p>Selected from {group.group}</p>
                            {selectedInGroup.length > 0 ? (
                              <ul className="group-selected-list">
                                {selectedInGroup.map((subject) => (
                                  <li key={subject}>
                                    <span>{subject}</span>
                                    {!subjectsLocked ? (
                                      <button
                                        type="button"
                                        className="slot-clear-btn"
                                        onClick={() => handleOptionalSubjectRemove(subject)}
                                      >
                                        Remove
                                      </button>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <strong>Drop group subjects here</strong>
                            )}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}

                {!subjectsLocked ? (
                  <section className="subject-panel selected-panel">
                    <h4>Selected Optional Papers (Group-wise)</h4>
                    <p className="subject-selection-meta">
                      Total: <strong>{selectedOptionalMarks} Marks</strong> | Papers:{' '}
                      <strong>{selectedOptionalPaperCount}/6</strong>
                    </p>
                    {selectedOptionalPapers.length > 0 ? (
                      <ul className="planner-list">
                        {selectedOptionalPapers.map((item) => (
                          <li key={`${item.group}-${item.paper}`}>
                            <strong>{item.group}:</strong> {item.paper}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="subject-selection-meta">No optional papers selected yet.</p>
                    )}
                  </section>
                ) : null}

                <div className="subject-locker-actions">
                  {!subjectsLocked ? (
                    <button className="btn btn-primary" type="button" onClick={handleLockSubjects}>
                      Lock Subjects
                    </button>
                  ) : (
                    <button className="btn btn-secondary" type="button" onClick={handleUnlockSubjects}>
                      Unlock for Editing
                    </button>
                  )}
                  <p>
                    {subjectsLocked
                      ? 'Subjects are locked'
                      : 'Lock works only at exactly 600 marks and 6 papers (200 marks subjects split into Paper I/II).'}
                  </p>
                </div>
                {subjectsLocked ? (
                  <div className="subject-outline-pdf-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleGenerateCourseOutlinePdf}
                      disabled={isGeneratingOutlinePdf}
                    >
                      {isGeneratingOutlinePdf ? 'Generating PDF...' : 'Generate Course Outline PDF'}
                    </button>
                    {outlinePdfUrl ? (
                      <>
                        <a className="btn btn-secondary" href={outlinePdfUrl} target="_blank" rel="noreferrer">
                          View PDF
                        </a>
                        <a className="btn btn-secondary" href={outlinePdfUrl} download={outlinePdfFileName}>
                          Download PDF
                        </a>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {error ? <p className="planner-error">{error}</p> : null}
              </article>
            ) : null}

            {subjectLockerModalMessage ? (
              <div className="subject-locker-modal-overlay" role="presentation">
                <div
                  className="subject-locker-modal"
                  role="alertdialog"
                  aria-live="assertive"
                  aria-label="Group II selection warning"
                >
                  <h4>Selection blocked</h4>
                  <p>{subjectLockerModalMessage}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSubjectLockerModalMessage('')}
                  >
                    OK, I Understand
                  </button>
                </div>
              </div>
            ) : null}

            {activePlannerTab === 'strategy' ? (
              <>
                <article className="planner-card">
                  <h3>Planner Questions</h3>
                  <form className="planner-form" onSubmit={handleGeneratePlan}>
                    <label>
                      What is the expected date of your CSS examination?
                      <input name="examDate" type="date" value={form.examDate} onChange={handleChange} required />
                      <small>Selected (dd/mm/yyyy): {formatDateDDMMYYYY(form.examDate)}</small>
                    </label>

                    <label>
                      How many hours can you realistically study per day?
                      <input
                        name="studyHours"
                        type="number"
                        min="2"
                        max="14"
                        step="0.5"
                        value={form.studyHours}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label>
                      During which hours are you most productive?
                      <div className="productive-hours-grid">
                        {PRODUCTIVE_HOUR_OPTIONS.map((slot) => (
                          <label key={slot.id} className="productive-hour-option">
                            <input
                              type="checkbox"
                              checked={form.productiveHours.includes(slot.id)}
                              onChange={() => handleProductiveHourToggle(slot.id)}
                            />
                            <span>{slot.label}</span>
                          </label>
                        ))}
                      </div>
                    </label>

                    <label>
                      What stage of preparation are you currently in?
                      <select name="stage" value={form.stage} onChange={handleChange}>
                        <option value="beginner">Beginner</option>
                        <option value="revision">Revision</option>
                        <option value="mock-exams">Mock Exams</option>
                      </select>
                    </label>

                    <label>
                      Which CSS attempt is this?
                      <select name="cssAttempt" value={form.cssAttempt} onChange={handleChange}>
                        <option value="first">First Attempt</option>
                        <option value="second">Second Attempt</option>
                        <option value="third">Third Attempt</option>
                      </select>
                    </label>

                    <label>
                      How difficult do you personally consider CSS?
                      <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="difficult">Difficult</option>
                        <option value="extremely difficult">Extremely Difficult</option>
                      </select>
                    </label>

                    <label>
                      Do you prefer lectures first or self-study first?
                      <select
                        name="learningPreference"
                        value={form.learningPreference}
                        onChange={handleChange}
                      >
                        <option value="lectures-first">Lectures First</option>
                        <option value="self-study-first">Self-Study First</option>
                      </select>
                    </label>

                    <button className="btn btn-primary planner-submit" type="submit">
                      Generate Study Strategy
                    </button>
                    {error ? <p className="planner-error">{error}</p> : null}
                  </form>
                </article>

                {plan ? (
                  <article className="planner-card planner-output">
                    <h3>Your Personalized Preparation Strategy</h3>
                    <p className="planner-meta">
                      Days remaining until exam: <strong>{plan.remainingDays}</strong>
                    </p>
                    <p className="planner-meta">
                      Daily split: Lecture <strong>{plan.lectureHours}h</strong>, Self-study{' '}
                      <strong>{plan.selfStudyHours}h</strong>, Revision <strong>{plan.revisionHours}h</strong>
                    </p>
                    <p className="planner-meta">
                      Effective study target: <strong>{plan.effectiveStudyHours}h/day</strong> (base{' '}
                      {plan.studyHours}h adjusted by factors)
                    </p>
                    <p className="planner-meta">
                      Productive slots: <strong>{plan.selectedSlots.join(', ')}</strong>
                    </p>

                    <div className="planner-formula">
                      <h4>Testing Formula (Visible for QA)</h4>
                      <p>{plan.formula.expression}</p>
                      <ul className="planner-list">
                        <li>baseHours: {plan.formula.values.baseHours}</li>
                        <li>urgencyFactor: {plan.formula.values.urgencyFactor.toFixed(2)}</li>
                        <li>attemptFactor: {plan.formula.values.attemptFactor.toFixed(2)}</li>
                        <li>difficultyFactor: {plan.formula.values.difficultyFactor.toFixed(2)}</li>
                        <li>productivityFactor: {plan.formula.values.productivityFactor.toFixed(2)}</li>
                      </ul>
                    </div>

                    <div className="planner-grid">
                      <div>
                        <h4>Daily Timetable</h4>
                        <ul className="planner-list">
                          {plan.timetable.map((slot) => (
                            <li key={slot.title}>
                              <strong>{slot.timeRange}</strong> - {slot.title}: {slot.focus}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4>Break Intervals to Avoid Burnout</h4>
                        <ul className="planner-list">
                          {plan.breakPlan.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>

                        <h4>Weekly Consolidation Days</h4>
                        <ul className="planner-list">
                          {plan.weeklyConsolidation.length > 0 ? (
                            plan.weeklyConsolidation.slice(0, 8).map((day) => (
                              <li key={day}>
                                {day}: Light revision + one timed past-paper question + reflection notes.
                              </li>
                            ))
                          ) : (
                            <li>No full week available yet; add mini consolidation every 3rd day.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <h4>Preparation Phases Until Exam</h4>
                    <ul className="planner-list">
                      {plan.phaseStrategy.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <p className="planner-message">
                      Stay consistent, protect your routine, and trust your daily process. Small focused
                      wins every day will compound into CSS success.
                    </p>
                  </article>
                ) : null}
              </>
            ) : null}

            {activePlannerTab === 'performance' ? (
              <article className="planner-card">
                <h3>Subject Performance Analyzer</h3>
                <p className="planner-meta">
                  Select one level for each subject: Survivor (around 40), Contendor (above 50),
                  Topper (above 65).
                </p>

                {performanceRows.length === 0 ? (
                  <p className="planner-meta">
                    No subjects available yet. Add subjects in Subject Locker first.
                  </p>
                ) : (
                  <div className="performance-dnd-board">
                    <div className="performance-source-card">
                      <h4>Subjects (Tap/Drag)</h4>
                      <p className="performance-touch-note">
                        Mobile: tap a subject to cycle Survivor, Contendor, Topper.
                      </p>
                      <div className="performance-subject-list">
                        {performanceRows.map((item) => (
                          <button
                            key={item.subject}
                            type="button"
                            className={`performance-subject-chip ${
                              selectedPerformanceSubject === item.subject ? 'is-selected' : ''
                            }`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', item.subject)
                              setDraggingPerformanceSubject(item.subject)
                            }}
                            onDragEnd={() => setDraggingPerformanceSubject('')}
                            onClick={() => handlePerformanceChipClick(item.subject)}
                          >
                            {item.subject}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="performance-columns">
                      {performanceByLevel.map((level) => (
                        <section
                          key={level.id}
                          className="performance-column"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handlePerformanceDrop(level.id, event)}
                        >
                          <header>
                            <h4>{level.id}</h4>
                            <p>{level.scoreHint}</p>
                          </header>
                          <div className="performance-column-body">
                            {level.subjects.length > 0 ? (
                              level.subjects.map((subject) => (
                                <div
                                  key={subject}
                                  className={`performance-assigned-chip ${
                                    selectedPerformanceSubject === subject ? 'is-selected' : ''
                                  }`}
                                  draggable
                                  onDragStart={(event) => {
                                    event.dataTransfer.setData('text/plain', subject)
                                    setDraggingPerformanceSubject(subject)
                                  }}
                                  onDragEnd={() => setDraggingPerformanceSubject('')}
                                  onClick={() => handlePerformanceChipClick(subject)}
                                >
                                  {subject}
                                </div>
                              ))
                            ) : (
                              <p className="performance-drop-hint">Drop subjects here</p>
                            )}
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="performance-dmc">
                      <h4>Projected CSS DMC</h4>
                      <div className="performance-dmc-controls">
                        <label className="performance-dmc-toggle">
                          <input
                            type="checkbox"
                            checked={isManualDmcEnabled}
                            onChange={(event) => setIsManualDmcEnabled(event.target.checked)}
                          />
                          Enable manual adjustment
                        </label>
                        {isManualDmcEnabled ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setManualDmcScores({})}
                          >
                            Reset to level based scores
                          </button>
                        ) : null}
                      </div>
                      <div className="performance-dmc-table-wrap">
                        <table className="performance-dmc-table">
                          <thead>
                            <tr>
                              <th scope="col">Subject</th>
                              <th scope="col">Level</th>
                              <th scope="col">Expected Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="performance-dmc-section-row">
                              <td colSpan={3}>Compulsory</td>
                            </tr>
                            {compulsoryScoreRows.length > 0 ? (
                              compulsoryScoreRows.map((item) => (
                                <tr key={`dmc-compulsory-${item.subject}`}>
                                  <td>{item.subject}</td>
                                  <td>{item.level}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      className="performance-dmc-input"
                                      value={item.score}
                                      disabled={!isManualDmcEnabled}
                                      onChange={(event) =>
                                        handleManualDmcScoreChange(item.subject, event.target.value)
                                      }
                                    />
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3}>No compulsory subjects in current selection.</td>
                              </tr>
                            )}
                            <tr className="performance-dmc-section-row">
                              <td colSpan={3}>Optionals</td>
                            </tr>
                            {optionalScoreRows.length > 0 ? (
                              optionalScoreRows.map((item) => (
                                <tr key={`dmc-optional-${item.subject}`}>
                                  <td>{item.subject}</td>
                                  <td>{item.level}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      className="performance-dmc-input"
                                      value={item.score}
                                      disabled={!isManualDmcEnabled}
                                      onChange={(event) =>
                                        handleManualDmcScoreChange(item.subject, event.target.value)
                                      }
                                    />
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3}>No optional subjects in current selection.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className={`performance-dmc-total ${projectedScoreBand}`}>
                        <strong>Total Projected Marks:</strong> {projectedScoreTotal} / {projectedMaxTotal}
                      </p>
                      <p className="planner-meta">
                        Performance formula: <strong>finalScore = baseScore x socialPenaltyFactor</strong> |
                        baseScore: <strong>{basePerformanceScore}</strong>, socialPenaltyFactor:{' '}
                        <strong>{socialPerformancePenaltyFactor.toFixed(2)}</strong>, finalScore:{' '}
                        <strong>{performanceScore}</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div className="performance-summary">
                  <h4>Overall Preparation Status</h4>
                  <p>{overallPerformanceStatus}</p>

                  <p>
                    <strong>Strong subjects (Topper):</strong>{' '}
                    {strongSubjects.length ? strongSubjects.join(', ') : 'None'}
                  </p>
                  <p>
                    <strong>Competitive subjects (Contendor):</strong>{' '}
                    {competitiveSubjects.length ? competitiveSubjects.join(', ') : 'None'}
                  </p>
                  <p>
                    <strong>Weak subjects (Survivor):</strong>{' '}
                    {weakSubjects.length ? weakSubjects.join(', ') : 'None'}
                  </p>

                  <h4>Constructive Feedback</h4>
                  <ul className="planner-list">
                    {performanceAdvice.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>

                  <p className="planner-message">
                    Stay consistent every week and trust the process. Focused preparation compounds
                    into extraordinary CSS results.
                  </p>
                </div>
              </article>
            ) : null}

            {activePlannerTab === 'timer' ? (
              <article className="planner-card planner-timer-card">
          <div className="planner-timer-header">
            <h3>Guardian Study Timer</h3>
            <p>Track your focused minutes with start, pause, and stop controls.</p>
          </div>
          <div className="timer-display">{formatStopwatch(elapsedSeconds)}</div>
          <div className="timer-controls">
            {timerStatus === 'running' ? (
              <button className="btn btn-secondary" type="button" onClick={handleTimerPause}>
                Pause
              </button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={handleTimerStart}>
                {timerStatus === 'paused' ? 'Resume' : 'Start'}
              </button>
            )}
            <button className="btn btn-primary" type="button" onClick={handleTimerStop}>
              Stop & Save Session
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleTimerReset}>
              Reset
            </button>
          </div>

          <div className="study-metrics">
            <article className="metric-card">
              <p>Today Studied</p>
              <strong>{studiedTodayMinutes} min</strong>
            </article>
            <article className="metric-card">
              <p>Today Required</p>
              <strong>{requiredDailyMinutes || '--'} min</strong>
            </article>
            <article className="metric-card">
              <p>Still Needed Today</p>
              <strong>{requiredDailyMinutes ? `${remainingTodayMinutes} min` : 'Generate a plan'}</strong>
            </article>
            <article className="metric-card">
              <p>Weekly Completion</p>
              <strong>{requiredDailyMinutes ? `${weeklyProgressPercent.toFixed(0)}%` : '--'}</strong>
            </article>
          </div>

          <div className="progress-track" aria-label="Daily progress">
            <span style={{ width: `${dailyProgressPercent}%` }} />
          </div>
          <p className="progress-caption">
            Daily target progress: {requiredDailyMinutes ? `${dailyProgressPercent.toFixed(0)}%` : 'Generate your study strategy first.'}
          </p>

          {focusRecoveryProtocol ? (
            <section className="focus-recovery-card">
              <h4>Focus Recovery Protocol (Auto 3-Day Catch-up)</h4>
              <p>
                You are behind target. Recovery backlog: <strong>{focusRecoveryProtocol.backlogMinutes} min</strong>.
                Extra recovery is capped at <strong>{focusRecoveryProtocol.maxExtraPerDay} min/day</strong> to stay
                burnout-safe.
              </p>
              <div className="focus-recovery-grid">
                {focusRecoveryProtocol.recoveryDays.map((day) => (
                  <article key={day.id} className="focus-recovery-day">
                    <h5>{day.dayLabel}</h5>
                    <p>
                      Total target: <strong>{day.totalTarget} min</strong> ({requiredDailyMinutes} baseline +{' '}
                      {day.extraMinutes} recovery)
                    </p>
                    <ul className="planner-list">
                      {day.protocol.map((item) => (
                        <li key={`${day.id}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              {focusRecoveryProtocol.unresolvedMinutes > 0 ? (
                <p className="planner-meta">
                  Remaining unresolved backlog after safe cap:{' '}
                  <strong>{focusRecoveryProtocol.unresolvedMinutes} min</strong>. Continue with the same protocol
                  for another 1-2 days if needed.
                </p>
              ) : null}
            </section>
          ) : null}

          <h4>Last 7 Days Study Graph</h4>
          <div className="study-chart">
            {weeklyProgress.map((item) => (
              <div key={item.dayKey} className="chart-col">
                <div className="chart-bar-wrap">
                  <span className="chart-bar" style={{ height: `${item.ratio}%` }} />
                </div>
                <small>{item.label}</small>
                <em>{item.studiedMinutes}m</em>
              </div>
            ))}
          </div>
              </article>
            ) : null}

            {activePlannerTab === 'social' ? (
              <article className="planner-card planner-timer-card social-balance-card">
                <div className="planner-timer-header">
                  <h3>Social Balance Tracker</h3>
                  <p>
                    Start this timer when you open social media. Staying within your limit protects your
                    performance score.
                  </p>
                </div>

                <label className="social-limit-field">
                  Daily social media limit (minutes)
                  <input
                    type="number"
                    min="10"
                    max="360"
                    step="5"
                    value={socialDailyLimitMinutes}
                    onChange={handleSocialLimitChange}
                  />
                </label>

                <div className="timer-display social-timer-display">
                  {formatStopwatch(socialElapsedSeconds)}
                </div>

                <div className="timer-controls">
                  {socialTimerStatus === 'running' ? (
                    <button className="btn btn-secondary" type="button" onClick={handleSocialTimerPause}>
                      Pause Social Timer
                    </button>
                  ) : (
                    <button className="btn btn-primary" type="button" onClick={handleSocialTimerStart}>
                      {socialTimerStatus === 'paused' ? 'Resume Social Timer' : 'Start Social Timer'}
                    </button>
                  )}
                  <button className="btn btn-primary" type="button" onClick={handleSocialTimerStop}>
                    Stop & Save Social Session
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={handleSocialTimerReset}>
                    Reset
                  </button>
                </div>

                <div className="study-metrics">
                  <article className="metric-card">
                    <p>Used Today</p>
                    <strong>{socialUsedTodayMinutes} min</strong>
                  </article>
                  <article className="metric-card">
                    <p>Daily Limit</p>
                    <strong>{socialDailyLimitMinutes} min</strong>
                  </article>
                  <article className="metric-card">
                    <p>Overuse</p>
                    <strong>{socialOveruseMinutes > 0 ? `${socialOveruseMinutes} min` : '0 min'}</strong>
                  </article>
                  <article className="metric-card">
                    <p>Performance Impact</p>
                    <strong>{`${Math.round((1 - socialPerformancePenaltyFactor) * 100)}% penalty`}</strong>
                  </article>
                </div>

                <div
                  className={`progress-track social-progress-track ${
                    socialOveruseMinutes > 0 ? 'over-limit' : ''
                  }`}
                  aria-label="Social media limit usage"
                >
                  <span style={{ width: `${Math.min(100, socialDailyUsagePercent)}%` }} />
                </div>
                <p className="progress-caption">
                  {socialOveruseMinutes > 0
                    ? `You exceeded your social limit by ${socialOveruseMinutes} minutes. This is currently reducing your performance score.`
                    : `You are within your daily social limit. Current usage: ${socialDailyUsagePercent.toFixed(0)}% of limit.`}
                </p>

                <p className="planner-meta">
                  Last 7 days average social usage: <strong>{socialWeeklyAverageMinutes.toFixed(0)} min/day</strong>
                </p>
              </article>
            ) : null}

            {activePlannerTab === 'calendar' ? (
              <article className="planner-card guardian-calendar">
          <div className="calendar-header">
            <h3>Interactive Guardian Calendar</h3>
            <div className="calendar-nav">
              <button
                type="button"
                className="btn btn-secondary calendar-btn"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                  )
                }
              >
                Prev
              </button>
              <strong>{monthLabel}</strong>
              <button
                type="button"
                className="btn btn-secondary calendar-btn"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                  )
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`blank-${index}`} className="calendar-day blank" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)
              const dayKey = formatDayKey(date)
              const isToday = dayKey === todayKey
              const isExamDay = dayKey === examDayKey
              const isConsolidationDay = consolidationSet.has(dayKey)
              const statusId = dayStatuses[dayKey]
              const statusClass = CALENDAR_STATUS_OPTIONS.find((item) => item.id === statusId)?.className || ''
              const isDone = statusId === 'completed' || Boolean(completedDays[dayKey])

              return (
                <button
                  key={dayKey}
                  type="button"
                  className={`calendar-day ${isToday ? 'today' : ''} ${isExamDay ? 'exam-day' : ''} ${
                    isConsolidationDay ? 'consolidation-day' : ''
                  } ${isDone ? 'done' : ''} ${statusClass} ${selectedCalendarDay === dayKey ? 'selected' : ''}`}
                  onClick={() => setSelectedCalendarDay(dayKey)}
                  title="Click to set day status"
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          <div className="calendar-status-panel">
            <h4>Date Action Panel</h4>
            {selectedCalendarDay ? (
              <>
                <p>
                  Selected date: <strong>{selectedCalendarDay}</strong>
                </p>
                <label className="calendar-status-label">
                  Update status
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      handleCalendarStatusChange(selectedCalendarDay, event.target.value)
                    }
                  >
                    {CALENDAR_STATUS_OPTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p>Click any day in calendar to assign status.</p>
            )}
          </div>

          <p className="calendar-legend">
            Legend: <span className="dot today" /> Today <span className="dot exam" /> Exam Day{' '}
            <span className="dot consolidation" /> Consolidation <span className="dot done" /> Marked
            Complete
            <span className="dot planned" /> Planned <span className="dot revision" /> Revision{' '}
            <span className="dot mock" /> Mock Test <span className="dot catchup" /> Catch-up{' '}
            <span className="dot rest" /> Rest <span className="dot skipped" /> Skipped
          </p>
              </article>
            ) : null}

            {activePlannerTab === 'report' ? (
              <article className="planner-card guardian-report-card">
                <h3>Guardian Angel Report</h3>
                <p className="planner-meta">
                  Deep assessment generated from Subject Locker, Strategy Builder, Performance Analysis,
                  Timer, Social Balance and Guardian Calendar.
                </p>
                <div className="report-pdf-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleGenerateWeeklyReportPdf}
                    disabled={isGeneratingWeeklyReportPdf}
                  >
                    {isGeneratingWeeklyReportPdf ? 'Generating Weekly PDF...' : 'Generate Weekly PDF Report Card'}
                  </button>
                  {weeklyReportPdfUrl ? (
                    <>
                      <a className="btn btn-secondary" href={weeklyReportPdfUrl} target="_blank" rel="noreferrer">
                        View Weekly PDF
                      </a>
                      <a className="btn btn-secondary" href={weeklyReportPdfUrl} download={weeklyReportPdfFileName}>
                        Download Weekly PDF
                      </a>
                    </>
                  ) : null}
                </div>

                <div className="guardian-report-overview">
                  <div>
                    <p>Overall Readiness Score</p>
                    <strong>{guardianOverallScore}/100</strong>
                    <span>{guardianOverallStatus}</span>
                  </div>
                </div>

                <div className="guardian-report-grid">
                  {guardianReportRows.map((row) => (
                    <article key={row.key} className="guardian-report-metric">
                      <h4>{row.label}</h4>
                      <strong>{row.score}%</strong>
                      <div className="progress-track" aria-label={`${row.label} score`}>
                        <span style={{ width: `${row.score}%` }} />
                      </div>
                      <p>{row.note}</p>
                    </article>
                  ))}
                </div>

                <div className="guardian-gamification-panel">
                  <div className="guardian-gamification-head">
                    <h4>Consistency & Badge Tracker</h4>
                    <p>
                      Lightweight gamification to reinforce study discipline without distracting from
                      preparation.
                    </p>
                  </div>

                  <div className="guardian-gamification-stats">
                    <article>
                      <p>Current study streak</p>
                      <strong>{currentStudyStreak} day(s)</strong>
                    </article>
                    <article>
                      <p>Longest streak (30 days)</p>
                      <strong>{longestStudyStreak} day(s)</strong>
                    </article>
                    <article>
                      <p>14-day consistency</p>
                      <strong>{studyConsistencyPercent14}%</strong>
                    </article>
                    <article>
                      <p>Badges unlocked</p>
                      <strong>
                        {unlockedBadgeCount}/{gamificationBadges.length}
                      </strong>
                    </article>
                  </div>

                  <div className="guardian-badge-grid">
                    {gamificationBadges.map((badge) => (
                      <article
                        key={badge.id}
                        className={`guardian-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                      >
                        <p className="guardian-badge-status">
                          {badge.unlocked ? 'Unlocked' : 'In Progress'}
                        </p>
                        <h5>{badge.title}</h5>
                        <p>{badge.description}</p>
                        <div className="progress-track" aria-label={`${badge.title} progress`}>
                          <span style={{ width: `${Math.round(badge.progress)}%` }} />
                        </div>
                        <small>{Math.round(badge.progress)}% complete</small>
                      </article>
                    ))}
                  </div>

                  {nextBadgeTarget ? (
                    <p className="guardian-next-badge">
                      Next target: <strong>{nextBadgeTarget.title}</strong> ({Math.round(nextBadgeTarget.progress)}
                      % complete)
                    </p>
                  ) : (
                    <p className="guardian-next-badge">
                      All current milestones unlocked. Keep consistency to sustain elite performance.
                    </p>
                  )}
                </div>

                {focusRecoveryProtocol ? (
                  <div className="guardian-report-sections">
                    <section>
                      <h4>Focus Recovery Protocol (3-Day Auto Plan)</h4>
                      <p>
                        Backlog identified: <strong>{focusRecoveryProtocol.backlogMinutes} minutes</strong>. Recovery is
                        intentionally capped to prevent burnout while restoring momentum.
                      </p>
                      <ul className="planner-list">
                        {focusRecoveryProtocol.recoveryDays.map((day) => (
                          <li key={`report-${day.id}`}>
                            <strong>{day.dayLabel}:</strong> +{day.extraMinutes} min recovery (target {day.totalTarget}{' '}
                            min)
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                ) : null}

                <div className="guardian-report-sections">
                  <section>
                    <h4>Current Potential Signals</h4>
                    <ul className="planner-list">
                      {(guardianStrengthSignals.length > 0
                        ? guardianStrengthSignals
                        : ['Potential signals are limited right now. Build stronger execution evidence.']
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4>Critical Risk Signals</h4>
                    <ul className="planner-list">
                      {(guardianRiskSignals.length > 0
                        ? guardianRiskSignals
                        : ['No major risk cluster detected currently. Protect your consistency.']
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="guardian-report-sections">
                  <section>
                    <h4>Calculated Current Status</h4>
                    <p>
                      Candidate is operating at <strong>{guardianOverallScore}% readiness</strong> with a
                      projected performance profile of <strong>{performanceScoreAverage.toFixed(1)}</strong>{' '}
                      marks per selected subject. The present pattern suggests{' '}
                      <strong>{strongSubjects.length}</strong> high performance subjects,{' '}
                      <strong>{competitiveSubjects.length}</strong> competitive subjects, and{' '}
                      <strong>{weakSubjects.length}</strong> subjects needing urgent uplift.
                    </p>
                    <p>
                      Execution evidence from productivity systems shows{' '}
                      <strong>{weeklyProgressPercent.toFixed(0)}%</strong> weekly timer completion and{' '}
                      <strong>{calendarTaggedDays}</strong> calendar tagged days. The immediate priority is
                      to convert planning intent into consistently completed study blocks.
                    </p>
                  </section>
                </div>

                <div className="guardian-report-sections">
                  <section>
                    <h4>Next Cycle Action Plan</h4>
                    <ul className="planner-list">
                      {guardianActionPlan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <p className="planner-message">
                  You are closer than you think. Execute the next 14 days with discipline and Guardian
                  Angel will keep your preparation direction sharp, measurable, and competitive.
                </p>
              </article>
            ) : null}

            <div className="planner-step-nav" aria-label="Study planner step navigation">
              {previousPlannerStep ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePlannerStepChange(previousPlannerStep)}
                >
                  Previous
                </button>
              ) : (
                <span className="planner-step-placeholder" aria-hidden="true" />
              )}
              <p>
                Step {plannerStepIndex + 1} of {PLANNER_TAB_SEQUENCE.length}:{' '}
                <strong>{PLANNER_TAB_SEQUENCE[plannerStepIndex].label}</strong>
              </p>
              {nextPlannerStep ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePlannerStepChange(nextPlannerStep)}
                >
                  Next
                </button>
              ) : (
                <span className="planner-step-placeholder" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="Guardian Angel home">
            <img src={logo} alt="Guardian Angel logo" />
            <div>
              <strong>Guardian Angel</strong>
              <span>Knowledge Is Priceless</span>
            </div>
          </Link>
          <p>
            Empowering Pakistan&apos;s Future Leaders
          </p>
        </div>

        <div className="footer-links">
          <h4>Explore</h4>
          <Link to="/css-syllabus">CSS Syllabus</Link>
          <Link to="/css-rules">CSS Rules</Link>
          <Link to="/css-past-papers">CSS Past Papers</Link>
          <Link to="/css-study-material">CSS Study Material</Link>
          <Link to="/guardian-study-planner">Guardian Study Planner</Link>
        </div>

        <div className="footer-links">
          <h4>Core Values</h4>
          <a href="/#why-guardian-angel">Premium Quality</a>
          <a href="/#why-guardian-angel">Completely Free</a>
          <a href="/#why-guardian-angel">Equal Opportunity</a>
          <a href="/#mission">Knowledge is Priceless</a>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Guardian Angel. All rights reserved.</p>
      </div>
    </footer>
  )
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 220)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <button
      className={`scroll-top-btn ${isVisible ? 'visible' : ''}`}
      type="button"
      aria-label="Back to top"
      aria-hidden={!isVisible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const raw = localStorage.getItem('ga-auth-user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ga-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('ga-theme', theme)
    } catch {
      // Ignore storage failures and continue with in-memory theme.
    }
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined

    const root = document.documentElement

    const handlePointerMove = (event) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`)
      root.style.setProperty('--cursor-y', `${event.clientY}px`)
      root.style.setProperty('--cursor-glow-opacity', '1')
    }

    const handlePointerLeave = () => {
      root.style.setProperty('--cursor-glow-opacity', '0')
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  useEffect(() => {
    try {
      if (authUser) localStorage.setItem('ga-auth-user', JSON.stringify(authUser))
      else localStorage.removeItem('ga-auth-user')
    } catch {
      // Ignore storage failures and continue with in-memory auth state.
    }
  }, [authUser])

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <div className="site">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          authUser={authUser}
          onLogout={() => setAuthUser(null)}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/css-syllabus" element={<CssSyllabusPage />} />
          <Route path="/css-rules" element={<CssRulesPage />} />
          <Route path="/css-past-papers" element={<CssPastPapersPage />} />
          <Route path="/css-study-material" element={<CssStudyMaterialPage />} />
          <Route
            path="/signin"
            element={<SignInPage authUser={authUser} onSignIn={(user) => setAuthUser(user)} />}
          />
          <Route
            path="/guardian-study-planner"
            element={
              authUser ? (
                <GuardianStudyPlannerPage authUser={authUser} />
              ) : (
                <Navigate to="/signin" replace state={{ from: '/guardian-study-planner' }} />
              )
            }
          />
          <Route path="/css-syllabus/:subjectSlug" element={<SubjectDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
        <BackToTopButton />
      </div>
    </BrowserRouter>
  )
}

export default App
