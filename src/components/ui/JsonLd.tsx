// `<` escape করা, তাই ডেটার ভেতরে `</script>` দিয়ে কিছু ঢোকানো যায় না
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
