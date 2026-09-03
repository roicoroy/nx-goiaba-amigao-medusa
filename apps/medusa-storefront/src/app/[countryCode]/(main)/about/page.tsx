import { Metadata } from "next"

import AboutTemplate from "@modules/about/templates"

export const metadata: Metadata = {
  title: "About",
  description: "Learn more about our store and mission.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function AboutPage(props: Params) {
  const params = await props.params

  return <AboutTemplate countryCode={params.countryCode} />
}
