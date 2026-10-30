export const infoCard = "flex flex-col gap-2 rounded-lg bg-surface p-5 ring-1 ring-line-soft md:p-6";
export const infoBody = "text-[15px] leading-relaxed text-ink";

export function InfoPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro?: string;
  sections: { title: string; body: string[] }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
      {intro && <p className={infoBody}>{intro}</p>}
      {sections.map((section) => (
        <section key={section.title} className={infoCard}>
          <h2 className="text-base font-bold text-brand-text">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className={infoBody}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
