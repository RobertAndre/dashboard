import {
  AspectRatio,
  AspectRatioProps,
  Box,
  Center,
  Flex,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { Heading, Text } from "tw-components";

const charts = {
  area: {
    Wrapper: AreaChart,
    Element: Area,
    defs: (
      <defs>
        <linearGradient
          id="barColor"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3385FF" />
          <stop offset="1" stopColor="#224A85" />
        </linearGradient>
        <linearGradient
          id="areaColor"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3385FF" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
    ),
  },
} as const;

type ChartType = keyof typeof charts;

type Value = { value: number; timestamp: Date };
type QueryData = { result: Array<Value> };

export interface GraphWithLoadingStateProps extends AspectRatioProps {
  query: ReturnType<typeof useQuery<QueryData>>;
  chartType: ChartType;
  tooltipProps: {
    valueLabel: string;
    valueFormatter?: (value: number) => string;
  };
  limit: number;
}

export const GraphWithLoadingState: React.FC<GraphWithLoadingStateProps> = ({
  query,
  chartType,
  tooltipProps,
  limit,
  ...restProps
}) => {
  const [loadingStateData, setLoadingStateData] = useState(generateFakeData());

  const { Wrapper, Element } = useMemo(() => charts[chartType], [chartType]);

  useEffect(() => {
    if (!query.isLoading) {
      return;
    }
    let iteration = 0;
    const interval = setInterval(() => {
      setLoadingStateData(generateFakeData(iteration));
      iteration++;
    }, 1500);
    return () => clearInterval(interval);
  }, [query.isLoading]);

  const data = useMemo(
    () =>
      (query.isLoading ? loadingStateData : query.data?.result)?.slice(
        0,
        limit,
      ),
    [limit, loadingStateData, query.data?.result, query.isLoading],
  );

  return (
    <AspectRatio {...restProps}>
      <Box position="relative">
        {/* loading state */}
        {query.isLoading && (
          <Center
            position="absolute"
            top={0}
            bottom={0}
            right={0}
            left={0}
            borderRadius="lg"
            zIndex={2}
          >
            <Text color="faded" size="label.sm">
              Loading Data
            </Text>
          </Center>
        )}
        {/* wrapper */}

        <ResponsiveContainer width="100%" height="100%">
          <Wrapper data={data}>
            {charts[chartType].defs}
            <Element
              type="natural"
              dataKey="value"
              stroke="url(#barColor)"
              fill="url(#areaColor)"
              dot={false}
              activeDot={false}
            />
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              content={(props) => (
                <CustomToolTip
                  active={props.active}
                  payload={props.payload}
                  valueLabel={tooltipProps.valueLabel}
                  valueFormatter={tooltipProps.valueFormatter}
                />
              )}
              cursor={{
                stroke: "#3385FF",
                opacity: 0.3,
                strokeDasharray: 2,
              }}
            />
          </Wrapper>
        </ResponsiveContainer>
      </Box>
    </AspectRatio>
  );
};

function generateFakeData(iteration = 0): Array<Value> {
  const data = [];
  for (let i = 0; i < 7; i++) {
    const randomNess = Math.floor(Math.random() * 10) / 10 + 1;
    data.push({
      timestamp: new Date(),
      value: randomNess * (iteration % 2 ? (i % 2 ? 3 : 1) : i % 2 ? 1 : 3),
    });
  }
  return data;
}

type CustomToolTipProps = {
  valueLabel: string;
  active?: boolean;
  payload?: any;
  valueFormatter?: (value: any) => string;
};

const CustomToolTip: React.FC<CustomToolTipProps> = ({
  active,
  payload,
  valueLabel,
  valueFormatter,
}) => {
  if (active && payload && payload.length) {
    return (
      <Flex
        py={1}
        px={2}
        backdropFilter="blur(10px)"
        bg="transparent"
        flexDirection="column"
        gap={1}
        border="none"
        outline="none"
        borderRadius="lg"
      >
        {payload[0]?.payload?.timestamp && (
          <Flex direction="column" gap={0.5}>
            <Heading as="label" size="label.sm">
              Date
            </Heading>
            <Text size="body.sm">
              {new Date(payload[0].payload.timestamp).toLocaleDateString()}
            </Text>
          </Flex>
        )}
        <Flex direction="column" gap={0.5}>
          <Heading as="label" size="label.sm">
            {valueLabel}
          </Heading>
          <Text size="body.sm">
            {valueFormatter
              ? valueFormatter(payload[0].value)
              : payload[0].value}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return null;
};