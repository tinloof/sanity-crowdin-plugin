import definePage from "@/sanity/helpers/define-page";
import {CiHome} from "react-icons/ci";

export default definePage({
  name: "home",
  title: "Home",
  type: "document",
  icon: CiHome,
  fields: [
    {
      name: "sections",
      type: "sectionsBody",
      group: "content",
    },
  ],
  options: {
    disableCreation: true,
    hideInternalTitle: true,
  },
  pathnameOptions: {
    initialValue: "/",
  },
  preview: {
    prepare({locale}) {
      return {
        title: `(${locale}) Home`,
      };
    },
    select: {
      locale: "locale",
    },
  },
});
