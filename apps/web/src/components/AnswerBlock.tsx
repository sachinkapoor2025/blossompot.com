/** Answer-first block for FAQs and guides — optimized for AI Overview / LLM citation. */
export function AnswerBlock({
  question,
  answer,
  details,
}: {
  question: string;
  answer: string;
  details?: string;
}) {
  return (
    <article className="rounded-xl border border-primary/10 bg-white p-5 shadow-sm shadow-primary/5">
      <h3 className="font-semibold text-primary text-sm sm:text-base mb-2">{question}</h3>
      <p className="text-sm sm:text-[15px] text-slate-800 leading-relaxed font-medium">{answer}</p>
      {details ? (
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{details}</p>
      ) : null}
    </article>
  );
}
