export type ChartConfigItem = {
  label: string;
  color: string;
};

export function generateMonthChartConfig<T extends { month: string }>(
  data: T[],
  colors: string[]
): Record<string, ChartConfigItem> {
  return data.reduce((config, item, index) => {
    config[item.month] = {
      label: item.month,
      color: colors[index] ?? "#000000",
    };
    return config;
  }, {} as Record<string, ChartConfigItem>);
}
