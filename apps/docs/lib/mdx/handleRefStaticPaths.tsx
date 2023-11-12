import { ICommonSection } from '~/components/reference/Reference.types'

async function handleRefGetStaticPaths(sections: ICommonSection[]) {
  // In production, generate static pages for every sub-section (better SEO)
  return {
    paths: sections.map((section) => {
      return {
        params: {
          slug: [section.slug],
        },
      }
    }),
    fallback: 'blocking',
  }
}

export default handleRefGetStaticPaths
