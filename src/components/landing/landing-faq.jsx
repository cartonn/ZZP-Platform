const questions = [
  {
    question: "Wat is Handslag?",
    answer:
      "Handslag brengt bemiddelaars, opdrachtgevers en zzp’ers bij elkaar. Zzp’ers kunnen opdrachten vinden, accepteren, uitvoeren en afronden. Het platform helpt om opdrachten, afspraken, uren en facturen op één plek bij te houden.",
  },
  {
    question: "Hoe verlopen de betalingen?",
    answer:
      "De opdrachtgever betaalt de zorgprofessional rechtstreeks, buiten Handslag om. In het platform houd je facturen en hun status bij. Handslag biedt geen vooruitbetaling of betalingsgarantie. Leg het tarief en de betaaltermijn vooraf samen vast.",
  },
  {
    question: "Wat is de rol van een bemiddelaar?",
    answer:
      "Een bemiddelaar brengt opdrachten en zzp’ers samen en begeleidt de samenwerking met de opdrachtgever. Handslag biedt de gezamenlijke plek om opdrachten en de afhandeling ervan te organiseren. De afspraken tussen de betrokken partijen bepalen wie welke verantwoordelijkheid heeft.",
  },
  {
    question: "Bepaalt Handslag mijn tarief?",
    answer:
      "Je maakt als zorgprofessional zelf afspraken met je opdrachtgever over het tarief, de opdracht en de voorwaarden. Bespreek die afspraken voordat je begint.",
  },
  {
    question: "Kan ik nu al aan de slag?",
    answer:
      "Handslag wordt gefaseerd in gebruik genomen. Je kunt een account aanmaken om kennis te maken. Controleer vóór een echte samenwerking welke dienstverlening en voorwaarden voor jou beschikbaar zijn.",
  },
];

export default function LandingFaq() {
  return (
    <div className="hv5-301" data-reveal="1">
      {questions.map(({ question, answer }) => (
        <details className="hv5-302 hs-faq-item" name="handslag-faq" key={question}>
          <summary className="hv5-304" data-interaction="faq">
            {question}
            <span className="hv5-305" aria-hidden="true">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              >
                <path d="M5 12h14" />
                <path className="hs-faq-plus" d="M12 5v14" />
              </svg>
            </span>
          </summary>
          <p className="hv5-306">{answer}</p>
        </details>
      ))}
    </div>
  );
}
