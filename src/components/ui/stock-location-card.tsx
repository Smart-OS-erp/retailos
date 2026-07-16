import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function StockLocationCard({
  locationName,
  stockLabel,
  valueLabel,
}: {
  locationName: string;
  stockLabel: string;
  valueLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{locationName}</CardTitle>
        <CardDescription>Stock location component</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="definition">
          <div>
            <dt>Stock</dt>
            <dd>{stockLabel}</dd>
          </div>
          <div>
            <dt>Value</dt>
            <dd>{valueLabel}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
