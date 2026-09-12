/**
 * Insert batch 3 — LinkedIn India jobs
 * Deduplication: checks applyUrl before inserting
 */
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

// Parse the URLs to extract title + company from the URL slug
function parseUrl(url) {
  // URL format: https://in.linkedin.com/jobs/view/title-at-company-1234567890
  const slug = url.split('/').pop().replace(/-\d+$/, '') // remove trailing ID
  const parts = slug.split('-at-')
  if (parts.length >= 2) {
    const title = parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    const company = parts.slice(1).join(' at ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    return { title, company }
  }
  // Fallback: just use the slug as title
  return { title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim(), company: 'Unknown' }
}

// Categorize based on title keywords
function categorize(title) {
  const t = title.toLowerCase()
  if (/fresher|entry|intern|trainee|graduate|junior|associate.*fresher/i.test(t)) return 'fresher'
  if (/intern/i.test(t)) return 'internship'
  if (/walk.?in/i.test(t)) return 'walk-in'
  if (/remote/i.test(t)) return 'experienced'
  return 'experienced'
}

function getWorkMode(title) {
  return /remote/i.test(title) ? 'Remote' : 'Onsite'
}

function getSkills(title) {
  const t = title.toLowerCase()
  const skills = []
  if (/python/.test(t)) skills.push('Python')
  if (/java\b/.test(t)) skills.push('Java')
  if (/react|mern|mean/.test(t)) skills.push('React', 'Node.js')
  if (/c\+\+|cpp/.test(t)) skills.push('C++')
  if (/sql|database/.test(t)) skills.push('SQL')
  if (/ai|machine.?learning|ml/.test(t)) skills.push('AI', 'Machine Learning')
  if (/data.?scient/.test(t)) skills.push('Data Science', 'Python')
  if (/devops|ansible|cloud/.test(t)) skills.push('DevOps', 'AWS')
  if (/sales|business.?develop|bde|inside.?sales/.test(t)) skills.push('Sales', 'B2B', 'CRM')
  if (/video.?editor|motion.?graphic/.test(t)) skills.push('Video Editing', 'Premiere Pro', 'After Effects')
  if (/graphic.?design/.test(t)) skills.push('Graphic Design', 'Photoshop', 'Illustrator')
  if (/accountant|tax/.test(t)) skills.push('Accounting', 'Tally', 'GST', 'Taxation')
  if (/hr|recruiter|talent/.test(t)) skills.push('HR', 'Recruitment', 'Talent Acquisition')
  if (/hotel|chef|steward|housekeeping|guest|front.?office/.test(t)) skills.push('Hospitality', 'Hotel Management')
  if (/architect/.test(t)) skills.push('Architecture', 'System Design')
  if (/frontend|front.?end/.test(t)) skills.push('JavaScript', 'React', 'CSS')
  if (/backend|back.?end/.test(t)) skills.push('Java', 'Python', 'Databases')
  if (/full.?stack/.test(t)) skills.push('JavaScript', 'React', 'Node.js')
  if (/marketing/.test(t)) skills.push('Marketing', 'Digital Marketing', 'SEO')
  return skills.length > 0 ? skills.join(', ') : 'Relevant Skills'
}

const urls = [
  'https://in.linkedin.com/jobs/view/power-programmer-specialist-programmer-mean-mern-q2-fy-26-at-infosys-4438395513',
  'https://in.linkedin.com/jobs/view/production-specialist-l3-at-wipro-4466414429',
  'https://in.linkedin.com/jobs/view/hotel-cleanliness-expert-at-westin-hotels-resorts-4466430280',
  'https://in.linkedin.com/jobs/view/production-specialist-l2-at-wipro-4466430314',
  'https://in.linkedin.com/jobs/view/clinical-sales-executive-vijayawada-at-intuitive-4447525034',
  'https://in.linkedin.com/jobs/view/sales-executive-at-neuraleap-group-4465402528',
  'https://in.linkedin.com/jobs/view/accountant-at-careeraiforge-4466710022',
  'https://in.linkedin.com/jobs/view/sales-executive-at-neuraleap-group-4465420454',
  'https://in.linkedin.com/jobs/view/video-editor-at-ea-immigrations-4464281707',
  'https://in.linkedin.com/jobs/view/f-b-service-expert-at-westin-hotels-resorts-4466414393',
  'https://in.linkedin.com/jobs/view/inside-sales-representative-at-flybunch-ventures-pvt-ltd-4464281477',
  'https://in.linkedin.com/jobs/view/search-engineer-remote-at-hire-feed-4466447277',
  'https://in.linkedin.com/jobs/view/molding-operator-at-aptiv-4434080495',
  'https://in.linkedin.com/jobs/view/senior-verification-engineer-at-jobcrexa-4466485068',
  'https://in.linkedin.com/jobs/view/sr-canada-recruiter-at-w3global-4460750906',
  'https://in.linkedin.com/jobs/view/spe-maps-at-cognizant-4456297295',
  'https://in.linkedin.com/jobs/view/senior-ai-scientist-research-engineer-applied-ai-at-par-with-director-at-mulya-technologies-4462432339',
  'https://in.linkedin.com/jobs/view/f-b-and-events-service-expert-at-st-regis-hotels-resorts-4457542607',
  'https://in.linkedin.com/jobs/view/video-editor-at-tms-group-4465407195',
  'https://in.linkedin.com/jobs/view/sta-methodology-engineer-at-nxp-semiconductors-4237985453',
  'https://in.linkedin.com/jobs/view/inside-sales-executive-4464273514',
  'https://in.linkedin.com/jobs/view/senior-software-engineering-manager-persistent-disk-backup-team-at-google-4446776880',
  'https://in.linkedin.com/jobs/view/business-development-operations-executive-at-oberoi-ibc-4464286354',
  'https://in.linkedin.com/jobs/view/it-sales-at-sigmait-software-designers-pvt-ltd-4464708068',
  'https://in.linkedin.com/jobs/view/events-executive-at-w-hotels-4457808573',
  'https://in.linkedin.com/jobs/view/garment-merchandiser-buying-house-experience-at-globelance-4465403894',
  'https://in.linkedin.com/jobs/view/graphic-motion-video-designer-at-homvery-4464707448',
  'https://in.linkedin.com/jobs/view/garment-merchandiser-buying-house-experience-at-globelance-4465406839',
  'https://in.linkedin.com/jobs/view/sr-administrator-appeals-appeals-at-amazon-4466426243',
  'https://in.linkedin.com/jobs/view/video-editor-at-abybaby-events-private-limited-4464283563',
  'https://in.linkedin.com/jobs/view/lead-recruiter-at-biorev-studios-3d-rendering-studio-4465641960',
  'https://in.linkedin.com/jobs/view/paid-ads-meta-at-scaling-wolves-4464705205',
  'https://in.linkedin.com/jobs/view/senior-business-development-associate-at-scaler-4464288496',
  'https://in.linkedin.com/jobs/view/sme-sales-executive-at-xperteez-technology-4464707098',
  'https://in.linkedin.com/jobs/view/senior-software-engineer-ai-powered-advertising-agents-at-pubmatic-4427016950',
  'https://in.linkedin.com/jobs/view/inbound-customer-service-agent-at-unifycx-4466467820',
  'https://in.linkedin.com/jobs/view/radiologist-at-healing-hands-clinic-4464288186',
  'https://in.linkedin.com/jobs/view/sales-development-representative-at-dandelion-civilization-4466470868',
  'https://in.linkedin.com/jobs/view/video-editor-at-kavish-media-4465410133',
  'https://in.linkedin.com/jobs/view/mansion-upkeep-ambassador-at-raffles-hotels-resorts-4447141455',
  'https://in.linkedin.com/jobs/view/staff-threat-intelligence-researcher-at-arctic-wolf-4456636526',
  'https://in.linkedin.com/jobs/view/materials-assistant-at-grand-hyatt-4466094860',
  'https://in.linkedin.com/jobs/view/telecaller-at-sketchworx-4464271481',
  'https://in.linkedin.com/jobs/view/video-editor-cum-motion-graphics-designer-at-tenx-digitech-4465403790',
  'https://in.linkedin.com/jobs/view/reservations-executive-at-jaglax-homes-4464271601',
  'https://in.linkedin.com/jobs/view/business-development-executive-at-blockgenix-consultants-4465417974',
  'https://in.linkedin.com/jobs/view/video-editor-at-investek-4464262896',
  'https://in.linkedin.com/jobs/view/sales-specialist-at-cmd-developers-promoters-pvt-ltd-4465411265',
  'https://in.linkedin.com/jobs/view/video-editor-at-valuable-multimedia-4464271857',
  'https://in.linkedin.com/jobs/view/talent-application-join-our-community-at-ava-labs-4465181772',
  'https://in.linkedin.com/jobs/view/lab-tester-for-personal-care-at-rspl-group-4464702135',
  'https://in.linkedin.com/jobs/view/sales-executive-at-hivesurf-4464209048',
  'https://in.linkedin.com/jobs/view/business-development-executive-at-certifyied-4465407152',
  'https://in.linkedin.com/jobs/view/front-office-associate-at-minimalist-hotels-4464285374',
  'https://in.linkedin.com/jobs/view/commis-ii-commis-iii-freshers-hotel-management-freshers-pastry-at-theobroma-foods-private-limited-4465403586',
  'https://in.linkedin.com/jobs/view/assistant-at-anna-garina-4464293671',
  'https://in.linkedin.com/jobs/view/associate-senior-associate-operations-at-wns-3816305984',
  'https://in.linkedin.com/jobs/view/sales-executive-at-netcall-services-4465415310',
  'https://in.linkedin.com/jobs/view/optometrist-at-nura-sustained-health-with-active-ai-screening-4465402495',
  'https://in.linkedin.com/jobs/view/senior-manager-software-engineering-at-onetrust-4457506949',
  'https://in.linkedin.com/jobs/view/cinema-staff-at-cine-square-entertainment-private-limited-4465416281',
  'https://in.linkedin.com/jobs/view/presales-solutions-architect-digital-workplace-services-at-unisys-4447530048',
  'https://in.linkedin.com/jobs/view/executive-assistant-at-bright-money-4466480512',
  'https://in.linkedin.com/jobs/view/housekeeping-associate-at-hilton-4466710086',
  'https://in.linkedin.com/jobs/view/graphic-designer-at-careeraiforge-4466491970',
  'https://in.linkedin.com/jobs/view/marketing-professional-remote-at-hire-feed-4466444225',
  'https://in.linkedin.com/jobs/view/ansible-automation-engineer-at-jobcrexa-4466477880',
  'https://in.linkedin.com/jobs/view/engineering-manager-remote-at-hire-feed-4466456239',
  'https://in.linkedin.com/jobs/view/garment-merchandiser-buying-house-experience-at-globelance-4465422711',
  'https://in.linkedin.com/jobs/view/lead-administrator-l1-at-wipro-4466432308',
  'https://in.linkedin.com/jobs/view/biologist-remote-at-hire-feed-4466443099',
  'https://in.linkedin.com/jobs/view/senior-platform-engineer-remote-at-hire-feed-4466445178',
  'https://in.linkedin.com/jobs/view/chef-de-partie-at-westin-hotels-resorts-4466428327',
  'https://in.linkedin.com/jobs/view/tax-analyst-i-foreign-reporting-compliance-at-amazon-4466071673',
  'https://in.linkedin.com/jobs/view/executive-sales-representative-at-policybazaar-com-4445816024',
  'https://in.linkedin.com/jobs/view/information-manager-remote-at-hire-feed-4466454447',
  'https://in.linkedin.com/jobs/view/infrastructure-and-platform-architect-l2-at-wipro-4466426387',
  'https://in.linkedin.com/jobs/view/tax-analyst-us-international-tax-at-amazon-4466077567',
  'https://in.linkedin.com/jobs/view/tax-analyst-us-international-tax-at-amazon-4466088414',
  'https://in.linkedin.com/jobs/view/technical-architect-remote-at-hire-feed-4466456038',
  'https://in.linkedin.com/jobs/view/customer-support-executive-freshers-experienced-gurugram-freshers-welcome-at-policybazaar-com-4464263087',
  'https://in.linkedin.com/jobs/view/interior-design-specialist-at-decorpot-4465414021',
  'https://in.linkedin.com/jobs/view/associate-customer-service-at-aarushi-infotech-4465414526',
  'https://in.linkedin.com/jobs/view/verification-specialist-at-orbitouch-hr-orbitouch-outsourcing-pvt-ltd-4464292125',
  'https://in.linkedin.com/jobs/view/brand-outreach-partnerships-executive-at-sortmyscene-4464299087',
  'https://in.linkedin.com/jobs/view/software-development-manager-iii-grocery-ordering-at-amazon-4466413258',
  'https://in.linkedin.com/jobs/view/guest-services-associate-food-beverage-service-at-jdv-by-hyatt-4466488776',
  'https://in.linkedin.com/jobs/view/project-manager-at-pixelizt-restaurant-marketing-4465189828',
  'https://in.linkedin.com/jobs/view/technical-director-ai-ml-at-giggso-4465418274',
  'https://in.linkedin.com/jobs/view/bde-fresher-at-mg-4465412129',
  'https://in.linkedin.com/jobs/view/account-executive-at-bharat-expo-feeder-bef-4463988481',
  'https://in.linkedin.com/jobs/view/sr-applied-scientist-wwos-tech-at-amazon-science-4464293079',
  'https://in.linkedin.com/jobs/view/marketing-operations-specialist-messaging-at-mcafee-4456255821',
  'https://in.linkedin.com/jobs/view/executive-assistant-at-1xl-universe-4464294297',
  'https://in.linkedin.com/jobs/view/senior-graphic-designer-at-digitalxnode-4466497095',
  'https://in.linkedin.com/jobs/view/senior-interior-designer-at-design-cafe-4466469724',
  'https://in.linkedin.com/jobs/view/gynecologist-at-kims-hospital-4464838602',
  'https://in.linkedin.com/jobs/view/soc-engineering-sr-staff-engineer-sta-at-synopsys-inc-4457319209',
  'https://in.linkedin.com/jobs/view/script-editor-in-delhi-at-somo-media-4466412418',
  'https://in.linkedin.com/jobs/view/influencer-marketing-executive-at-west-bengal-chemical-industries-ltd-4464273655',
  'https://in.linkedin.com/jobs/view/senior-analog-mixed-signal-layout-design-engineer-at-sandisk-4466470612',
  'https://in.linkedin.com/jobs/view/machine-learning-engineer-iv-at-brightstar-lottery-4437558046',
  'https://in.linkedin.com/jobs/view/software-developer-3-at-oracle-4464254419',
  'https://in.linkedin.com/jobs/view/performance-marketer-at-say-no-more-4464299419',
  'https://in.linkedin.com/jobs/view/software-engineer-c-remote-at-quik-hire-staffing-4466451518',
  'https://in.linkedin.com/jobs/view/software-engineer-at-tata-consultancy-services-4465422590',
  'https://in.linkedin.com/jobs/view/senior-ai-software-engineer-remote-at-quik-hire-staffing-4466454446',
  'https://in.linkedin.com/jobs/view/sales-executive-cloud-business-field-sales-at-hirednex-edutech-private-limited-4464287381',
  'https://in.linkedin.com/jobs/view/senior-hr-executive-at-recfront-4464709016',
  'https://in.linkedin.com/jobs/view/senior-business-development-specialist-at-mindruby-technologies-4465411668',
  'https://in.linkedin.com/jobs/view/public-relations-officer-at-progenesis-ivf-fertility-center-4461745594',
  'https://in.linkedin.com/jobs/view/graphic-designer-video-editor-at-paywint-4465418173',
  'https://in.linkedin.com/jobs/view/customer-relationship-management-executive-at-mygate-4465414188',
  'https://in.linkedin.com/jobs/view/principal-physical-design-floorplan-engineer-at-encharge-ai-4465302571',
  'https://in.linkedin.com/jobs/view/experienced-backend-software-engineer-cloud-devops-at-wirelesscar-4465177441',
  'https://in.linkedin.com/jobs/view/human-resources-business-partner-tech-digital-at-taas-partners-4465407279',
  'https://in.linkedin.com/jobs/view/director-at-agam-capital-india-4465199445',
  'https://in.linkedin.com/jobs/view/finance-associate-cashier-at-hyatt-regency-4447024107',
  'https://in.linkedin.com/jobs/view/relationship-manager-baas-coverage-at-credable-4454509125',
  'https://in.linkedin.com/jobs/view/software-engineer-at-sourcingxpress-4464372697',
  'https://in.linkedin.com/jobs/view/warehouse-operations-executive-at-express-global-logistics-4466482510',
  'https://in.linkedin.com/jobs/view/tele-caller-executive-at-matrix-infotech-solution-4464291267',
  'https://in.linkedin.com/jobs/view/graphic-designer-at-diplomats-group-india-4464264438',
  'https://in.linkedin.com/jobs/view/inside-sales-edtech-selling-iit-programs-at-globelance-4465417787',
  'https://in.linkedin.com/jobs/view/human-resources-manager-at-flow-interio-private-limited-4450593750',
  'https://in.linkedin.com/jobs/view/principal-software-engineer-at-xometry-4457961356',
  'https://in.linkedin.com/jobs/view/inside-sales-specialist-at-prorata-4464294299',
  'https://in.linkedin.com/jobs/view/plastic-injection-molding-machine-operator-at-thara-innovations-india-private-limited-4465419619',
  'https://in.linkedin.com/jobs/view/technical-development-representative-at-qualys-4428710660',
  'https://in.linkedin.com/jobs/view/jr-architect-at-kasturi-housing-4465181306',
  'https://in.linkedin.com/jobs/view/business-development-executive-at-rac-it-solutions-4465411581',
  'https://in.linkedin.com/jobs/view/sales-advisor-at-spinny-4464706507',
  'https://in.linkedin.com/jobs/view/solutions-architect-at-ema-4454672015',
  'https://in.linkedin.com/jobs/view/data-governance-architect-at-kidde-global-solutions-4408417776',
  'https://in.linkedin.com/jobs/view/experienced-i-statistical-programmer-mumbai-hyderabad-bangalore-at-johnson-johnson-innovative-medicine-4447016790',
  'https://in.linkedin.com/jobs/view/inside-sales-edtech-selling-iit-programs-at-globelance-4465408868',
  'https://in.linkedin.com/jobs/view/sr-data-scientist-with-snowflake-experience-at-synapone-4466465728',
  'https://in.linkedin.com/jobs/view/sales-manager-weddings-celebrations-at-grand-hyatt-4466095877',
  'https://in.linkedin.com/jobs/view/steward-at-calcutta-64-4464280792',
  'https://in.linkedin.com/jobs/view/tax-assistant-at-careeraiforge-4466707682',
  'https://in.linkedin.com/jobs/view/sales-and-marketing-executive-at-bit-hook-4464290417',
  'https://in.linkedin.com/jobs/view/software-engineer-at-copart-4380329378',
  'https://in.linkedin.com/jobs/view/spare-executive-at-new-swan-multitech-limited-4464277506',
  'https://in.linkedin.com/jobs/view/clinical-sales-executive-at-intuitive-4457391181',
  'https://in.linkedin.com/jobs/view/staff-engineer-enterprise-it-automation-at-netradyne-4428705392',
  'https://in.linkedin.com/jobs/view/export-growth-marketer-at-katyayani-organics-4463981834',
  'https://in.linkedin.com/jobs/view/sr-administrator-appeals-appeals-at-amazon-4466427256',
  'https://in.linkedin.com/jobs/view/ai-trainer-remote-at-hire-feed-4466444498',
  'https://in.linkedin.com/jobs/view/ctk-svc-sr-associate-s-ctk-at-amazon-4455906224',
  'https://in.linkedin.com/jobs/view/data-manager-remote-at-quik-hire-staffing-4466435909',
  'https://in.linkedin.com/jobs/view/software-engineer-evaluation-remote-at-quik-hire-staffing-4466457425',
  'https://in.linkedin.com/jobs/view/software-engineer-ruby-remote-at-quik-hire-staffing-4466438265',
  'https://in.linkedin.com/jobs/view/rtl-design-staff-engineer-at-qualcomm-4437047953',
  'https://in.linkedin.com/jobs/view/editor-remote-at-hired-4466447209',
  'https://in.linkedin.com/jobs/view/computational-biologist-remote-at-hired-4466449291',
  'https://in.linkedin.com/jobs/view/senior-verification-engineer-pcie-at-nvidia-4465148778',
  'https://in.linkedin.com/jobs/view/principal-physical-design-floorplan-engineer-at-encharge-ai-4463317737',
  'https://in.linkedin.com/jobs/view/principal-physical-design-floorplan-engineer-at-encharge-ai-4464624459',
  'https://in.linkedin.com/jobs/view/lead-process-specialist-hr-policy-compliance-at-target-4462969086',
  'https://in.linkedin.com/jobs/view/associate-at-wipro-4465412319',
  'https://in.linkedin.com/jobs/view/sr-business-development-at-3de-tech-proto-4465415430',
  'https://in.linkedin.com/jobs/view/business-development-executive-at-uptye-4464268583',
  'https://in.linkedin.com/jobs/view/bde-fresher-at-mg-4465413127',
  'https://in.linkedin.com/jobs/view/engineering-manager-at-browserstack-4447528572',
  'https://in.linkedin.com/jobs/view/people-partner-associate-ii-at-gamblingcareers-com-4466427507',
  'https://in.linkedin.com/jobs/view/assistant-front-office-manager-at-grand-hyatt-4466385691',
  'https://in.linkedin.com/jobs/view/digital-graphic-designer-at-pattern-4389727734',
  'https://in.linkedin.com/jobs/view/software-engineer-micro-platforms-remote-at-hire-feed-4466449599',
  'https://in.linkedin.com/jobs/view/doorman-at-morgans-originals-4466708206',
  'https://in.linkedin.com/jobs/view/research-analyst-remote-at-quik-hire-staffing-4466446471',
  'https://in.linkedin.com/jobs/view/assistant-manager-housekeeping-at-hyatt-regency-4466098805',
  'https://in.linkedin.com/jobs/view/statistical-programmer-ii-sdtm-at-parexel-4456257385',
  'https://in.linkedin.com/jobs/view/cost-estimator-at-globe-overseas-pvt-ltd-4465408441',
  'https://in.linkedin.com/jobs/view/manager-global-employer-services-tax-global-mobility-signers-hyderabad-bengaluru-chennai-gurugram-pune-mumbai-kolkata-at-deloitte-4418849557',
  'https://in.linkedin.com/jobs/view/sales-executive-at-bidyut-innovation-4464704209',
  'https://in.linkedin.com/jobs/view/tc-cs-crcr-ai-risk-and-compliance-manager-at-ey-4463468679',
  'https://in.linkedin.com/jobs/view/telesales-executive-at-floorsy-4464297379',
  'https://in.linkedin.com/jobs/view/tc-cs-cyber-architecture-ot-and-engineering-ai-architect-senior-manager-at-ey-4411581563',
  'https://in.linkedin.com/jobs/view/assistant-marketing-manager-at-westin-hotels-resorts-4457543604',
  'https://in.linkedin.com/jobs/view/senior-manager-machine-learning-at-roku-4419135331',
  'https://in.linkedin.com/jobs/view/auditor-at-talent-corner-hr-services-pvt-ltd-4464262703',
  'https://in.linkedin.com/jobs/view/software-engineer-ii-at-blackhawk-network-india-4415291426',
  'https://in.linkedin.com/jobs/view/sr-program-specialist-at-honeywell-technologies-4466345368',
  'https://in.linkedin.com/jobs/view/customer-support-executive-at-aisensy-4464291059',
  'https://in.linkedin.com/jobs/view/tax-analyst-mumbai-lower-parel-at-one-story-4465417048',
  'https://in.linkedin.com/jobs/view/sr-administrator-appeals-appeals-at-amazon-4466424250',
  'https://in.linkedin.com/jobs/view/software-developer-3-at-oracle-4464244466',
  'https://in.linkedin.com/jobs/view/meta-lead-at-valerie-group-4466488738',
  'https://in.linkedin.com/jobs/view/sales-specialist-at-build-my-rep-4464289123',
  'https://in.linkedin.com/jobs/view/account-manager-at-hashtag-inc-4466464059',
  'https://in.linkedin.com/jobs/view/data-engineer-with-snowflake-and-ai-at-sii-poland-4463988616',
  'https://in.linkedin.com/jobs/view/senior-software-engineer-at-zoominfo-4404822110',
  'https://in.linkedin.com/jobs/view/c-engineer-at-applied-materials-india-4451791503',
  'https://in.linkedin.com/jobs/view/relationship-manager-at-paisabazaar-4464298260',
  'https://in.linkedin.com/jobs/view/business-development-executive-at-phaze-ai-4465415280',
  'https://in.linkedin.com/jobs/view/business-development-at-lixil-4466499599',
  'https://in.linkedin.com/jobs/view/lead-clocking-design-engineer-at-phytau-semiconductors-4466469862',
  'https://in.linkedin.com/jobs/view/vp-business-head-managed-offices-expansion-at-2gethr-4466461425',
  'https://in.linkedin.com/jobs/view/inside-sales-executive-at-dreams-passion-4464267998',
  'https://in.linkedin.com/jobs/view/artificial-intelligence-engineer-at-tekpillar-4464296206',
]

async function main() {
  let inserted = 0
  let skipped = 0

  for (const url of urls) {
    try {
      // Check if job already exists (by applyUrl)
      const existing = await prisma.job.findFirst({
        where: { applyUrl: url },
        select: { id: true },
      })
      if (existing) {
        skipped++
        continue
      }

      const { title, company: companyName } = parseUrl(url)
      const category = categorize(title)
      const workMode = getWorkMode(title)
      const skills = getSkills(title)

      // Create or get company
      const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50)
      let company = await prisma.company.findUnique({ where: { slug: companySlug } })
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: companyName,
            slug: companySlug,
            verified: true,
          },
        })
      }

      // Create job
      await prisma.job.create({
        data: {
          title: title,
          companyId: company.id,
          category: category,
          employmentType: 'Full-time',
          workMode: workMode,
          experience: category === 'fresher' ? '0-2 Years' : '3+ Years',
          location: 'India',
          skills: skills,
          description: title + ' at ' + companyName + '. This is a verified job posting sourced from LinkedIn India. Apply directly via the link below.\n\n## Required Skills\n' + skills.split(',').map(function(s) { return '- ' + s.trim() }).join('\n') + '\n\nApply now through the link below.',
          applyUrl: url,
          verified: true,
          isFeatured: false,
          source: 'linkedin-india',
          sourceRef: url.split('/').pop(),
          enriched: true,
        },
      })
      inserted++
    } catch (e) {
      console.error('  FAIL: ' + url + ': ' + e.message)
    }
  }

  const total = await prisma.job.count({ where: { verified: true } })
  const totalCompanies = await prisma.company.count()
  console.log('Inserted: ' + inserted + ', Skipped (dupes): ' + skipped)
  console.log('Total verified jobs: ' + total)
  console.log('Total companies: ' + totalCompanies)
}

main().catch(function(e) { console.error(e); process.exit(1) }).finally(function() { return prisma.$disconnect() })
