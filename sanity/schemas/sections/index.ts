import hero from "./hero";

const sections = [hero].map((section) => ({
  ...section,
  preview: {
    select: {
      ...(section.preview?.select || {}),
    },
    prepare: (selection: Record<"title" | "values", any>) => {
      const basePreview = section?.preview?.prepare?.(selection) || {
        title: selection.title,
      };

      return {
        ...basePreview,
        subtitle: section.title,
      };
    },
  },
}));

export default sections;
