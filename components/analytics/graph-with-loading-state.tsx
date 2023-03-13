import {
  AspectRatio,
  AspectRatioProps,
  Box,
  Center,
  Flex,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heading, Text } from "tw-components";

const charts = {
  area: {
    Wrapper: AreaChart,
    Element: Area,
    defs: (
      <defs>
        <linearGradient
          id="areaColor"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="5%" stopColor="#3385FF" stopOpacity={0.4} />
          <stop offset="75%" stopColor="#3385FF" stopOpacity={0} />
        </linearGradient>
      </defs>
    ),
  },
  bar: {
    Wrapper: BarChart,
    Element: Bar,
    defs: (
      <defs>
        <linearGradient
          id="areaColor"
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3385FF" />
          <stop offset="1" stopColor="#224A85" />
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
  reverse?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  startEndOnly?: boolean;
}

export const GraphWithLoadingState: React.FC<GraphWithLoadingStateProps> = ({
  query,
  chartType,
  tooltipProps,
  limit,
  reverse,
  showXAxis,
  showYAxis,
  startEndOnly,
  ...restProps
}) => {
  const [loadingStateData, setLoadingStateData] = useState(
    generateFakeData(0, limit),
  );

  const { Wrapper, Element } = useMemo(() => charts[chartType], [chartType]);

  useEffect(() => {
    if (!query.isLoading) {
      return;
    }
    let iteration = 0;
    const interval = setInterval(() => {
      setLoadingStateData(generateFakeData(iteration, limit));
      iteration++;
    }, 1500);
    return () => clearInterval(interval);
  }, [query.isLoading, limit]);

  const data = useMemo(() => {
    if (query.isLoading || !query.data?.result) {
      return loadingStateData;
    }
    const copiedData = [...query.data.result.slice(0, limit)];
    if (reverse) {
      return copiedData.reverse();
    }
    return copiedData;
  }, [limit, loadingStateData, query.data?.result, query.isLoading, reverse]);

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
            {/* @ts-expect-error - this works fine */}
            <Element
              type="natural"
              dataKey="value"
              stroke="#3385FF"
              fill="url(#areaColor)"
              dot={false}
              activeDot={false}
              strokeWidth={chartType === "area" ? 1.5 : 0}
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
                fill: "#3385FF",
                opacity: 0.3,
                strokeDasharray: 2,
                strokeWidth: chartType === "area" ? 2 : 0,
              }}
            />

            <XAxis
              hide={!showXAxis}
              dataKey="timestamp"
              tickFormatter={(payload) =>
                new Date(payload).toLocaleDateString(
                  undefined,
                  formattingOptions,
                )
              }
              style={{
                fontSize: "12px",
                fontFamily: "var(--chakra-fonts-body)",
              }}
              stroke="var(--chakra-colors-paragraph)"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              padding={{ left: 8, right: 8 }}
              minTickGap={5}
              tick={{ transform: "translate(0, 6)" }}
              ticks={
                startEndOnly
                  ? [
                      data[0]["timestamp"]?.toString(),
                      data[data.length - 1]["timestamp"]?.toString(),
                    ]
                  : undefined
              }
            />

            <YAxis
              hide={!showYAxis}
              width={52}
              tickFormatter={tooltipProps.valueFormatter}
              style={{
                fontSize: "12px",
                fontFamily: "var(--chakra-fonts-body)",
              }}
              tick={{ transform: "translate(-3, 0)" }}
              type="number"
              stroke="var(--chakra-colors-paragraph)"
              tickLine={false}
              axisLine={false}
            />
          </Wrapper>
        </ResponsiveContainer>
      </Box>
    </AspectRatio>
  );
};

function generateFakeData(iteration = 0, elements = 7): Array<Value> {
  const data = [];
  for (let i = 0; i < elements; i++) {
    const random = Math.floor(Math.random() * 10) / 10 + 1;
    data.push({
      timestamp: new Date(),
      value: random * (iteration % 2 ? (i % 2 ? 3 : 1) : i % 2 ? 1 : 3),
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

const formattingOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
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
        py={1.5}
        px={2.5}
        backdropFilter="blur(10px)"
        bg="transparent"
        flexDirection="column"
        gap={1}
        border="none"
        outline="none"
        borderRadius="lg"
        _dark={{
          bg: "rgba(0,0,0,0.2)",
        }}
        _light={{
          bg: "rgba(255,255,255,0.2)",
        }}
      >
        {payload[0]?.payload?.timestamp && (
          <Flex direction="column" gap={0.5}>
            <Heading as="label" size="label.sm">
              Date
            </Heading>
            <Text size="body.sm">
              {new Date(payload[0].payload.timestamp).toLocaleDateString(
                undefined,
                formattingOptions,
              )}
            </Text>
          </Flex>
        )}
        <Flex direction="column" gap={0.5}>
          <Heading as="label" size="label.sm">
            {valueLabel}
          </Heading>
          <Text size="body.sm" fontFamily="mono">
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
