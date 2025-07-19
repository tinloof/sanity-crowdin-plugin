import { defineField } from "sanity";

export default defineField({
  title: "Hero section",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
  ],
  name: "section.hero",
});
