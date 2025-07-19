import defineSchema from "@/sanity/helpers/define-schema";
import {CloseIcon} from "@sanity/icons";
import {definePathname} from "@tinloof/sanity-studio";

export default defineSchema({
  name: "notFound",
  title: "Not found page",
  type: "document",
  options: {
    disableCreation: true,
  },
  fields: [
    {
      ...definePathname({
        initialValue: {current: "/not-found"},
        readOnly: true,
      }),
    },
    {
      name: "locale",
      type: "string",
      hidden: true,
    },
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    },
  ],
  icon: CloseIcon,
  preview: {
    prepare: ({locale, title}) => ({
      title: `(${locale}) ${title}`,
    }),
    select: {
      locale: "locale",
      title: "title",
    },
  },
});
