import type {SanityImageProps as SanityImageBaseProps} from "@tinloof/sanity-web";

import config from "@/config";
import {SanityImage as SanityImageBase} from "@tinloof/sanity-web";

export type SanityImageProps = Omit<SanityImageBaseProps, "config">;

const imageConfig = {
  dataset: config.sanity.dataset,
  projectId: config.sanity.projectId,
};

export default function SanityImage(props: SanityImageProps) {
  return (
    <SanityImageBase
      config={imageConfig}
      {...props}
      data={props.data}
      lqip={false}
    />
  );
}
