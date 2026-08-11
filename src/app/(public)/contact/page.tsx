import { PageHero } from "@/components/PageHero"; import { ContactForm } from "@/components/ContactForm";
export default function ContactPage(){return <main><PageHero eyebrow="Contact" title="Parlez-nous de votre intérieur." text="Une question avant de créer votre dossier ? Écrivez-nous depuis ce formulaire."/><section className="shell section narrow"><ContactForm/></section></main>}
