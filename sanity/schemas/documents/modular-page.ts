import definePage from "@/sanity/helpers/define-page";
import {CiGrid2H} from "react-icons/ci";

export default definePage({
  name: "modular.page",
  title: "Modular page",
  type: "document",
  icon: CiGrid2H,
  fields: [
    {
      group: "content",
      name: "sections",
      type: "sectionsBody",
    },
  ],
});
