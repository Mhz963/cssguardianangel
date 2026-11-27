// Turns /english/*.json content into the items shown in each module's "Past Paper Questions" panel.
// Every item: { key, years: [YYYY, ...], ...fields the module renders }.

export function pastVocabularyItems(papers, type) {
  return (papers?.years || []).flatMap((y) =>
    (y.vocabulary || [])
      .filter((v) => !type || v.type === type)
      .filter((v) => v.options?.length && Number.isInteger(v.answer))
      .map((v, index) => ({ key: `v-${y.year}-${v.type}-${index}`, years: [y.year], ...v })),
  )
}

export function pastPrepositionItems(papers) {
  return (papers?.years || []).flatMap((y) =>
    (y.prepositions || []).map((p, index) => ({ key: `p-${y.year}-${index}`, years: [y.year], ...p })),
  )
}

export function pastPunctuationItems(papers) {
  return (papers?.years || []).flatMap((y) =>
    (y.punctuation || []).map((p, index) => ({ key: `pu-${y.year}-${index}`, years: [y.year], ...p })),
  )
}

export function pastCorrectionItems(items) {
  return (items || []).filter((i) => i.years?.length).map((i) => ({ ...i, key: i.id }))
}

export function pastPairItems(pairs) {
  return (pairs || []).filter((p) => p.years?.length).map((p) => ({ ...p, key: p.id }))
}
