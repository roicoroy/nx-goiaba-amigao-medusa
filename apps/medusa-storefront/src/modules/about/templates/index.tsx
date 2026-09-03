import { Heading, Text } from "@medusajs/ui"

const AboutTemplate = ({ countryCode }: { countryCode: string }) => {
  return (
    <div className="content-container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Heading level="h1" className="text-3xl mb-4">
            About Us
          </Heading>
        </div>

        <div className="flex flex-col gap-6 text-ui-fg-base">
          <section>
            <Heading level="h2" className="text-2xl mb-3">
              Our Story
            </Heading>
            <Text className="text-base leading-relaxed">
              Welcome to our store! We are passionate about providing you with
              the best products and an exceptional shopping experience. Our journey
              began with a simple mission: to make quality products accessible to
              everyone.
            </Text>
          </section>

          <section>
            <Heading level="h2" className="text-2xl mb-3">
              Our Mission
            </Heading>
            <Text className="text-base leading-relaxed">
              We believe in delivering excellence in every aspect of our business.
              From carefully curated products to outstanding customer service, we
              strive to exceed your expectations and build lasting relationships
              with our customers.
            </Text>
          </section>

          <section>
            <Heading level="h2" className="text-2xl mb-3">
              Why Choose Us
            </Heading>
            <Text className="text-base leading-relaxed">
              Our commitment to quality, customer satisfaction, and innovation sets
              us apart. We continuously work to improve our offerings and ensure
              that every interaction with our store is a positive one.
            </Text>
          </section>

          <section>
            <Heading level="h2" className="text-2xl mb-3">
              Contact Us
            </Heading>
            <Text className="text-base leading-relaxed">
              We'd love to hear from you! If you have any questions, feedback, or
              need assistance, please don't hesitate to reach out. Your satisfaction
              is our priority.
            </Text>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AboutTemplate
