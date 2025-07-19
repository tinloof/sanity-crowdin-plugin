"use client";

import { ChevronUpIcon } from "@sanity/icons";
import { Button, Card, Flex, Heading, Stack } from "@sanity/ui";
import type { PropsWithChildren, ReactNode } from "react";
import React from "react";

export default function DocDashboardCard(
  props: PropsWithChildren<{
    title: string;
    subtitle?: ReactNode;
    headerActions?: ReactNode;
    collapsible?: boolean;
  }>,
) {
  const { collapsible: inputCollapsible = true } = props;
  const summaryRef = React.useRef<HTMLDivElement>(null);

  const collapsible = inputCollapsible && props.children !== null;

  return (
    <Card style={{ padding: "0.9375rem 0.65rem" }} border radius={1}>
      <Stack as={collapsible ? "details" : "div"}>
        <Flex
          as={collapsible ? "summary" : "div"}
          align="flex-start"
          gap={2}
          ref={summaryRef}
          style={{
            paddingLeft: "0.875rem",
          }}
        >
          <Stack space={3} flex={1} tabIndex={0} style={{ userSelect: "text" }}>
            <Flex gap={2} align="center">
              <Heading as="h2" size={1} style={{ fontWeight: "600" }}>
                {props.title}
              </Heading>
            </Flex>
            {props.subtitle || null}
          </Stack>
          {props.headerActions || null}
          {collapsible && (
            <Button
              fontSize={1}
              padding={2}
              icon={ChevronUpIcon}
              mode="bleed"
              onClick={(e) => {
                e.stopPropagation();
                summaryRef?.current?.click?.();
              }}
              aria-hidden
            />
          )}
        </Flex>
        <Stack
          style={{
            paddingLeft: "0.875rem",
          }}
          space={4}
        >
          {props.children}
        </Stack>
      </Stack>
    </Card>
  );
}
