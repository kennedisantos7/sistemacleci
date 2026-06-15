import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title, etapa }: { title: string; etapa: string }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Em construção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo será implementado na <strong>{etapa}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
