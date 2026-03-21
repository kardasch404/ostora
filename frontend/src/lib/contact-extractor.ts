/**
 * Advanced contact extraction from job HTML content
 * Supports multiple formats and fallback strategies
 */

export interface ContactInfo {
  name: string;
  position: string;
  email: string;
  phone: string;
}

export function extractContactInfo(html: string): ContactInfo {
  if (!html) return { name: "", position: "", email: "", phone: "" };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let name = "";
  let position = "";
  let email = "";
  let phone = "";

  // ── Strategy 1: .job-posting-contact-person structure ────────────────────────
  const contactPerson = doc.querySelector(".job-posting-contact-person");
  if (contactPerson) {
    name = contactPerson.querySelector(".job-posting-contact-person__name")?.textContent?.trim() || "";
    position = contactPerson.querySelector(".job-posting-contact-person__position")?.textContent?.trim() || "";
    const emailLink = contactPerson.querySelector(".job-posting-contact-person__email a");
    const phoneLink = contactPerson.querySelector(".job-posting-contact-person__phone a");
    
    email = emailLink?.getAttribute("href")?.replace("mailto:", "").trim() || "";
    phone = phoneLink?.getAttribute("href")?.replace("tel:", "").trim() || phoneLink?.textContent?.trim() || "";

    if (email || phone) {
      return { name, position, email, phone };
    }
  }

  // ── Strategy 2: "Kontakt:" section with structured text ──────────────────────
  const textContent = doc.body.textContent || "";
  const kontaktMatch = textContent.match(/Kontakt[:\s]*([^\n]+(?:\n[^\n]+){0,5})/i);
  if (kontaktMatch) {
    const kontaktSection = kontaktMatch[0];
    
    // Extract name (usually first line after "Kontakt:" or company name)
    const nameMatch = kontaktSection.match(/(?:Kontakt[:\s]*|\n)([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/i);
    if (nameMatch) name = nameMatch[1].trim();
    
    // Extract email
    const emailMatch = kontaktSection.match(/E-?Mail[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) email = emailMatch[1].trim();
    
    // Extract phone
    const phoneMatch = kontaktSection.match(/Tel\.?[:\s]*(\+?[\d\s\/\-()]{7,20})/i);
    if (phoneMatch) phone = phoneMatch[1].trim().replace(/\s+/g, " ");
  }

  // ── Strategy 3: Generic mailto: and tel: links ────────────────────────────────
  if (!email) {
    const emailLinks = doc.querySelectorAll('a[href^="mailto:"]');
    for (const link of emailLinks) {
      const href = link.getAttribute("href") || "";
      if (href.includes("?body=") || href.includes("?subject=") || href.includes("utm_source")) {
        continue;
      }
      const extractedEmail = href.replace("mailto:", "").split("?")[0].trim();
      if (extractedEmail && extractedEmail.includes("@")) {
        email = extractedEmail;
        break;
      }
    }
  }
  
  if (!phone) {
    const phoneLink = doc.querySelector('a[href^="tel:"]');
    phone = phoneLink?.getAttribute("href")?.replace("tel:", "").trim() || "";
  }

  // ── Strategy 4: Text-based email/phone extraction ─────────────────────────────
  if (!email) {
    const textEmail = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1];
    if (textEmail && !textEmail.includes("utm_source") && !textEmail.includes("share_vacancy")) {
      email = textEmail;
    }
  }
  
  if (!phone) {
    const textPhone = html.match(/(\+?\d{1,4}[\s\-]?\(?\d{1,5}\)?[\s\-]?\d{1,10}[\s\-]?\d{0,10})/)?.[1]?.trim();
    if (textPhone && textPhone.length >= 7) {
      phone = textPhone;
    }
  }

  // ── Strategy 5: Contact name extraction from common patterns ──────────────────
  if (!name) {
    const namePatterns = [
      /Ansprechpartner[:\s]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/i,
      /Kontaktperson[:\s]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/i,
      /Deine Kontaktperson[:\s]*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)+)/i,
      /([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß-]+)[\s\n]*(?:Recruiter|HR|Personalabteilung|Leitung)/i,
    ];

    for (const pattern of namePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        name = match[1].trim();
        break;
      }
    }
  }

  return { name, position, email, phone };
}

/**
 * Generate dynamic application message based on contact info
 */
export function generateApplicationMessage(
  contactName: string,
  jobTitle: string,
  companyName: string
): string {
  const greeting = contactName
    ? `Dear ${contactName},`
    : "Dear Hiring Team,";

  return `${greeting}

I am writing to apply for the position of ${jobTitle} at ${companyName}.

Please find my documents attached.

Best regards`;
}
