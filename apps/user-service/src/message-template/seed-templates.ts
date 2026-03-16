import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTemplates = [
  // English Templates
  {
    name: 'Professional Application - English',
    subject: 'Application for ~#job_title at ~#company_name',
    body: `Dear ~#rh_name,

I am writing to express my strong interest in the ~#job_title position at ~#company_name. With my background and experience, I believe I would be a valuable addition to your team.

I am particularly drawn to this opportunity because of ~#company_name's reputation in the industry. I am confident that my skills and enthusiasm make me an excellent candidate for this role.

I would welcome the opportunity to discuss how my experience and qualifications align with your needs. Thank you for considering my application.

Best regards,
~#sender_name
~#sender_email
~#sender_phone`,
    language: 'en',
    isDefault: true,
  },
  {
    name: 'Follow-up Email - English',
    subject: 'Following up on ~#job_title Application',
    body: `Dear ~#rh_name,

I hope this email finds you well. I am writing to follow up on my application for the ~#job_title position at ~#company_name, which I submitted on ~#application_date.

I remain very interested in this opportunity and would appreciate any update on the status of my application. I am happy to provide any additional information you may need.

Thank you for your time and consideration.

Best regards,
~#sender_name
~#sender_email`,
    language: 'en',
    isDefault: true,
  },
  // German Templates
  {
    name: 'Professionelle Bewerbung - Deutsch',
    subject: 'Bewerbung als ~#job_title bei ~#company_name',
    body: `Sehr geehrte/r ~#rh_name,

mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als ~#job_title bei ~#company_name gelesen. Aufgrund meiner Qualifikationen und Erfahrungen bin ich überzeugt, dass ich eine wertvolle Ergänzung für Ihr Team wäre.

Besonders angesprochen hat mich die Möglichkeit, bei ~#company_name zu arbeiten, da Ihr Unternehmen für seine Innovationskraft und Professionalität bekannt ist.

Gerne stelle ich Ihnen meine Qualifikationen in einem persönlichen Gespräch vor. Über eine Einladung zu einem Vorstellungsgespräch würde ich mich sehr freuen.

Mit freundlichen Grüßen,
~#sender_name
~#sender_email
~#sender_phone`,
    language: 'de',
    isDefault: true,
  },
  {
    name: 'Nachfass-E-Mail - Deutsch',
    subject: 'Nachfrage zur Bewerbung als ~#job_title',
    body: `Sehr geehrte/r ~#rh_name,

ich hoffe, diese E-Mail erreicht Sie wohlauf. Ich möchte mich bezüglich meiner Bewerbung als ~#job_title bei ~#company_name vom ~#application_date erkundigen.

Mein Interesse an dieser Position ist nach wie vor sehr groß, und ich würde mich über eine Rückmeldung zum aktuellen Stand meiner Bewerbung freuen.

Für Rückfragen stehe ich Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
~#sender_name
~#sender_email`,
    language: 'de',
    isDefault: true,
  },
  // French Templates
  {
    name: 'Candidature Professionnelle - Français',
    subject: 'Candidature pour le poste de ~#job_title chez ~#company_name',
    body: `Madame, Monsieur ~#rh_name,

Je me permets de vous adresser ma candidature pour le poste de ~#job_title au sein de ~#company_name. Mon parcours et mes compétences correspondent parfaitement aux exigences de ce poste.

Je suis particulièrement intéressé(e) par cette opportunité car ~#company_name jouit d'une excellente réputation dans le secteur. Je suis convaincu(e) que mon expérience et ma motivation feront de moi un atout pour votre équipe.

Je reste à votre disposition pour un entretien afin de vous présenter plus en détail mes qualifications.

Cordialement,
~#sender_name
~#sender_email
~#sender_phone`,
    language: 'fr',
    isDefault: true,
  },
  {
    name: 'Email de Relance - Français',
    subject: 'Suivi de ma candidature pour ~#job_title',
    body: `Madame, Monsieur ~#rh_name,

J'espère que vous allez bien. Je me permets de revenir vers vous concernant ma candidature pour le poste de ~#job_title chez ~#company_name, que j'ai soumise le ~#application_date.

Je reste très intéressé(e) par cette opportunité et serais reconnaissant(e) de connaître l'état d'avancement de ma candidature.

Je reste à votre disposition pour toute information complémentaire.

Cordialement,
~#sender_name
~#sender_email`,
    language: 'fr',
    isDefault: true,
  },
];

async function seedDefaultTemplates() {
  console.log('🌱 Seeding default message templates...');

  for (const template of defaultTemplates) {
    await prisma.messageTemplate.upsert({
      where: {
        // Use a composite unique constraint or create one
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
      },
      update: template,
      create: {
        ...template,
        userId: null, // System templates have no user
      },
    });
  }

  console.log('✅ Default templates seeded successfully');
}

seedDefaultTemplates()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
